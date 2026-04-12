import { NextRequest, NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/assert-admin';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // AI generation can take up to 60s

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * Search Pexels for a relevant landscape image.
 * Falls back to null if the key is missing or the search fails.
 */
async function searchImage(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&size=large`,
      { headers: { Authorization: apiKey } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.photos?.[0]?.src?.large2x || data.photos?.[0]?.src?.large || null;
  } catch {
    return null;
  }
}

const SYSTEM_PROMPT = `Tu es un rédacteur SEO expert en neurodéveloppement (autisme, TDAH, DYS). Tu écris des articles pour NeuroCare, une plateforme française qui met en relation les familles d'enfants neuroatypiques avec des professionnels spécialisés (éducateurs spécialisés, psychologues, orthophonistes, etc.).

Tes articles doivent :
- Être rédigés en français courant, accessibles aux parents non-spécialistes
- Avoir un ton bienveillant, informatif et rassurant
- Être optimisés SEO pour le mot-clé cible
- Contenir environ 800 mots
- Utiliser une structure HTML avec des balises h2, h3, p, ul, li
- Inclure des informations factuelles et vérifiables
- Mentionner NeuroCare naturellement comme ressource (1-2 fois maximum)
- Ne jamais donner de conseils médicaux directs, toujours orienter vers des professionnels

IMPORTANT : Tu dois répondre UNIQUEMENT avec un objet JSON valide, sans texte avant ou après. Le format exact est :
{
  "title": "Titre SEO optimisé (max 60 caractères)",
  "metaDescription": "Meta description engageante (max 155 caractères)",
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5"],
  "content": "<h2>...</h2><p>...</p>...",
  "imagePrompt": "Description en anglais d'une image illustrative à générer"
}`;

export async function POST(request: NextRequest) {
  const { error: authError } = await assertAdmin();
  if (authError) return authError;

  try {
    const { topic, keyword, secondaryKeywords } = await request.json();

    if (!topic || !keyword) {
      return NextResponse.json(
        { error: 'Le sujet et le mot-clé sont requis' },
        { status: 400 }
      );
    }

    const userPrompt = `Rédige un article SEO complet sur le sujet suivant :

Sujet : ${topic}
Mot-clé principal : ${keyword}
${secondaryKeywords?.length ? `Mots-clés secondaires : ${secondaryKeywords.join(', ')}` : ''}

L'article doit faire environ 800 mots, être structuré avec des h2 et h3, et être optimisé pour le mot-clé principal "${keyword}".

Rappel : réponds UNIQUEMENT avec un objet JSON valide.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    });

    const textContent = response.content.find(
      (block) => block.type === 'text'
    );

    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { error: 'Aucune réponse textuelle de l\'IA' },
        { status: 500 }
      );
    }

    // Parse the JSON response - handle potential markdown code block wrapping
    let rawText = textContent.text.trim();
    // Remove markdown code fences if present
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }

    let generated;
    try {
      generated = JSON.parse(rawText);
    } catch {
      console.error('Failed to parse AI response:', rawText.substring(0, 200));
      return NextResponse.json(
        { error: 'Erreur lors du parsing de la réponse IA', raw: rawText.substring(0, 500) },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!generated.title || !generated.content) {
      return NextResponse.json(
        { error: 'Réponse IA incomplète (titre ou contenu manquant)' },
        { status: 500 }
      );
    }

    // Search for a relevant image using keywords
    const imageQuery = generated.keywords?.slice(0, 3).join(' ') || keyword;
    const imageUrl = await searchImage(imageQuery);

    return NextResponse.json({
      title: generated.title,
      metaDescription: generated.metaDescription || '',
      keywords: generated.keywords || [],
      content: generated.content,
      imagePrompt: generated.imagePrompt || '',
      imageUrl: imageUrl || null,
    });
  } catch (error: unknown) {
    console.error('AI generation error:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

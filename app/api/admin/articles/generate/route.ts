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

## STYLE ET TON
- Français courant, accessible aux parents non-spécialistes
- Ton bienveillant, informatif et rassurant
- Ne jamais donner de conseils médicaux directs, toujours orienter vers des professionnels
- Style ÉPURÉ et AÉRÉ — pas de blocs visuels lourds

## STRUCTURE HTML OBLIGATOIRE
Produis du HTML propre et simple, comme un article éditorial de qualité. Voici les SEULES balises autorisées :

1. **Introduction** : un seul <p> d'accroche qui résume l'article (2-3 phrases)
2. **Sections** : <h2> pour les grandes parties
3. **Sous-sections** : <h3> à l'intérieur des sections
4. **Paragraphes** : <p> pour le texte courant — c'est l'élément principal de l'article
5. **Listes** : <ul><li> pour les énumérations (JAMAIS de listes en texte brut)
6. **Mise en valeur** : <strong> pour les termes importants
7. **Liens** : intègre 2-4 liens vers des sources officielles françaises DIRECTEMENT dans le texte des paragraphes :
   <a href="URL" target="_blank" rel="noopener noreferrer" style="color: #0d9488; text-decoration: underline;">texte du lien</a>
   Sources : HAS (has-sante.fr), service-public.fr, ameli.fr, autismeinfoservice.fr, cnsa.fr, education.gouv.fr

RÈGLE ABSOLUE : UN SEUL encadré coloré maximum dans tout l'article, pour UN conseil clé vraiment important. Format :
<div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
  <p style="font-weight: 600; color: #0f766e; margin: 0 0 8px;">Bon à savoir</p>
  <p style="color: #115e59; margin: 0;">Contenu du conseil</p>
</div>

NE PAS utiliser plus d'un encadré. Le reste de l'article doit être du texte simple avec h2/h3/p/ul/strong.

## CONTENU
- Environ 1200 mots
- Optimisé SEO pour le mot-clé cible
- Mentionner NeuroCare naturellement 1-2 fois max
- Inclure des informations factuelles et vérifiables
- Terminer par une conclusion avec un CTA vers NeuroCare

IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après :
{
  "title": "Titre SEO optimisé (max 60 caractères)",
  "metaDescription": "Meta description engageante (max 155 caractères)",
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5"],
  "content": "<p>Introduction...</p><h2>...</h2>...",
  "imagePrompt": "Description en anglais d'une image illustrative"
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

CONSIGNES :
- Environ 1200 mots, style éditorial propre : h2, h3, paragraphes, listes <ul><li>
- Inclus 2-4 liens vers des sources officielles françaises directement dans le texte
- UN SEUL encadré coloré maximum dans tout l'article
- Optimisé SEO pour "${keyword}"
- Termine par une conclusion avec mention naturelle de NeuroCare

Réponds UNIQUEMENT avec un objet JSON valide.`;

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

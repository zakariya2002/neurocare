import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function searchImage(query) {
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

async function regenerateArticle(blogPost) {
  console.log(`\n--- Régénération : "${blogPost.title}" (id: ${blogPost.id}) ---`);

  const keyword = blogPost.title;
  const userPrompt = `Rédige un article SEO complet sur le sujet suivant :

Sujet : ${blogPost.title}
Mot-clé principal : ${keyword}

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
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textContent = response.content.find((b) => b.type === 'text');
  if (!textContent) throw new Error('No text content in response');

  let rawText = textContent.text.trim();
  if (rawText.startsWith('```')) {
    rawText = rawText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  const generated = JSON.parse(rawText);

  // Count callout boxes to verify
  const calloutCount = (generated.content.match(/background-color:\s*#f0fdfa/g) || []).length;
  console.log(`  Encadrés colorés : ${calloutCount}`);

  // Search for image
  const imageQuery = generated.keywords?.slice(0, 3).join(' ') || keyword;
  const imageUrl = await searchImage(imageQuery);
  console.log(`  Image : ${imageUrl ? 'trouvée' : 'non trouvée'}`);

  // Extract excerpt
  const plainText = generated.content.replace(/<[^>]*>/g, '').trim();
  const excerpt = plainText.length > 200
    ? plainText.substring(0, 200).trim() + '...'
    : plainText;

  const wordCount = plainText.split(/\s+/).length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Update blog_posts
  const { error } = await supabase
    .from('blog_posts')
    .update({
      title: generated.title,
      excerpt,
      content: generated.content,
      image_url: imageUrl || blogPost.image_url,
      read_time_minutes: readTimeMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', blogPost.id);

  if (error) {
    console.error(`  ERREUR update blog_posts:`, error.message);
    return;
  }

  // Also update content_calendar if linked
  const { data: calEntry } = await supabase
    .from('content_calendar')
    .select('id')
    .eq('blog_post_id', blogPost.id)
    .single();

  if (calEntry) {
    await supabase
      .from('content_calendar')
      .update({
        generated_title: generated.title,
        generated_description: generated.metaDescription,
        generated_keywords: generated.keywords,
        generated_content: generated.content,
        image_url: imageUrl || blogPost.image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', calEntry.id);
  }

  console.log(`  ✓ Article mis à jour (${wordCount} mots, ${readTimeMinutes} min)`);
}

async function main() {
  // Get all published blog posts that are AI-generated (author_id is null)
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .is('author_id', null)
    .eq('status', 'published');

  if (error) {
    console.error('Erreur récupération articles:', error.message);
    process.exit(1);
  }

  console.log(`${posts.length} articles AI publiés trouvés`);

  for (const post of posts) {
    try {
      await regenerateArticle(post);
    } catch (err) {
      console.error(`Erreur pour "${post.title}":`, err.message);
    }
  }

  console.log('\n=== Terminé ===');
}

main();

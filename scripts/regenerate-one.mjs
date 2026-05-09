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

const SYSTEM_PROMPT = `Tu es un rédacteur SEO expert en neurodéveloppement (autisme, TDAH, DYS). Tu écris des articles pour NeuroCare, une plateforme française qui met en relation les familles d'enfants neuroatypiques avec des professionnels spécialisés.

## STRUCTURE HTML
Produis du HTML propre et simple :
- <p> pour l'introduction et les paragraphes
- <h2> pour les sections, <h3> pour les sous-sections
- <ul><li> pour les listes
- <strong> pour la mise en valeur
- Liens inline vers des sources officielles : <a href="URL" target="_blank" rel="noopener noreferrer" style="color: #0d9488; text-decoration: underline;">texte</a>
- UN SEUL encadré coloré max :
  <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
    <p style="font-weight: 600; color: #0f766e; margin: 0 0 8px;">Bon à savoir</p>
    <p style="color: #115e59; margin: 0;">Contenu</p>
  </div>

Environ 1200 mots. Ton bienveillant et accessible. Mentionner NeuroCare 1-2 fois max.

IMPORTANT : Réponds UNIQUEMENT avec un objet JSON valide (pas de guillemets non échappés dans les valeurs) :
{
  "title": "Titre",
  "metaDescription": "Description",
  "keywords": ["k1", "k2", "k3"],
  "content": "<p>...</p>",
  "imagePrompt": "image description in english"
}

ATTENTION : Dans le JSON, tous les guillemets dans le contenu HTML doivent être échappés avec \\". Utilise des guillemets simples pour les attributs HTML style si possible.`;

const POST_ID = 'db3d2a3e-df06-426e-9ead-fea0786a7c18';

async function main() {
  const { data: post } = await supabase.from('blog_posts').select('*').eq('id', POST_ID).single();
  if (!post) { console.error('Article non trouvé'); return; }

  console.log(`Régénération : "${post.title}"`);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `Rédige un article SEO sur : Nutrition et autisme : alimentation adaptée pour enfants autistes. Style éditorial propre, UN SEUL encadré coloré max, liens vers sources officielles dans le texte. Réponds en JSON valide uniquement.` }],
  });

  const textContent = response.content.find((b) => b.type === 'text');
  let rawText = textContent.text.trim();
  if (rawText.startsWith('```')) {
    rawText = rawText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  let generated;
  try {
    generated = JSON.parse(rawText);
  } catch (e) {
    console.error('JSON parse error:', e.message);
    console.error('Raw (first 500 chars):', rawText.substring(0, 500));
    console.error('Raw (around error pos):', rawText.substring(3050, 3100));
    return;
  }

  const calloutCount = (generated.content.match(/background-color/g) || []).length;
  console.log(`Encadrés : ${calloutCount}`);

  const imageQuery = generated.keywords?.slice(0, 3).join(' ') || 'nutrition autisme enfant';
  const imageUrl = await searchImage(imageQuery);

  const plainText = generated.content.replace(/<[^>]*>/g, '').trim();
  const excerpt = plainText.length > 200 ? plainText.substring(0, 200).trim() + '...' : plainText;
  const wordCount = plainText.split(/\s+/).length;

  const { error } = await supabase.from('blog_posts').update({
    title: generated.title,
    excerpt,
    content: generated.content,
    image_url: imageUrl || post.image_url,
    read_time_minutes: Math.max(1, Math.ceil(wordCount / 200)),
    updated_at: new Date().toISOString(),
  }).eq('id', POST_ID);

  if (error) console.error('Update error:', error.message);
  else console.log(`✓ Mis à jour (${wordCount} mots)`);
}

main();

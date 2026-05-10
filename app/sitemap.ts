import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { FEATURES } from '@/lib/feature-flags'
import { DIRECTORY_TYPE_CODES } from '@/lib/annuaire/types'
import pcoSeed from '@/data/annuaire/pco.json'
import craSeed from '@/data/annuaire/cra.json'
import mdphSeed from '@/data/annuaire/mdph.json'
import camspSeed from '@/data/annuaire/camsp.json'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://neuro-care.fr'
  const currentDate = new Date()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Static editorial blog slugs (file-backed pages under app/blog/<slug>/page.tsx)
  const editorialBlogSlugs = [
    'activite-physique',
    'bien-etre-aidants',
    'crises-sensorielles',
    'harcelement-scolaire',
    'mdph-dossier',
    'nutrition',
    'preparer-consultation',
    'psychomotricien',
    'quel-professionnel-choisir-tnd',
    'signes-autisme-enfant',
    'temoignage-famille',
  ]

  // Fetch all public educator profile IDs for dynamic sitemap entries
  let educatorEntries: MetadataRoute.Sitemap = []
  try {
    const { data: educators } = await supabase
      .from('public_educator_profiles')
      .select('id')

    if (educators && educators.length > 0) {
      educatorEntries = educators.map((e) => ({
        url: `${baseUrl}/educator/${e.id}`,
        lastModified: currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch {
    // Silently ignore — sitemap still works without educator entries
  }

  // Fetch published blog post slugs from DB
  let blogPostEntries: MetadataRoute.Sitemap = []
  let proBlogPostEntries: MetadataRoute.Sitemap = []
  try {
    let { data: posts, error: postsErr } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at, audience')
      .eq('status', 'published')

    if (postsErr) {
      // Fallback: audience column may not exist yet
      const fallback = await supabase
        .from('blog_posts')
        .select('slug, updated_at, published_at')
        .eq('status', 'published')
      posts = fallback.data as any
    }

    const editorialSet = new Set(editorialBlogSlugs)
    const all = (posts || []).filter((p: any) => p.slug)

    blogPostEntries = all
      .filter(
        (p: any) =>
          !editorialSet.has(p.slug) &&
          (p.audience == null || p.audience === 'family' || p.audience === 'both')
      )
      .map((p: any) => ({
        url: `${baseUrl}/blog/${p.slug}`,
        lastModified: p.updated_at
          ? new Date(p.updated_at)
          : p.published_at
            ? new Date(p.published_at)
            : currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))

    proBlogPostEntries = all
      .filter((p: any) => p.audience === 'pro' || p.audience === 'both')
      .map((p: any) => ({
        url: `${baseUrl}/pro/blog/${p.slug}`,
        lastModified: p.updated_at
          ? new Date(p.updated_at)
          : p.published_at
            ? new Date(p.published_at)
            : currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      }))
  } catch {
    // Silently ignore — sitemap still works without DB blog entries
  }

  return [
    // Page d'accueil — mot-clé principal : "éducateur autisme"
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },

    // Recherche — "trouver éducateur autisme près de chez moi"
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1,
    },

    // Espace Pro — "plateforme éducateurs TND"
    {
      url: `${baseUrl}/pro`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // Devenir libéral — "devenir éducateur libéral autisme"
    {
      url: `${baseUrl}/pro/devenir-liberal`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },

    // Blog — contenu longue traîne
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },

    // Pages familles — "aides autisme", "simulateur AEEH"
    {
      url: `${baseUrl}/familles/aides-financieres`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/familles/simulateur-aides`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },

    // Pages principales
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },

    // Pro sous-pages — guides
    {
      url: `${baseUrl}/pro/sap-accreditation`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pro/how-it-works`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pro/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/educators/sap-accreditation`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // Blog articles — pages éditoriales statiques
    ...editorialBlogSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),

    // Blog articles — articles dynamiques (DB)
    ...blogPostEntries,

    // Blog Pro — index
    {
      url: `${baseUrl}/pro/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // Blog Pro — articles dynamiques (DB)
    ...proBlogPostEntries,

    // Annuaire TND — page principale
    {
      url: `${baseUrl}/ressources/lieux-adaptes`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },

    // Annuaire TND — pages par région
    ...[
      'auvergne-rhone-alpes',
      'bourgogne-franche-comte',
      'bretagne',
      'centre-val-de-loire',
      'corse',
      'grand-est',
      'guadeloupe',
      'guyane',
      'hauts-de-france',
      'ile-de-france',
      'la-reunion',
      'martinique',
      'mayotte',
      'normandie',
      'nouvelle-aquitaine',
      'occitanie',
      'pays-de-la-loire',
      'provence-alpes-cote-dazur',
    ].map((slug) => ({
      url: `${baseUrl}/ressources/lieux-adaptes/${slug}`,
      lastModified: currentDate,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),

    // Annuaire externe (A5) — PCO, CRA, MDPH, CAMSP
    ...(FEATURES.annuaireExterne
      ? buildAnnuaireSitemap(currentDate)
      : []),

    // Pages de ville — SEO longue traîne "éducateur autisme [ville]"
    ...[
      'paris', 'lyon', 'marseille', 'toulouse', 'bordeaux', 'lille',
      'nantes', 'strasbourg', 'montpellier', 'rennes', 'nice', 'grenoble',
      'rouen', 'toulon', 'dijon', 'angers', 'clermont-ferrand', 'tours',
      'metz', 'reims', 'saint-etienne', 'le-havre', 'caen', 'brest',
      'perpignan', 'aix-en-provence', 'boulogne-billancourt', 'montreuil',
      'versailles', 'saint-denis',
    ].map((city) => ({
      url: `${baseUrl}/search/${city}`,
      lastModified: currentDate,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),

    // Communauté
    {
      url: `${baseUrl}/community`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.6,
    },

    // Auth
    {
      url: `${baseUrl}/auth/register-educator`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.4,
    },

    // Pages légales
    ...[
      'cgu',
      'mentions-legales',
      'politique-confidentialite',
    ].map((page) => ({
      url: `${baseUrl}/${page}`,
      lastModified: currentDate,
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    })),

    // Profils éducateurs — pages dynamiques
    ...educatorEntries,
  ]
}

// ─── Annuaire externe (A5) ─────────────────────────────────────
type AnnuaireSeedRow = {
  type: string
  slug: string
  department_code?: string | null
  updated_at?: string | null
}

function buildAnnuaireSitemap(currentDate: Date): MetadataRoute.Sitemap {
  const baseUrl = 'https://neuro-care.fr'

  const allSeed: AnnuaireSeedRow[] = [
    ...(pcoSeed as AnnuaireSeedRow[]),
    ...(craSeed as AnnuaireSeedRow[]),
    ...(mdphSeed as AnnuaireSeedRow[]),
    ...(camspSeed as AnnuaireSeedRow[]),
  ]

  const entries: MetadataRoute.Sitemap = []

  // Page d'accueil annuaire
  entries.push({
    url: `${baseUrl}/annuaire`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.9,
  })

  // Pages par type
  for (const type of DIRECTORY_TYPE_CODES) {
    entries.push({
      url: `${baseUrl}/annuaire/${type}`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    })
  }

  // Pages par type + département (basé sur les départements présents)
  const typeDeptSet = new Set<string>()
  for (const e of allSeed) {
    if (e.department_code) typeDeptSet.add(`${e.type}|${e.department_code}`)
  }
  for (const key of typeDeptSet) {
    const [type, dept] = key.split('|')
    entries.push({
      url: `${baseUrl}/annuaire/${type}/${dept}`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    })
  }

  // Pages détail par entrée
  for (const e of allSeed) {
    if (!e.department_code) continue
    const lastMod = e.updated_at ? new Date(e.updated_at) : currentDate
    entries.push({
      url: `${baseUrl}/annuaire/${e.type}/${e.department_code}/${e.slug}`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.75,
    })
  }

  return entries
}

import Link from 'next/link';
import { getPublishedPosts } from '@/lib/blog/actions';
import PublicNavbar from '@/components/PublicNavbar';
import BlogEducatorCTA from '@/components/blog/BlogEducatorCTA';
import BlogList from '@/components/blog/BlogList';
import NewsletterForm from '@/components/NewsletterForm';
import SocialLinks from '@/components/SocialLinks';

export const revalidate = 3600;

// Articles éditoriaux NeuroCare (statiques)
const editorialArticles = [
  {
    id: 'editorial-1',
    slug: 'preparer-consultation',
    title: 'Préparer son enfant à une première consultation',
    excerpt:
      "Une première consultation avec un professionnel peut être source de stress, tant pour l'enfant que pour les parents. Voici nos conseils pour bien la préparer.",
    category: 'daily_life',
    tags: ['consultation', 'parents', 'préparation'],
    image_url: '/images/articles/consultation.jpg',
    read_time_minutes: 7,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-2',
    slug: 'crises-sensorielles',
    title: 'Gérer les crises sensorielles : techniques et outils pratiques',
    excerpt:
      'Les crises sensorielles sont fréquentes chez les enfants TND. Comprendre leurs mécanismes permet de mieux les accompagner.',
    category: 'daily_life',
    tags: ['sensoriel', 'autisme', 'quotidien'],
    image_url: '/images/articles/crises-sensorielles.jpg',
    read_time_minutes: 8,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-3',
    slug: 'mdph-dossier',
    title: 'MDPH : constituer son dossier efficacement',
    excerpt:
      'La MDPH est un passage incontournable pour obtenir la reconnaissance du handicap. Ce guide vous accompagne pour constituer un dossier complet.',
    category: 'rights',
    tags: ['MDPH', 'démarches', 'AEEH', 'handicap'],
    image_url: '/images/articles/mdph.jpg',
    read_time_minutes: 10,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-4',
    slug: 'psychomotricien',
    title: 'Que fait un psychomotricien ? Zoom sur cette profession méconnue',
    excerpt:
      "Le psychomotricien est souvent un professionnel clé dans l'accompagnement des enfants TND. Découvrons ensemble ce métier passionnant.",
    category: 'professionals',
    tags: ['psychomotricien', 'métier', 'accompagnement'],
    image_url: '/images/articles/psychomotricien.jpg',
    read_time_minutes: 6,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-5',
    slug: 'bien-etre-aidants',
    title: 'Prendre soin de soi quand on est parent aidant',
    excerpt:
      "Accompagner un enfant avec un TND est un marathon. Prendre soin de vous n'est pas un luxe, c'est une nécessité.",
    category: 'testimonials',
    tags: ['aidants', 'bien-être', 'parents'],
    image_url: '/images/articles/bien-etre-aidants.jpg',
    read_time_minutes: 8,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-6',
    slug: 'temoignage-famille',
    title: 'Portrait de famille : "NeuroCare a changé notre quotidien"',
    excerpt:
      'Émilie et Thomas sont les parents de Théo, 7 ans, diagnostiqué TSA et TDAH. Ils nous racontent leur parcours.',
    category: 'testimonials',
    tags: ['témoignage', 'TSA', 'TDAH', 'famille'],
    image_url: '/images/articles/temoignage-famille.jpg',
    read_time_minutes: 6,
    published_at: '2024-12-25T10:00:00Z',
    created_at: '2024-12-25T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-7',
    slug: 'signes-autisme-enfant',
    title: "Quels sont les signes de l'autisme chez l'enfant ? Guide pour les parents",
    excerpt:
      "Repérez les premiers signes de l'autisme chez votre enfant : signaux à 6 mois, 12 mois, 2 ans et 3 ans. Quand consulter et quelles démarches entreprendre.",
    category: 'daily_life',
    tags: ['autisme', 'signes', 'dépistage', 'TSA'],
    image_url:
      'https://images.pexels.com/photos/8386188/pexels-photo-8386188.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    read_time_minutes: 8,
    published_at: '2026-04-08T10:00:00Z',
    created_at: '2026-04-08T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
  {
    id: 'editorial-8',
    slug: 'quel-professionnel-choisir-tnd',
    title: 'Quel professionnel pour votre enfant autiste ou TDAH ? Le guide complet',
    excerpt:
      'Éducateur spécialisé, psychologue, orthophoniste, psychomotricien, ergothérapeute, neuropsychologue : quel professionnel choisir pour accompagner un enfant TND ?',
    category: 'professionals',
    tags: ['TND', 'guide', 'professionnel', 'autisme'],
    image_url:
      'https://images.pexels.com/photos/8653975/pexels-photo-8653975.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    read_time_minutes: 9,
    published_at: '2026-04-08T10:00:00Z',
    created_at: '2026-04-08T10:00:00Z',
    author: { first_name: 'Équipe', last_name: 'NeuroCare' },
  },
];

export default async function BlogPage() {
  const result = await getPublishedPosts({ limit: 20 });
  const articles = [...editorialArticles, ...result.posts].sort(
    (a, b) =>
      new Date(b.published_at || b.created_at).getTime() -
      new Date(a.published_at || a.created_at).getTime()
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      <PublicNavbar />

      {/* Hero */}
      <section className="pt-20 xl:pt-22 pb-8 sm:pb-12 px-4" style={{ backgroundColor: '#0a9a9a' }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">Blog NeuroCare</h1>
          <p className="text-sm sm:text-lg text-white/80 px-2">
            Ressources, conseils et actualités pour accompagner les personnes neuro-atypiques
          </p>
          <BlogEducatorCTA />
        </div>
      </section>

      {/* Articles */}
      <section className="py-6 sm:py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <BlogList articles={articles as any} />
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-8 sm:py-12 px-4 bg-gray-100">
        <div className="max-w-2xl mx-auto">
          <NewsletterForm
            variant="inline"
            audience="famille"
            source="blog_page"
            className="shadow-sm"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="text-white py-6 sm:py-10 px-3 sm:px-4 md:px-6" style={{ backgroundColor: '#027e7e' }} role="contentinfo">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-5 sm:mb-8">
            <div>
              <Link href="/" className="inline-block mb-3" aria-label="Retour à l'accueil NeuroCare">
                <img src="/images/logo-neurocare.svg" alt="Logo NeuroCare" className="h-16 brightness-0 invert" />
              </Link>
              <p className="text-sm leading-relaxed text-teal-100 mb-4">
                La plateforme qui connecte les familles avec des professionnels du neurodéveloppement vérifiés et
                qualifiés.
              </p>
              <SocialLinks variant="light" />
            </div>

            <nav aria-labelledby="footer-nav-1">
              <h3 id="footer-nav-1" className="font-bold text-white mb-3">
                Navigation
              </h3>
              <ul className="space-y-2 text-sm text-teal-100">
                <li>
                  <Link href="/search" className="hover:text-white transition-colors">
                    Trouver un professionnel
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-white transition-colors">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/glossaire" className="hover:text-white transition-colors">
                    Glossaire TND
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby="footer-nav-2">
              <h3 id="footer-nav-2" className="font-bold text-white mb-3">
                Familles
              </h3>
              <ul className="space-y-2 text-sm text-teal-100">
                <li>
                  <Link href="/auth/signup" className="hover:text-white transition-colors">
                    Créer un compte
                  </Link>
                </li>
                <li>
                  <Link href="/familles/aides-financieres" className="hover:text-white transition-colors">
                    Aides financières
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </nav>

            <nav aria-labelledby="footer-nav-3">
              <h3 id="footer-nav-3" className="font-bold text-white mb-3">
                Professionnels
              </h3>
              <ul className="space-y-2 text-sm text-teal-100">
                <li>
                  <Link href="/pro" className="hover:text-white transition-colors">
                    Espace Pro
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="hover:text-white transition-colors">
                    Rejoindre neurocare
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <div className="border-t border-teal-500 pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <nav aria-label="Informations légales">
                <div className="flex flex-wrap justify-center gap-4 text-sm text-teal-100">
                  <Link href="/mentions-legales" className="hover:text-white transition-colors">
                    Mentions légales
                  </Link>
                  <Link href="/politique-confidentialite" className="hover:text-white transition-colors">
                    Politique de confidentialité
                  </Link>
                  <Link href="/cgu" className="hover:text-white transition-colors">
                    CGU
                  </Link>
                </div>
              </nav>

              <p className="text-sm text-teal-100">© 2024 NeuroCare. Tous droits réservés.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

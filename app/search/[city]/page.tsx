import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// ─── City definitions ──────────────────────────────────────────
interface CityData {
  name: string;
  region: string;
  department: string;
  description: string;
  nearbyTip: string;
}

const CITIES: Record<string, CityData> = {
  paris: {
    name: 'Paris',
    region: 'Île-de-France',
    department: 'Paris (75)',
    description: 'capitale française, avec de nombreux centres de diagnostic et de prise en charge du neurodéveloppement',
    nearbyTip: 'Pensez aussi aux professionnels en banlieue parisienne : Boulogne-Billancourt, Montreuil, Saint-Denis, Nanterre.',
  },
  lyon: {
    name: 'Lyon',
    region: 'Auvergne-Rhône-Alpes',
    department: 'Rhône (69)',
    description: 'deuxième pôle de santé en France, disposant de nombreuses structures spécialisées en neurodéveloppement',
    nearbyTip: 'Villeurbanne, Vénissieux et Caluire sont aussi couverts par les professionnels lyonnais.',
  },
  marseille: {
    name: 'Marseille',
    region: "Provence-Alpes-Côte d'Azur",
    department: 'Bouches-du-Rhône (13)',
    description: 'deuxième ville de France, dotée de CRA et de nombreux professionnels libéraux spécialisés',
    nearbyTip: 'Aix-en-Provence, Aubagne et Martigues disposent aussi de professionnels référencés.',
  },
  toulouse: {
    name: 'Toulouse',
    region: 'Occitanie',
    department: 'Haute-Garonne (31)',
    description: 'pôle majeur du Sud-Ouest pour le suivi des troubles du neurodéveloppement',
    nearbyTip: 'Blagnac, Colomiers et Muret sont également desservis.',
  },
  bordeaux: {
    name: 'Bordeaux',
    region: 'Nouvelle-Aquitaine',
    department: 'Gironde (33)',
    description: 'grande métropole de Nouvelle-Aquitaine avec un réseau actif de professionnels TND',
    nearbyTip: 'Mérignac, Pessac et Talence sont couverts par les professionnels bordelais.',
  },
  lille: {
    name: 'Lille',
    region: 'Hauts-de-France',
    department: 'Nord (59)',
    description: 'métropole du Nord avec un écosystème riche de structures et de professionnels du neurodéveloppement',
    nearbyTip: 'Roubaix, Tourcoing et Villeneuve-d\'Ascq sont aussi couverts.',
  },
  nantes: {
    name: 'Nantes',
    region: 'Pays de la Loire',
    department: 'Loire-Atlantique (44)',
    description: 'ville dynamique de l\'Ouest avec un réseau croissant de professionnels spécialisés',
    nearbyTip: 'Saint-Herblain, Rezé et Saint-Nazaire disposent aussi de professionnels.',
  },
  strasbourg: {
    name: 'Strasbourg',
    region: 'Grand Est',
    department: 'Bas-Rhin (67)',
    description: 'capitale européenne disposant de structures hospitalières et libérales spécialisées en TND',
    nearbyTip: 'Schiltigheim, Illkirch et Haguenau sont également desservis.',
  },
  montpellier: {
    name: 'Montpellier',
    region: 'Occitanie',
    department: 'Hérault (34)',
    description: 'ville universitaire et médicale avec un pôle de compétences en neurodéveloppement',
    nearbyTip: 'Castelnau-le-Lez, Lattes et Béziers sont aussi couverts.',
  },
  rennes: {
    name: 'Rennes',
    region: 'Bretagne',
    department: 'Ille-et-Vilaine (35)',
    description: 'capitale bretonne avec des professionnels spécialisés en accompagnement autisme et TDAH',
    nearbyTip: 'Saint-Malo, Vitré et Cesson-Sévigné disposent aussi de professionnels.',
  },
  nice: {
    name: 'Nice',
    region: "Provence-Alpes-Côte d'Azur",
    department: 'Alpes-Maritimes (06)',
    description: 'grande ville du littoral méditerranéen avec des professionnels TND expérimentés',
    nearbyTip: 'Cannes, Antibes et Grasse sont aussi couverts.',
  },
  grenoble: {
    name: 'Grenoble',
    region: 'Auvergne-Rhône-Alpes',
    department: 'Isère (38)',
    description: 'ville alpine avec un tissu de professionnels spécialisés en neurodéveloppement',
    nearbyTip: 'Échirolles, Saint-Martin-d\'Hères et Voiron sont également desservis.',
  },
  rouen: {
    name: 'Rouen',
    region: 'Normandie',
    department: 'Seine-Maritime (76)',
    description: 'capitale normande avec un réseau de professionnels libéraux en TND',
    nearbyTip: 'Le Havre, Dieppe et Évreux sont aussi couverts.',
  },
  toulon: {
    name: 'Toulon',
    region: "Provence-Alpes-Côte d'Azur",
    department: 'Var (83)',
    description: 'ville du Var avec des professionnels spécialisés en accompagnement neurodéveloppement',
    nearbyTip: 'Hyères, La Seyne-sur-Mer et Draguignan disposent aussi de professionnels.',
  },
  dijon: {
    name: 'Dijon',
    region: 'Bourgogne-Franche-Comté',
    department: "Côte-d'Or (21)",
    description: 'capitale bourguignonne avec des professionnels spécialisés en autisme et TDAH',
    nearbyTip: 'Beaune, Chenôve et Chalon-sur-Saône sont également desservis.',
  },
  angers: {
    name: 'Angers',
    region: 'Pays de la Loire',
    department: 'Maine-et-Loire (49)',
    description: 'ville du Val de Loire avec un réseau actif de professionnels du neurodéveloppement',
    nearbyTip: 'Cholet, Saumur et Les Ponts-de-Cé sont aussi couverts.',
  },
  'clermont-ferrand': {
    name: 'Clermont-Ferrand',
    region: 'Auvergne-Rhône-Alpes',
    department: 'Puy-de-Dôme (63)',
    description: 'métropole auvergnate avec des professionnels spécialisés en accompagnement TND',
    nearbyTip: 'Riom, Issoire et Cournon-d\'Auvergne sont également desservis.',
  },
  tours: {
    name: 'Tours',
    region: 'Centre-Val de Loire',
    department: 'Indre-et-Loire (37)',
    description: 'ville du Centre avec un réseau de professionnels en neurodéveloppement',
    nearbyTip: 'Joué-lès-Tours, Saint-Cyr-sur-Loire et Amboise sont aussi couverts.',
  },
  metz: {
    name: 'Metz',
    region: 'Grand Est',
    department: 'Moselle (57)',
    description: 'ville de Lorraine avec des professionnels spécialisés en TND',
    nearbyTip: 'Thionville, Sarreguemines et Woippy disposent aussi de professionnels.',
  },
  reims: {
    name: 'Reims',
    region: 'Grand Est',
    department: 'Marne (51)',
    description: 'grande ville champenoise avec des éducateurs et thérapeutes spécialisés',
    nearbyTip: 'Épernay, Châlons-en-Champagne et Tinqueux sont également couverts.',
  },
  'saint-etienne': {
    name: 'Saint-Étienne',
    region: 'Auvergne-Rhône-Alpes',
    department: 'Loire (42)',
    description: 'ville stéphanoise avec des professionnels en accompagnement autisme et TDAH',
    nearbyTip: 'Firminy, Saint-Chamond et Andrézieux-Bouthéon disposent aussi de professionnels.',
  },
  'le-havre': {
    name: 'Le Havre',
    region: 'Normandie',
    department: 'Seine-Maritime (76)',
    description: 'grande ville portuaire normande avec des professionnels du neurodéveloppement',
    nearbyTip: 'Montivilliers, Harfleur et Fécamp sont aussi couverts.',
  },
  caen: {
    name: 'Caen',
    region: 'Normandie',
    department: 'Calvados (14)',
    description: 'capitale du Calvados avec un réseau de professionnels en TND',
    nearbyTip: 'Hérouville-Saint-Clair, Mondeville et Bayeux sont également desservis.',
  },
  'brest': {
    name: 'Brest',
    region: 'Bretagne',
    department: 'Finistère (29)',
    description: 'ville bretonne du Finistère avec des éducateurs et thérapeutes spécialisés',
    nearbyTip: 'Quimper, Landerneau et Morlaix sont aussi couverts.',
  },
  perpignan: {
    name: 'Perpignan',
    region: 'Occitanie',
    department: 'Pyrénées-Orientales (66)',
    description: 'ville du sud avec des professionnels spécialisés en accompagnement neurodéveloppement',
    nearbyTip: 'Canet-en-Roussillon, Saint-Estève et Rivesaltes sont aussi couverts.',
  },
  'aix-en-provence': {
    name: 'Aix-en-Provence',
    region: "Provence-Alpes-Côte d'Azur",
    department: 'Bouches-du-Rhône (13)',
    description: 'ville universitaire provençale avec de nombreux professionnels TND libéraux',
    nearbyTip: 'Gardanne, Vitrolles et Pertuis disposent aussi de professionnels.',
  },
  'boulogne-billancourt': {
    name: 'Boulogne-Billancourt',
    region: 'Île-de-France',
    department: 'Hauts-de-Seine (92)',
    description: 'commune limitrophe de Paris avec un accès facile aux professionnels parisiens et des cabinets locaux',
    nearbyTip: 'Issy-les-Moulineaux, Meudon et Sèvres sont aussi couverts.',
  },
  montreuil: {
    name: 'Montreuil',
    region: 'Île-de-France',
    department: 'Seine-Saint-Denis (93)',
    description: 'ville de l\'Est parisien avec des professionnels spécialisés en neurodéveloppement',
    nearbyTip: 'Vincennes, Bagnolet et Rosny-sous-Bois disposent aussi de professionnels.',
  },
  versailles: {
    name: 'Versailles',
    region: 'Île-de-France',
    department: 'Yvelines (78)',
    description: 'ville des Yvelines avec un réseau de professionnels TND en cabinet libéral',
    nearbyTip: 'Saint-Germain-en-Laye, Le Chesnay et Vélizy-Villacoublay sont aussi couverts.',
  },
  'saint-denis': {
    name: 'Saint-Denis',
    region: 'Île-de-France',
    department: 'Seine-Saint-Denis (93)',
    description: 'ville du Nord de Paris avec des professionnels accessibles en neurodéveloppement',
    nearbyTip: 'Aubervilliers, Épinay-sur-Seine et Pierrefitte sont aussi couverts.',
  },
};

const SPECIALTIES = [
  'éducateur spécialisé autisme',
  'psychologue TDAH',
  'orthophoniste DYS',
  'psychomotricien',
  'ergothérapeute',
  'neuropsychologue',
];

// ─── Static generation ─────────────────────────────────────────
export function generateStaticParams() {
  return Object.keys(CITIES).map((city) => ({ city }));
}

// ─── Dynamic metadata ──────────────────────────────────────────
export function generateMetadata({ params }: { params: { city: string } }): Metadata {
  const city = CITIES[params.city];
  if (!city) return {};

  const title = `Éducateur autisme ${city.name} — Professionnels TND certifiés`;
  const description = `Trouvez un éducateur autisme, psychologue TDAH ou orthophoniste DYS à ${city.name} (${city.department}). Professionnels certifiés, réservation en ligne. 100% gratuit pour les familles.`;

  return {
    title,
    description,
    keywords: [
      `éducateur autisme ${city.name}`,
      `psychologue TDAH ${city.name}`,
      `orthophoniste ${city.name}`,
      `accompagnement autisme ${city.name}`,
      `professionnel TND ${city.name}`,
      `éducateur spécialisé ${city.name}`,
      `psychomotricien ${city.name}`,
    ],
    openGraph: {
      title: `Éducateur autisme ${city.name} | NeuroCare`,
      description,
      url: `https://neuro-care.fr/search/${params.city}`,
    },
    alternates: {
      canonical: `https://neuro-care.fr/search/${params.city}`,
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────
export default function CitySearchPage({ params }: { params: { city: string } }) {
  const city = CITIES[params.city];
  if (!city) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `NeuroCare ${city.name} — Professionnels neurodéveloppement`,
    description: `Éducateurs autisme, psychologues TDAH et orthophonistes DYS certifiés à ${city.name}`,
    url: `https://neuro-care.fr/search/${params.city}`,
    areaServed: {
      '@type': 'City',
      name: city.name,
      containedInPlace: { '@type': 'AdministrativeArea', name: city.region },
    },
    provider: {
      '@type': 'Organization',
      name: 'NeuroCare',
      url: 'https://neuro-care.fr',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#fdf9f4]">
        {/* Hero */}
        <header className="bg-gradient-to-br from-teal-600 to-teal-700 text-white">
          <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
            <nav className="mb-6 text-teal-100 text-sm">
              <Link href="/" className="hover:text-white">Accueil</Link>
              {' / '}
              <Link href="/search" className="hover:text-white">Recherche</Link>
              {' / '}
              <span className="text-white">{city.name}</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Éducateur autisme à {city.name}
            </h1>
            <p className="text-lg sm:text-xl text-teal-100 max-w-3xl">
              Trouvez un professionnel du neurodéveloppement certifié à {city.name} ({city.department}).
              Réservation en ligne, 100% gratuit pour les familles.
            </p>
            <div className="mt-8">
              <Link
                href={`/search?location=${encodeURIComponent(city.name)}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-colors shadow-lg text-sm sm:text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Voir les professionnels à {city.name}
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-10 sm:py-14">
          {/* Introduction */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Accompagnement autisme, TDAH et DYS à {city.name}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {city.name} est une {city.description}. Sur NeuroCare, trouvez des professionnels certifiés
              qui accompagnent les enfants et adolescents présentant un trouble du spectre autistique (TSA),
              un TDAH ou des troubles DYS (dyslexie, dyspraxie, dyscalculie).
            </p>
            <p className="text-gray-700 leading-relaxed">
              Tous les professionnels référencés sur NeuroCare sont vérifiés : diplôme contrôlé, casier
              judiciaire vérifié, entretien réalisé. Vous pouvez réserver une séance en ligne, à domicile
              ou en cabinet directement sur la plateforme.
            </p>
          </section>

          {/* Specialties grid */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Spécialités disponibles à {city.name}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SPECIALTIES.map((specialty) => (
                <Link
                  key={specialty}
                  href={`/search?location=${encodeURIComponent(city.name)}&q=${encodeURIComponent(specialty)}`}
                  className="bg-white rounded-xl p-5 border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors capitalize">
                    {specialty}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    à {city.name} et alentours
                  </p>
                </Link>
              ))}
            </div>
          </section>

          {/* Nearby tip */}
          <section className="mb-10">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
              <h3 className="font-semibold text-teal-800 mb-2">
                Aussi disponible autour de {city.name}
              </h3>
              <p className="text-sm text-teal-700">{city.nearbyTip}</p>
            </div>
          </section>

          {/* How it works */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Comment trouver un professionnel à {city.name} ?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { step: '1', title: 'Recherchez', desc: `Tapez "${city.name}" dans la barre de recherche ou utilisez la géolocalisation.` },
                { step: '2', title: 'Comparez', desc: 'Consultez les profils, spécialités, avis et disponibilités des professionnels.' },
                { step: '3', title: 'Réservez', desc: 'Choisissez un créneau et réservez directement en ligne. Paiement sécurisé.' },
              ].map((item) => (
                <div key={item.step} className="bg-white rounded-xl p-5 border border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center mb-3">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-white rounded-2xl p-8 sm:p-12 border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Prêt à trouver votre professionnel à {city.name} ?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              La recherche est 100% gratuite. Consultez les profils, lisez les avis et réservez en quelques clics.
            </p>
            <Link
              href={`/search?location=${encodeURIComponent(city.name)}`}
              className="inline-flex items-center gap-2 px-8 py-3.5 text-white font-semibold rounded-xl hover:opacity-90 transition-colors shadow-md text-base"
              style={{ backgroundColor: '#027e7e' }}
            >
              Rechercher à {city.name}
            </Link>
          </section>
        </main>

        {/* Footer */}
        <footer className="text-white py-8 px-4 mt-10" style={{ backgroundColor: '#027e7e' }}>
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-teal-100 text-sm">
              NeuroCare — Plateforme de mise en relation entre familles et professionnels du neurodéveloppement.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-teal-100">
              <Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link>
              <Link href="/politique-confidentialite" className="hover:text-white">Confidentialité</Link>
              <Link href="/cgu" className="hover:text-white">CGU</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// Constants and data for the MDPH Dossier Assistant

export const STEP_DEFINITIONS = [
  { id: 1, title: 'Informations de l\'enfant', subtitle: 'Identité et diagnostic', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 2, title: 'Situation familiale', subtitle: 'Parents, fratrie, situation', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { id: 3, title: 'Projet de vie', subtitle: 'Quotidien et difficultés', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { id: 4, title: 'Scolarité', subtitle: 'École et aménagements', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
  { id: 5, title: 'Prises en charge', subtitle: 'Professionnels et coûts', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 6, title: 'Documents', subtitle: 'Pièces à fournir', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { id: 7, title: 'Demandes', subtitle: 'AEEH, PCH, AESH...', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { id: 8, title: 'Récapitulatif', subtitle: 'Vérification et PDF', icon: 'M5 13l4 4L19 7' },
];

export const PROJET_VIE_SECTIONS = [
  {
    key: 'morning_routine',
    label: 'Le matin - Réveil et préparation',
    placeholder: 'Décrivez le déroulement du matin : réveil, habillage, toilette, petit-déjeuner...',
    tips: 'Quantifiez le temps nécessaire, l\'aide apportée, les difficultés récurrentes.',
    examples: [
      'Il a besoin de 45 minutes pour s\'habiller avec aide, contre 10 minutes pour un enfant de son âge.',
      'Le brossage des dents nécessite une guidance physique complète à cause de l\'hypersensibilité buccale.',
      'Il faut suivre un emploi du temps visuel sinon il reste bloqué sur une étape.',
    ],
  },
  {
    key: 'meals',
    label: 'Les repas',
    placeholder: 'Décrivez les repas : sélectivité alimentaire, durée, aide nécessaire...',
    tips: 'Mentionnez les restrictions alimentaires, textures refusées, rituels.',
    examples: [
      'Il ne mange que 5 aliments différents à cause d\'une sélectivité alimentaire sévère.',
      'Les repas durent en moyenne 1h avec des crises si la nourriture touche le bord de l\'assiette.',
    ],
  },
  {
    key: 'school_day',
    label: 'La journée d\'école',
    placeholder: 'Décrivez le déroulement scolaire : difficultés d\'apprentissage, fatigabilité, comportement...',
    tips: 'Décrivez les aménagements nécessaires, la fatigabilité, les difficultés sociales.',
    examples: [
      'Il ne peut pas suivre plus de 2h consécutives sans pause dans un espace calme.',
      'Il a besoin d\'un AESH pour reformuler les consignes et le recentrer toutes les 10 minutes.',
    ],
  },
  {
    key: 'homework',
    label: 'Les devoirs',
    placeholder: 'Décrivez les devoirs : temps nécessaire, aide requise, crises...',
    tips: 'Comparez avec le temps normalement attendu pour son niveau scolaire.',
    examples: [
      'Les devoirs prennent 2h chaque soir au lieu de 30 minutes, avec des crises de frustration.',
      'Un parent doit rester à côté en permanence pour relancer l\'attention toutes les 5 minutes.',
    ],
  },
  {
    key: 'leisure',
    label: 'Les loisirs et activités',
    placeholder: 'Décrivez les loisirs : activités possibles/impossibles, socialisation...',
    tips: 'Mentionnez les activités auxquelles il ne peut pas participer et pourquoi.',
    examples: [
      'Il ne peut pas participer aux activités extra-scolaires classiques sans accompagnement individuel.',
      'Les sorties au parc se terminent systématiquement par une crise de surcharge sensorielle.',
    ],
  },
  {
    key: 'bedtime',
    label: 'Le coucher et la nuit',
    placeholder: 'Décrivez le coucher : rituels, troubles du sommeil, surveillance nécessaire...',
    tips: 'Mentionnez la durée du rituel, les réveils nocturnes, l\'impact sur le sommeil des parents.',
    examples: [
      'Le rituel du coucher dure 1h30 et doit être identique chaque soir sinon crise majeure.',
      'Il se réveille 3 à 4 fois par nuit, nécessitant la présence d\'un parent pour se rendormir.',
    ],
  },
  {
    key: 'outings_transport',
    label: 'Les sorties et déplacements',
    placeholder: 'Décrivez les sorties : transports, courses, lieux publics...',
    tips: 'Décrivez les lieux qui posent problème et les conséquences.',
    examples: [
      'Les courses en supermarché sont impossibles à cause de la surcharge sensorielle (bruits, lumières).',
      'Il ne peut pas prendre les transports en commun sans accompagnement car il n\'a aucune notion du danger.',
    ],
  },
  {
    key: 'social_interactions',
    label: 'Les interactions sociales',
    placeholder: 'Décrivez les relations : avec les pairs, la famille élargie, les adultes...',
    tips: 'Expliquez les difficultés de communication et leurs conséquences concrètes.',
    examples: [
      'Il ne peut pas jouer avec d\'autres enfants sans médiation car il ne comprend pas les codes sociaux.',
      'Les réunions familiales provoquent systématiquement des crises d\'angoisse.',
    ],
  },
  {
    key: 'crises_behaviors',
    label: 'Crises et comportements difficiles',
    placeholder: 'Décrivez les crises : fréquence, durée, intensité, déclencheurs...',
    tips: 'Quantifiez : nombre par jour/semaine, durée moyenne, intervention nécessaire.',
    examples: [
      'En moyenne 2 à 3 crises par jour d\'une durée de 20 à 45 minutes, avec auto-agression.',
      'Les transitions imprévues déclenchent des effondrements émotionnels nécessitant 30 min de contenance.',
    ],
  },
  {
    key: 'strengths_interests',
    label: 'Forces et centres d\'intérêt',
    placeholder: 'Décrivez ses forces, ses passions, ce qui le motive...',
    tips: 'Montrer que vous connaissez votre enfant dans sa globalité, pas uniquement ses difficultés.',
    examples: [
      'Il a une mémoire exceptionnelle et connaît tous les pays du monde avec leurs capitales.',
      'Il adore les dinosaures et peut se concentrer 2h sur un documentaire animalier.',
    ],
  },
  {
    key: 'family_impact',
    label: 'Impact sur la vie familiale',
    placeholder: 'Décrivez l\'impact : activité professionnelle, fratrie, couple, santé des parents...',
    tips: 'Soyez honnête sur les conséquences : réduction de travail, fatigue, isolement.',
    examples: [
      'Un des deux parents a dû passer à mi-temps pour assurer les rendez-vous médicaux (3 par semaine).',
      'La fratrie est impactée : le grand frère ne peut plus inviter d\'amis à la maison.',
      'Le coût mensuel des prises en charge non remboursées s\'élève à 800€.',
    ],
  },
];

export const DOCUMENT_CHECKLIST = [
  { key: 'cerfa_demande', label: 'Formulaire Cerfa n°15692*01', required: true, linkType: null },
  { key: 'certificat_medical', label: 'Certificat médical Cerfa n°15695*01 (< 12 mois)', required: true, linkType: null },
  { key: 'justificatif_identite', label: 'Justificatif d\'identité de l\'enfant', required: true, linkType: null },
  { key: 'justificatif_domicile', label: 'Justificatif de domicile (< 3 mois)', required: true, linkType: null },
  { key: 'bilan_diagnostic', label: 'Bilan diagnostic (neuropédiatre, CRA...)', required: false, linkType: 'diagnostic' },
  { key: 'bilan_ortho', label: 'Bilan orthophonique', required: false, linkType: 'bilan_ortho' },
  { key: 'bilan_psychomot', label: 'Bilan psychomoteur', required: false, linkType: 'bilan_psychomot' },
  { key: 'bilan_neuropsy', label: 'Bilan neuropsychologique', required: false, linkType: 'bilan_neuropsy' },
  { key: 'bilan_ergo', label: 'Bilan ergothérapie', required: false, linkType: 'bilan_ergo' },
  { key: 'geva_sco', label: 'GEVA-Sco', required: false, linkType: null },
  { key: 'pps_pap', label: 'PPS ou PAP existant', required: false, linkType: 'pps' },
  { key: 'bulletins_scolaires', label: 'Bulletins scolaires', required: false, linkType: null },
  { key: 'factures_pro', label: 'Factures des prises en charge', required: false, linkType: null },
  { key: 'certificat_mdph', label: 'Notification MDPH précédente (si renouvellement)', required: false, linkType: 'certificat_mdph' },
];

export const AMENAGEMENTS_SCOLAIRES = [
  'Tiers-temps',
  'Secrétaire / scripteur',
  'Ordinateur',
  'Support adapté (agrandissement, police spéciale)',
  'Place adaptée (devant, près de la porte)',
  'Consignes reformulées',
  'Emploi du temps aménagé',
  'Espace de repli / sas de décompression',
  'Matériel adapté (fidget, casque anti-bruit)',
  'Évaluations adaptées',
  'Dispense de certaines activités',
];

export const PROFESSIONAL_TYPES = [
  { value: 'orthophoniste', label: 'Orthophoniste' },
  { value: 'psychomotricien', label: 'Psychomotricien(ne)' },
  { value: 'ergotherapeute', label: 'Ergothérapeute' },
  { value: 'psychologue', label: 'Psychologue' },
  { value: 'neuropsychologue', label: 'Neuropsychologue' },
  { value: 'educateur_specialise', label: 'Éducateur(trice) spécialisé(e)' },
  { value: 'pedopsychiatre', label: 'Pédopsychiatre' },
  { value: 'neuropediatre', label: 'Neuropédiatre' },
  { value: 'kinesitherapeute', label: 'Kinésithérapeute' },
  { value: 'art_therapeute', label: 'Art-thérapeute' },
  { value: 'autre', label: 'Autre' },
];

export const ORIENTATION_OPTIONS = [
  { value: 'ulis_ecole', label: 'ULIS école' },
  { value: 'ulis_college', label: 'ULIS collège' },
  { value: 'ulis_lycee', label: 'ULIS lycée' },
  { value: 'ime', label: 'IME (Institut Médico-Éducatif)' },
  { value: 'sessad', label: 'SESSAD' },
  { value: 'itep', label: 'ITEP' },
  { value: 'camsp', label: 'CAMSP' },
  { value: 'cmpp', label: 'CMPP' },
  { value: 'hopital_jour', label: 'Hôpital de jour' },
  { value: 'classe_ordinaire', label: 'Maintien en classe ordinaire avec aide' },
  { value: 'autre', label: 'Autre' },
];

export const COVERAGE_OPTIONS = [
  { value: 'aucun', label: 'Non remboursé' },
  { value: 'secu', label: 'Sécurité sociale' },
  { value: 'mutuelle', label: 'Mutuelle' },
  { value: 'aeeh', label: 'Financé via AEEH' },
  { value: 'pch', label: 'Financé via PCH' },
  { value: 'forfait_precoce', label: 'Forfait intervention précoce' },
];

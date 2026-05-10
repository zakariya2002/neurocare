/**
 * Catalogue des modèles de courriers administratifs (A3 — courriersAdmin).
 *
 * Définit les 5 modèles disponibles, leurs champs spécifiques et les
 * métadonnées (titre, description, destinataire par défaut, objet par
 * défaut). Côté serveur ET côté client peuvent l'importer.
 */

export type CourrierModeleId =
  | 'recours-mdph'
  | 'demande-pps'
  | 'ess-exceptionnelle'
  | 'notification-mdph'
  | 'prolongation-fip-pco';

export interface CourrierFieldDef {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'date';
  required?: boolean;
  placeholder?: string;
  helper?: string;
}

export interface CourrierModeleDef {
  id: CourrierModeleId;
  title: string;
  shortTitle: string;
  description: string;
  whenToUse: string;
  defaultRecipient: string;
  defaultObject: string;
  fields: CourrierFieldDef[];
}

export const COURRIER_MODELES: ReadonlyArray<CourrierModeleDef> = [
  {
    id: 'recours-mdph',
    title: 'Recours gracieux MDPH',
    shortTitle: 'Recours MDPH',
    description:
      'Contester une décision défavorable de la CDAPH (refus AEEH, PCH, orientation) auprès de la MDPH.',
    whenToUse:
      'Vous avez reçu une notification de refus ou une décision qui ne correspond pas aux besoins de votre enfant. Le recours gracieux doit être déposé dans les 2 mois suivant la décision.',
    defaultRecipient:
      "Madame, Monsieur le Président de la Commission des Droits et de l'Autonomie\nMaison Départementale des Personnes Handicapées",
    defaultObject:
      "Recours gracieux contre la décision de la CDAPH",
    fields: [
      {
        name: 'mdph_address',
        label: 'Adresse complète de la MDPH',
        type: 'textarea',
        required: true,
        placeholder: 'Ex : MDPH du Rhône\n146 rue Pierre Corneille\n69003 Lyon',
      },
      {
        name: 'mdph_number',
        label: "N° de dossier MDPH",
        type: 'text',
        required: true,
        placeholder: 'Numéro figurant sur la notification',
      },
      {
        name: 'decision_date',
        label: 'Date de la décision contestée',
        type: 'date',
        required: true,
      },
      {
        name: 'decision_object',
        label: 'Décision contestée',
        type: 'text',
        required: true,
        placeholder: 'Ex : refus de l’AEEH complément 3',
      },
      {
        name: 'reasons',
        label: 'Motifs du recours',
        type: 'textarea',
        required: true,
        placeholder:
          'Expliquez pourquoi la décision ne correspond pas aux besoins de votre enfant. Mentionnez les éléments médicaux, éducatifs ou pédagogiques.',
        helper:
          "Soyez factuel. Joindre les bilans, certificats médicaux et comptes-rendus pertinents en pièces jointes.",
      },
    ],
  },
  {
    id: 'demande-pps',
    title: "Demande de Projet Personnalisé de Scolarisation (PPS)",
    shortTitle: 'Demande de PPS',
    description:
      "Demander la mise en place ou la révision d'un PPS auprès du directeur d'école, de l'IEN ou du chef d'établissement.",
    whenToUse:
      "Votre enfant a besoin d'aménagements scolaires (AESH, matériel adapté, tiers-temps) liés à son trouble. Le PPS est élaboré par la MDPH après une demande qui peut être initiée par les parents.",
    defaultRecipient:
      "Madame, Monsieur le Directeur / la Directrice\n[Nom de l'école ou de l'établissement]",
    defaultObject:
      "Demande de mise en place d'un Projet Personnalisé de Scolarisation",
    fields: [
      {
        name: 'recipient_address',
        label: "Adresse de l'école / établissement",
        type: 'textarea',
        required: true,
        placeholder: "Ex : École élémentaire Jean Moulin\n12 rue de la République\n69001 Lyon",
      },
      {
        name: 'school_name',
        label: "Nom de l'école / établissement",
        type: 'text',
        required: true,
      },
      {
        name: 'class_level',
        label: 'Classe / niveau de scolarisation',
        type: 'text',
        required: true,
        placeholder: 'Ex : CE2',
      },
      {
        name: 'diagnosis_summary',
        label: 'Synthèse du diagnostic et des besoins',
        type: 'textarea',
        required: true,
        placeholder:
          "Décrivez brièvement le diagnostic, les difficultés rencontrées en classe et les aménagements souhaités (AESH, matériel adapté, tiers-temps, etc.).",
      },
    ],
  },
  {
    id: 'ess-exceptionnelle',
    title: "Demande d'Équipe de Suivi de Scolarisation exceptionnelle",
    shortTitle: 'ESS exceptionnelle',
    description:
      "Solliciter la convocation d'une ESS hors du calendrier annuel pour ajuster un PPS en urgence.",
    whenToUse:
      "Une situation nouvelle ou une dégradation impose de réunir l'équipe de suivi (enseignant référent, parents, professionnels) avant la prochaine ESS programmée.",
    defaultRecipient:
      "Madame, Monsieur l'Enseignant référent de scolarité (ERSEH)",
    defaultObject:
      "Demande de convocation d'une ESS exceptionnelle",
    fields: [
      {
        name: 'recipient_address',
        label: "Adresse de l'enseignant référent",
        type: 'textarea',
        required: true,
        placeholder: 'Ex : Circonscription ASH\nInspection académique du Rhône\n21 rue Jaboulay\n69007 Lyon',
      },
      {
        name: 'school_name',
        label: "École / établissement actuel",
        type: 'text',
        required: true,
      },
      {
        name: 'class_level',
        label: 'Classe / niveau',
        type: 'text',
        required: true,
        placeholder: 'Ex : CM1',
      },
      {
        name: 'situation',
        label: 'Situation justifiant la demande',
        type: 'textarea',
        required: true,
        placeholder:
          "Décrivez les faits récents (refus de l'AESH, comportements, fatigabilité, exclusion temporaire, etc.) qui motivent la convocation d'une ESS exceptionnelle.",
      },
    ],
  },
  {
    id: 'notification-mdph',
    title: 'Demande de mise à jour MDPH suite à un changement de situation',
    shortTitle: 'Mise à jour MDPH',
    description:
      "Informer la MDPH d'un changement (déménagement, évolution de l'état de santé, scolarité) et solliciter une réévaluation.",
    whenToUse:
      "Vous changez de département, ou la situation de l'enfant a évolué de façon significative depuis la dernière notification (nouveau diagnostic, aggravation, etc.).",
    defaultRecipient:
      "Madame, Monsieur le Directeur de la Maison Départementale des Personnes Handicapées",
    defaultObject:
      "Demande de mise à jour du dossier suite à un changement de situation",
    fields: [
      {
        name: 'mdph_address',
        label: 'Adresse complète de la MDPH',
        type: 'textarea',
        required: true,
        placeholder: 'Ex : MDPH du Rhône\n146 rue Pierre Corneille\n69003 Lyon',
      },
      {
        name: 'mdph_number',
        label: "N° de dossier MDPH (si connu)",
        type: 'text',
        required: false,
        placeholder: 'Optionnel',
      },
      {
        name: 'change_type',
        label: 'Type de changement',
        type: 'text',
        required: true,
        placeholder: 'Ex : déménagement, nouveau diagnostic, aggravation',
      },
      {
        name: 'change_details',
        label: 'Détail du changement',
        type: 'textarea',
        required: true,
        placeholder:
          "Précisez la nature du changement, sa date d'effet et les pièces justificatives jointes (certificat médical, justificatif de domicile, bilans).",
      },
    ],
  },
  {
    id: 'prolongation-fip-pco',
    title: 'Demande de prolongation FIP / PCO',
    shortTitle: 'Prolongation FIP / PCO',
    description:
      "Solliciter la prolongation du Forfait d'Intervention Précoce ou du suivi par la Plateforme de Coordination et d'Orientation (PCO TND).",
    whenToUse:
      "Le parcours initial (12 mois ou 24 mois selon le dispositif) arrive à échéance et l'accompagnement reste nécessaire avant la mise en place d'une orientation MDPH.",
    defaultRecipient:
      "Madame, Monsieur le Médecin coordonnateur\nPlateforme de Coordination et d'Orientation TND",
    defaultObject:
      "Demande de prolongation du parcours FIP / PCO",
    fields: [
      {
        name: 'recipient_address',
        label: 'Adresse complète de la PCO',
        type: 'textarea',
        required: true,
        placeholder: 'Ex : PCO TND\nCHU de Lyon\n59 boulevard Pinel\n69500 Bron',
      },
      {
        name: 'pco_number',
        label: 'N° de dossier PCO (si connu)',
        type: 'text',
        required: false,
        placeholder: 'Optionnel',
      },
      {
        name: 'parcours_start_date',
        label: 'Date de début du parcours',
        type: 'date',
        required: true,
      },
      {
        name: 'reasons',
        label: 'Motifs justifiant la prolongation',
        type: 'textarea',
        required: true,
        placeholder:
          "Décrivez l'évolution depuis le début du parcours, les bilans en cours, l'absence de notification MDPH effective, ou tout autre motif justifiant la poursuite des financements.",
      },
    ],
  },
];

export function getModele(id: string): CourrierModeleDef | undefined {
  return COURRIER_MODELES.find((m) => m.id === id);
}

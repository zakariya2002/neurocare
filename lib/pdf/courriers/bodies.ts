/**
 * Corps des courriers — un paragraphe par entrée du tableau retourné.
 *
 * Chaque fonction reçoit le contexte (parent, enfant, champs spécifiques)
 * et retourne un tableau de paragraphes français au ton formel
 * administratif. Les paragraphes sont assemblés par le générateur PDF
 * et écrits avec un alignement justifié.
 */

import type { CourrierModeleId } from './templates';

export interface CourrierBodyContext {
  sender: {
    fullName: string;
  };
  child: {
    fullName: string;
    birthDate?: string;
  };
  fields: Record<string, string>;
  date: Date;
}

function formatDateFrShort(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

function childIntro(ctx: CourrierBodyContext): string {
  const dob = formatDateFrShort(ctx.child.birthDate);
  if (dob) {
    return `Je soussigné(e) ${ctx.sender.fullName}, parent de ${ctx.child.fullName}, né(e) le ${dob},`;
  }
  return `Je soussigné(e) ${ctx.sender.fullName}, parent de ${ctx.child.fullName},`;
}

function bodyRecoursMdph(ctx: CourrierBodyContext): string[] {
  const mdphNumber = ctx.fields.mdph_number?.trim() || '';
  const decisionDate = formatDateFrShort(ctx.fields.decision_date);
  const decisionObject =
    ctx.fields.decision_object?.trim() || 'la décision rendue';
  const reasons =
    ctx.fields.reasons?.trim() ||
    'les besoins de mon enfant ne sont pas couverts par la décision rendue.';

  const intro = `${childIntro(ctx)} forme par la présente un recours gracieux à l'encontre de la décision de la Commission des Droits et de l'Autonomie des Personnes Handicapées (CDAPH) en date du ${decisionDate}, portant sur ${decisionObject.toLowerCase().startsWith('le') || decisionObject.toLowerCase().startsWith('la') || decisionObject.toLowerCase().startsWith("l'") ? decisionObject : `« ${decisionObject} »`}${mdphNumber ? `, dossier n° ${mdphNumber}` : ''}.`;

  const motivation = `Cette décision ne me paraît pas conforme à la situation et aux besoins de mon enfant, pour les motifs suivants :`;

  const reasonsBlock = reasons;

  const piecesJointes = `Je joins à la présente l'ensemble des pièces utiles à la réévaluation du dossier (bilans pluridisciplinaires, certificats médicaux, comptes rendus pédagogiques) et reste à votre disposition pour tout complément d'information.`;

  const closing = `Je vous remercie de bien vouloir réexaminer la situation de mon enfant à la lumière des éléments transmis et de me communiquer la suite réservée à ce recours dans le délai légal.`;

  return [intro, motivation, reasonsBlock, piecesJointes, closing];
}

function bodyDemandePps(ctx: CourrierBodyContext): string[] {
  const schoolName = ctx.fields.school_name?.trim() || "l'établissement";
  const classLevel = ctx.fields.class_level?.trim() || '';
  const diagnosis =
    ctx.fields.diagnosis_summary?.trim() ||
    "Mon enfant présente un trouble du neurodéveloppement nécessitant des aménagements scolaires.";

  const intro = `${childIntro(ctx)} sollicite par la présente la mise en place d'un Projet Personnalisé de Scolarisation (PPS) au bénéfice de mon enfant, actuellement scolarisé(e) ${classLevel ? `en ${classLevel} ` : ''}à ${schoolName}.`;

  const context = `La situation de mon enfant peut être résumée comme suit :`;

  const diagnosisBlock = diagnosis;

  const demarche = `Conformément à l'article L. 112-2 du Code de l'éducation, et au regard des besoins identifiés, je demande l'élaboration d'un PPS associant l'équipe pédagogique, les professionnels accompagnant mon enfant et la Maison Départementale des Personnes Handicapées (MDPH).`;

  const closing = `Je vous remercie de bien vouloir transmettre cette demande à l'enseignant référent de scolarisation (ERSEH) compétent et m'informer des prochaines étapes (réunion d'équipe éducative, dossier MDPH, calendrier).`;

  return [intro, context, diagnosisBlock, demarche, closing];
}

function bodyEssExceptionnelle(ctx: CourrierBodyContext): string[] {
  const schoolName = ctx.fields.school_name?.trim() || "l'établissement";
  const classLevel = ctx.fields.class_level?.trim() || '';
  const situation =
    ctx.fields.situation?.trim() ||
    "La situation actuelle de mon enfant nécessite une réunion rapide de l'équipe de suivi.";

  const intro = `${childIntro(ctx)} sollicite par la présente la convocation d'une Équipe de Suivi de Scolarisation (ESS) exceptionnelle pour mon enfant, scolarisé(e) ${classLevel ? `en ${classLevel} ` : ''}à ${schoolName}.`;

  const context = `Cette demande est motivée par les éléments suivants :`;

  const situationBlock = situation;

  const objectif = `Une réunion exceptionnelle de l'ESS permettrait de réajuster les aménagements prévus au Projet Personnalisé de Scolarisation (PPS), de mobiliser les partenaires concernés (enseignant, AESH, professionnels libéraux ou de structure) et de prévenir une dégradation de la scolarité.`;

  const closing = `Je vous remercie de bien vouloir convoquer cette ESS dans les meilleurs délais et m'informer de la date retenue ainsi que des participants conviés.`;

  return [intro, context, situationBlock, objectif, closing];
}

function bodyNotificationMdph(ctx: CourrierBodyContext): string[] {
  const mdphNumber = ctx.fields.mdph_number?.trim() || '';
  const changeType = ctx.fields.change_type?.trim() || 'changement de situation';
  const changeDetails =
    ctx.fields.change_details?.trim() ||
    "Les détails du changement sont précisés en pièces jointes.";

  const intro = `${childIntro(ctx)} vous informe d'un ${changeType.toLowerCase()} concernant le dossier de mon enfant${mdphNumber ? ` (n° ${mdphNumber})` : ''} et sollicite la mise à jour des éléments enregistrés par vos services.`;

  const context = `Le changement intervenu peut être détaillé ainsi :`;

  const detailsBlock = changeDetails;

  const piecesJointes = `Je joins à la présente l'ensemble des justificatifs nécessaires à la prise en compte de cette évolution (justificatif de domicile, certificat médical, bilans, etc.).`;

  const closing = `Je vous remercie de bien vouloir mettre à jour mon dossier en conséquence et, le cas échéant, de procéder à une réévaluation des droits notifiés. Je reste à votre disposition pour toute information complémentaire.`;

  return [intro, context, detailsBlock, piecesJointes, closing];
}

function bodyProlongationFipPco(ctx: CourrierBodyContext): string[] {
  const pcoNumber = ctx.fields.pco_number?.trim() || '';
  const startDate = formatDateFrShort(ctx.fields.parcours_start_date);
  const reasons =
    ctx.fields.reasons?.trim() ||
    "Le parcours initial arrive à échéance et l'accompagnement reste indispensable.";

  const intro = `${childIntro(ctx)} sollicite par la présente la prolongation du parcours engagé au titre du Forfait d'Intervention Précoce et de la Plateforme de Coordination et d'Orientation TND${pcoNumber ? ` (dossier n° ${pcoNumber})` : ''}${startDate ? `, débuté le ${startDate}` : ''}.`;

  const context = `Cette demande est motivée par les éléments suivants :`;

  const reasonsBlock = reasons;

  const continuite = `La continuité de la prise en charge des bilans et interventions, dans l'attente d'une notification MDPH effective ou d'une orientation vers une structure adaptée, est essentielle au maintien des progrès observés et à la cohérence du parcours de soin.`;

  const closing = `Je vous remercie de bien vouloir examiner cette demande de prolongation et m'informer de la suite réservée. Je reste à votre disposition pour transmettre toute pièce complémentaire utile à votre évaluation.`;

  return [intro, context, reasonsBlock, continuite, closing];
}

export function buildCourrierBody(
  modeleId: CourrierModeleId,
  ctx: CourrierBodyContext
): string[] {
  switch (modeleId) {
    case 'recours-mdph':
      return bodyRecoursMdph(ctx);
    case 'demande-pps':
      return bodyDemandePps(ctx);
    case 'ess-exceptionnelle':
      return bodyEssExceptionnelle(ctx);
    case 'notification-mdph':
      return bodyNotificationMdph(ctx);
    case 'prolongation-fip-pco':
      return bodyProlongationFipPco(ctx);
  }
}

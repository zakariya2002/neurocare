'use client';

import { useState } from 'react';
import NeuroLoader from '@/components/NeuroLoader';
import NeuroLoaderOrbital from '@/components/NeuroLoaderOrbital';
import NeuroLoaderEEG from '@/components/NeuroLoaderEEG';
import NeuroLoaderSynapse from '@/components/NeuroLoaderSynapse';
import { useToast } from '@/components/Toast';
import { useConfirm, usePrompt } from '@/components/ConfirmDialog';

type Variant = 'info' | 'warning' | 'danger';

type RealCase =
  | {
      kind: 'confirm';
      source: string;
      area: 'Famille' | 'Éducateur' | 'Admin' | 'Upload';
      title: string;
      message?: string;
      variant: Variant;
      confirmLabel?: string;
      cancelLabel?: string;
    }
  | {
      kind: 'prompt';
      source: string;
      area: 'Famille' | 'Éducateur' | 'Admin' | 'Upload';
      title: string;
      message?: string;
      placeholder?: string;
      required?: boolean;
      multiline?: boolean;
      variant: Variant;
      confirmLabel?: string;
    };

// Les 19 confirm() + 1 prompt() encore présents dans le code.
// Le wording est repris à l'identique pour que Zakariya voie le rendu exact.
const REAL_CASES: RealCase[] = [
  // ── Famille ──
  {
    kind: 'confirm',
    source: 'dashboard/family/children',
    area: 'Famille',
    title: 'Supprimer cet accompagnement ?',
    message: 'Voulez-vous vraiment supprimer cet accompagnement ?',
    variant: 'danger',
    confirmLabel: 'Supprimer',
  },
  {
    kind: 'confirm',
    source: 'dashboard/family/children/[id]/ppa',
    area: 'Famille',
    title: 'Supprimer cette version du PPA ?',
    message: 'Cette action est irréversible.',
    variant: 'danger',
    confirmLabel: 'Supprimer',
  },
  {
    kind: 'confirm',
    source: 'dashboard/family/children/[id]/dossier',
    area: 'Famille',
    title: 'Supprimer ce lien ?',
    variant: 'danger',
    confirmLabel: 'Supprimer',
  },
  {
    kind: 'confirm',
    source: 'dashboard/family/bookings (gratuit)',
    area: 'Famille',
    title: 'Annuler ce rendez-vous ?',
    message: 'Annulation gratuite (plus de 48h avant le RDV).',
    variant: 'warning',
    confirmLabel: 'Annuler le RDV',
    cancelLabel: 'Garder',
  },
  {
    kind: 'confirm',
    source: 'dashboard/family/bookings (tardif)',
    area: 'Famille',
    title: '⚠ Annulation tardive',
    message:
      "Vous êtes à moins de 48h du rendez-vous.\n50% du montant sera prélevé (25,00 €).\n\nConfirmer l'annulation ?",
    variant: 'danger',
    confirmLabel: "Confirmer l'annulation",
    cancelLabel: 'Garder le RDV',
  },
  {
    kind: 'confirm',
    source: 'bookings (legacy)',
    area: 'Famille',
    title: 'Annuler ce rendez-vous ?',
    variant: 'warning',
    confirmLabel: 'Annuler',
  },
  {
    kind: 'confirm',
    source: 'messages',
    area: 'Famille',
    title: 'Refuser cette demande de contact ?',
    variant: 'danger',
    confirmLabel: 'Refuser',
  },

  // ── Éducateur ──
  {
    kind: 'confirm',
    source: 'dashboard/educator/appointments (annulation)',
    area: 'Éducateur',
    title: 'Annuler ce rendez-vous ?',
    message: 'La famille sera remboursée intégralement.',
    variant: 'warning',
    confirmLabel: 'Annuler',
  },
  {
    kind: 'confirm',
    source: 'dashboard/educator/blog',
    area: 'Éducateur',
    title: 'Supprimer cet article ?',
    variant: 'danger',
    confirmLabel: 'Supprimer',
  },
  {
    kind: 'confirm',
    source: 'dashboard/educator/blocked-families',
    area: 'Éducateur',
    title: 'Débloquer cette famille ?',
    message: 'Elle pourra à nouveau voir votre profil et vous contacter.',
    variant: 'info',
    confirmLabel: 'Débloquer',
  },
  {
    kind: 'confirm',
    source: 'dashboard/educator/diploma',
    area: 'Éducateur',
    title: 'Supprimer ce document ?',
    message: 'Ex : « Diplôme d\'éducateur spécialisé »',
    variant: 'danger',
    confirmLabel: 'Supprimer',
  },

  // ── Upload composants (profils) ──
  {
    kind: 'confirm',
    source: 'components/CVUpload',
    area: 'Upload',
    title: 'Supprimer votre CV ?',
    variant: 'danger',
    confirmLabel: 'Supprimer',
  },
  {
    kind: 'confirm',
    source: 'components/AvatarUpload',
    area: 'Upload',
    title: 'Supprimer votre photo de profil ?',
    variant: 'danger',
    confirmLabel: 'Supprimer',
  },
  {
    kind: 'confirm',
    source: 'components/CertificationDocumentUpload',
    area: 'Upload',
    title: 'Supprimer ce document ?',
    variant: 'danger',
    confirmLabel: 'Supprimer',
  },

  // ── Admin ──
  {
    kind: 'confirm',
    source: 'admin/articles',
    area: 'Admin',
    title: 'Publier cet article sur le blog ?',
    variant: 'info',
    confirmLabel: 'Publier',
  },
  {
    kind: 'confirm',
    source: 'admin/verifications (approuver doc)',
    area: 'Admin',
    title: 'Approuver ce document ?',
    variant: 'info',
    confirmLabel: 'Approuver',
  },
  {
    kind: 'confirm',
    source: 'admin/verifications (refuser doc)',
    area: 'Admin',
    title: 'Refuser ce document ?',
    message: "L'éducateur devra en uploader un nouveau.",
    variant: 'danger',
    confirmLabel: 'Refuser',
  },
  {
    kind: 'confirm',
    source: 'admin/verifications (RDV planifié)',
    area: 'Admin',
    title: 'Confirmer que le RDV a été planifié avec l\'éducateur ?',
    variant: 'info',
    confirmLabel: 'Confirmer',
  },
  {
    kind: 'confirm',
    source: 'admin/verifications (approuver éducateur)',
    area: 'Admin',
    title: 'Approuver définitivement cet éducateur ?',
    message:
      'Il recevra le badge « vérifié » et sera visible par toutes les familles.',
    variant: 'info',
    confirmLabel: 'Approuver',
  },
  {
    kind: 'prompt',
    source: 'admin/verifications (raison refus)',
    area: 'Admin',
    title: 'Raison du refus de l\'entretien',
    message: 'Elle sera communiquée à l\'éducateur.',
    placeholder: 'Ex : doutes sur l\'authenticité du diplôme, absence de réponse…',
    required: true,
    multiline: true,
    variant: 'danger',
    confirmLabel: 'Envoyer',
  },
  {
    kind: 'confirm',
    source: 'admin/verifications (refuser éducateur)',
    area: 'Admin',
    title: 'Refuser définitivement cet éducateur ?',
    message: 'Suite à l\'entretien. Cette décision sera notifiée.',
    variant: 'danger',
    confirmLabel: 'Refuser',
  },
];

/**
 * Catalog page to preview every notification / feedback surface used across the app.
 * Not linked from the public nav. Reachable at /dev/notifications.
 */
export default function NotificationsCatalogPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const prompt = usePrompt();

  const [showFullscreenLoader, setShowFullscreenLoader] = useState(false);
  const [fullscreenVariant, setFullscreenVariant] = useState<
    'orbital' | 'eeg' | 'synapse' | null
  >(null);
  const [confirmResult, setConfirmResult] = useState<string>('');

  const triggerFullscreen = () => {
    setShowFullscreenLoader(true);
    window.setTimeout(() => setShowFullscreenLoader(false), 3000);
  };

  const triggerConfirm = async (variant: 'info' | 'warning' | 'danger') => {
    const ok = await confirm({
      title:
        variant === 'danger'
          ? 'Supprimer ce rendez-vous ?'
          : variant === 'warning'
          ? 'Annulation tardive'
          : 'Publier cet article ?',
      message:
        variant === 'danger'
          ? 'Cette action est irréversible. La famille recevra un remboursement intégral.'
          : variant === 'warning'
          ? 'Vous êtes à moins de 48h du rendez-vous. 50 % du montant sera prélevé.'
          : 'L\'article sera visible par toutes les familles.',
      confirmLabel: variant === 'danger' ? 'Supprimer' : variant === 'warning' ? 'Confirmer' : 'Publier',
      cancelLabel: 'Annuler',
      variant,
    });
    setConfirmResult(`Variant "${variant}" → ${ok ? '✓ confirmé' : '✗ annulé'}`);
  };

  const triggerRealCase = async (c: RealCase) => {
    if (c.kind === 'prompt') {
      const value = await prompt({
        title: c.title,
        message: c.message,
        placeholder: c.placeholder,
        confirmLabel: c.confirmLabel ?? 'Valider',
        required: c.required,
        multiline: c.multiline,
        variant: c.variant,
      });
      setConfirmResult(value ? `[${c.source}] → "${value}"` : `[${c.source}] annulé`);
      return;
    }
    const ok = await confirm({
      title: c.title,
      message: c.message,
      confirmLabel: c.confirmLabel,
      cancelLabel: c.cancelLabel,
      variant: c.variant,
    });
    setConfirmResult(`[${c.source}] → ${ok ? '✓ confirmé' : '✗ annulé'}`);
  };

  const triggerPrompt = async () => {
    const value = await prompt({
      title: 'Raison du refus',
      message: 'Expliquez brièvement pourquoi l\'entretien est refusé.',
      placeholder: 'Ex : documents manquants, doutes sur les diplômes…',
      confirmLabel: 'Envoyer',
      required: true,
      multiline: true,
      variant: 'danger',
    });
    setConfirmResult(value ? `Prompt → "${value}"` : 'Prompt annulé');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#fdf9f4' }}>
      {showFullscreenLoader && (
        <NeuroLoader size="fullscreen" message="Chargement du dossier…" />
      )}
      {fullscreenVariant === 'orbital' && (
        <NeuroLoaderOrbital size="fullscreen" message="Chargement du dossier…" />
      )}
      {fullscreenVariant === 'eeg' && (
        <NeuroLoaderEEG size="fullscreen" message="Chargement du dossier…" />
      )}
      {fullscreenVariant === 'synapse' && (
        <NeuroLoaderSynapse size="fullscreen" message="Chargement du dossier…" />
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <header className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">
            Dev / Review interne
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
            Catalogue des notifications
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl">
            Toutes les surfaces de feedback utilisées dans le produit : chargements, toasts, dialogues de confirmation et
            de saisie. Utilise cette page pour valider le design avant de propager.
          </p>
        </header>

        {/* ═══ SECTION 1 : LOADERS ═══ */}
        <Section
          number="1"
          title="Loaders de chargement"
          description="Pages qui affichent un écran de chargement pendant une requête initiale. Le NeuroLoader est le nouveau loader premium à étendre aux 16 pages restantes."
        >
          <SubSection label="NeuroLoader — size=“sm”" codeHint="<NeuroLoader size='sm' message='…' />">
            <div className="flex items-center justify-center h-32 bg-white rounded-xl border border-gray-200">
              <NeuroLoader size="sm" message="Chargement…" />
            </div>
          </SubSection>

          <SubSection label="NeuroLoader — size=“md” (défaut)" codeHint="<NeuroLoader />">
            <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-gray-200">
              <NeuroLoader message="Chargement des données…" />
            </div>
          </SubSection>

          <SubSection label="NeuroLoader — size=“lg”" codeHint="<NeuroLoader size='lg' message='…' />">
            <div className="flex items-center justify-center h-64 bg-white rounded-xl border border-gray-200">
              <NeuroLoader size="lg" message="Chargement du dossier…" />
            </div>
          </SubSection>

          <SubSection
            label="NeuroLoader — size=“fullscreen”"
            codeHint="<NeuroLoader size='fullscreen' message='…' />"
          >
            <button
              onClick={triggerFullscreen}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#027e7e' }}
            >
              Déclencher (3s)
            </button>
            <p className="text-xs text-gray-500 mt-2">
              Utilisé sur <code>/dashboard/family/children/[id]/dossier</code> et{' '}
              <code>/dashboard/educator/session/[id]</code>.
            </p>
          </SubSection>

          <SubSection
            label="Ancien spinner basique"
            codeHint='<div className="animate-spin rounded-full h-12 w-12 border-b-2" ... />'
          >
            <div className="flex items-center justify-center h-32 bg-white rounded-xl border border-gray-200">
              <div className="text-center">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
                  style={{ borderColor: '#027e7e' }}
                  role="status"
                  aria-label="Chargement en cours"
                />
                <p className="text-gray-500 mt-4 text-sm">Chargement…</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Pattern actuel sur 16 pages (famille, éducateur, public). À remplacer par <code>&lt;NeuroLoader size="fullscreen" /&gt;</code>.
            </p>
          </SubSection>
        </Section>

        {/* ═══ SECTION 1bis : VARIANTES DU LOADER (A/B/C) ═══ */}
        <Section
          number="1bis"
          title="Variantes du NeuroLoader — A / B / C"
          description="Trois directions visuelles alternatives au loader actuel. Même API (size, message). Objectif : choisir la direction définitive avant de propager sur les 16 pages."
        >
          {/* Comparaison côte-à-côte en taille md (défaut) */}
          <SubSection
            label="Comparaison size='md' (défaut)"
            codeHint="<NeuroLoader /> · <NeuroLoaderOrbital /> · <NeuroLoaderEEG /> · <NeuroLoaderSynapse />"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="flex flex-col items-center justify-center h-56 bg-white rounded-xl border border-gray-200 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Actuel — Brain pulse
                </span>
                <NeuroLoader message="Chargement…" />
              </div>
              <div className="flex flex-col items-center justify-center h-56 bg-white rounded-xl border-2 p-4" style={{ borderColor: '#027e7e20' }}>
                <span className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#027e7e' }}>
                  A — Orbital synapses
                </span>
                <NeuroLoaderOrbital message="Chargement…" />
              </div>
              <div className="flex flex-col items-center justify-center h-56 bg-white rounded-xl border-2 p-4" style={{ borderColor: '#41005c20' }}>
                <span className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#41005c' }}>
                  B — EEG / onde
                </span>
                <NeuroLoaderEEG message="Chargement…" />
              </div>
              <div className="flex flex-col items-center justify-center h-56 bg-white rounded-xl border-2 p-4" style={{ borderColor: '#f0879f40' }}>
                <span className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#c84a6b' }}>
                  C — Synapse pulse
                </span>
                <NeuroLoaderSynapse message="Chargement…" />
              </div>
            </div>
          </SubSection>

          {/* Comparaison taille large */}
          <SubSection
            label="Comparaison size='lg'"
            codeHint="<... size='lg' />"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center h-72 bg-white rounded-xl border-2 p-4" style={{ borderColor: '#027e7e20' }}>
                <span className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#027e7e' }}>
                  A — Orbital synapses
                </span>
                <NeuroLoaderOrbital size="lg" message="Chargement du dossier…" />
              </div>
              <div className="flex flex-col items-center justify-center h-72 bg-white rounded-xl border-2 p-4" style={{ borderColor: '#41005c20' }}>
                <span className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#41005c' }}>
                  B — EEG / onde
                </span>
                <NeuroLoaderEEG size="lg" message="Chargement du dossier…" />
              </div>
              <div className="flex flex-col items-center justify-center h-72 bg-white rounded-xl border-2 p-4" style={{ borderColor: '#f0879f40' }}>
                <span className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#c84a6b' }}>
                  C — Synapse pulse
                </span>
                <NeuroLoaderSynapse size="lg" message="Chargement du dossier…" />
              </div>
            </div>
          </SubSection>

          {/* Comparaison taille small (compact / inline) */}
          <SubSection
            label="Comparaison size='sm' (usage inline)"
            codeHint="<... size='sm' />"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center justify-center h-28 bg-white rounded-xl border border-gray-200">
                <NeuroLoader size="sm" />
              </div>
              <div className="flex items-center justify-center h-28 bg-white rounded-xl border-2" style={{ borderColor: '#027e7e20' }}>
                <NeuroLoaderOrbital size="sm" />
              </div>
              <div className="flex items-center justify-center h-28 bg-white rounded-xl border-2" style={{ borderColor: '#41005c20' }}>
                <NeuroLoaderEEG size="sm" />
              </div>
              <div className="flex items-center justify-center h-28 bg-white rounded-xl border-2" style={{ borderColor: '#f0879f40' }}>
                <NeuroLoaderSynapse size="sm" />
              </div>
            </div>
          </SubSection>

          {/* Fullscreen triggers */}
          <SubSection
            label="Aperçu fullscreen (3s chacun)"
            codeHint="<... size='fullscreen' />"
          >
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFullscreenVariant('orbital');
                  setTimeout(() => setFullscreenVariant(null), 3000);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#027e7e' }}
              >
                A — Orbital
              </button>
              <button
                onClick={() => {
                  setFullscreenVariant('eeg');
                  setTimeout(() => setFullscreenVariant(null), 3000);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#41005c' }}
              >
                B — EEG
              </button>
              <button
                onClick={() => {
                  setFullscreenVariant('synapse');
                  setTimeout(() => setFullscreenVariant(null), 3000);
                }}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#c84a6b' }}
              >
                C — Synapse
              </button>
            </div>
          </SubSection>
        </Section>

        {/* ═══ SECTION 2 : TOASTS ═══ */}
        <Section
          number="2"
          title="Toasts (notifications glissantes)"
          description="Messages courts qui apparaissent en coin après une action (enregistrement, envoi, erreur réseau). Auto-hide après quelques secondes."
        >
          <SubSection
            label="Toast succès"
            codeHint="showToast('Message', 'success')"
          >
            <button
              onClick={() => showToast('Profil enregistré avec succès', 'success')}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Déclencher toast succès
            </button>
          </SubSection>

          <SubSection
            label="Toast erreur"
            codeHint="showToast('Message', 'error')"
          >
            <button
              onClick={() => showToast('Impossible de contacter le serveur', 'error')}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700"
            >
              Déclencher toast erreur
            </button>
          </SubSection>

          <SubSection
            label="Toast info"
            codeHint="showToast('Message', 'info')"
          >
            <button
              onClick={() => showToast('Un nouveau document est disponible', 'info')}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-sky-600 text-white hover:bg-sky-700"
            >
              Déclencher toast info
            </button>
          </SubSection>
        </Section>

        {/* ═══ SECTION 3 : CONFIRM DIALOGS ═══ */}
        <Section
          number="3"
          title="Dialogues de confirmation (remplacent confirm() natif)"
          description='Modal centré avec backdrop flou, focus automatique, Esc pour annuler, Enter pour confirmer. Remplace progressivement les 19 confirm() de Chrome dispersés dans le code.'
        >
          <SubSection label="Variant info (défaut)" codeHint="await confirm({ title, variant: 'info' })">
            <button
              onClick={() => triggerConfirm('info')}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: '#027e7e' }}
            >
              Confirmer (info)
            </button>
          </SubSection>

          <SubSection label="Variant warning" codeHint="await confirm({ title, variant: 'warning' })">
            <button
              onClick={() => triggerConfirm('warning')}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 bg-amber-600"
            >
              Confirmer (warning)
            </button>
          </SubSection>

          <SubSection label="Variant danger" codeHint="await confirm({ title, variant: 'danger' })">
            <button
              onClick={() => triggerConfirm('danger')}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 bg-red-600"
            >
              Confirmer (danger)
            </button>
          </SubSection>

          <SubSection
            label="Prompt (saisie texte)"
            codeHint="await prompt({ title, multiline: true, required: true })"
          >
            <button
              onClick={triggerPrompt}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:opacity-90 bg-red-600"
            >
              Saisir une raison
            </button>
          </SubSection>

          {confirmResult && (
            <div className="mt-4 p-3 rounded-lg bg-gray-50 text-sm text-gray-700 font-mono">
              Dernier retour : <span className="font-semibold">{confirmResult}</span>
            </div>
          )}
        </Section>

        {/* ═══ SECTION 4 : NATIVES À SUPPRIMER ═══ */}
        <Section
          number="4"
          title="Notifications natives du navigateur (à supprimer)"
          description="Les confirm() et prompt() de Chrome qu'Anissa trouve trop intrusifs. 19 occurrences de confirm() + 1 de prompt() encore présents dans le code — ils seront remplacés par le dialog maison ci-dessus."
        >
          <SubSection
            label="window.confirm() — apparence"
            codeHint='if (confirm("Êtes-vous sûr ?")) { … }'
          >
            <button
              onClick={() => {
                // eslint-disable-next-line no-alert
                const ok = window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?');
                setConfirmResult(`Native confirm → ${ok ? '✓ OK' : '✗ Annuler'}`);
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Déclencher confirm() natif
            </button>
            <p className="text-xs text-red-600 mt-2">
              ⚠ Style navigateur, pas cohérent avec le produit, bloquant, ne peut pas être thémé.
            </p>
          </SubSection>

          <SubSection label="window.prompt() — apparence" codeHint='const v = prompt("Raison ?")'>
            <button
              onClick={() => {
                // eslint-disable-next-line no-alert
                const v = window.prompt('Raison du refus :');
                setConfirmResult(v ? `Native prompt → "${v}"` : 'Native prompt annulé');
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300"
            >
              Déclencher prompt() natif
            </button>
          </SubSection>
        </Section>

        {/* ═══ SECTION 5 : CAS RÉELS DU SITE ═══ */}
        <Section
          number="5"
          title="Cas réels du produit à migrer"
          description="Chaque bouton ci-dessous reproduit un confirm() ou prompt() existant dans le code, avec son wording d'origine, mais rendu via le dialog maison (hook useConfirm / usePrompt). Clique pour voir comment la migration habillera chaque cas."
        >
          {(['Famille', 'Éducateur', 'Upload', 'Admin'] as const).map((area) => {
            const cases = REAL_CASES.filter((c) => c.area === area);
            return (
              <div key={area} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        area === 'Famille'
                          ? '#027e7e'
                          : area === 'Éducateur'
                          ? '#41005c'
                          : area === 'Admin'
                          ? '#dc2626'
                          : '#f59e0b',
                    }}
                  />
                  {area}
                  <span className="text-xs font-normal text-gray-400">
                    — {cases.length} {cases.length > 1 ? 'cas' : 'cas'}
                  </span>
                </h3>
                <ul className="space-y-1.5">
                  {cases.map((c) => (
                    <li
                      key={c.source}
                      className="flex items-center justify-between gap-3 px-3 py-2 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {c.title}
                          {c.kind === 'prompt' && (
                            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                              prompt
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate font-mono">{c.source}</p>
                      </div>
                      <button
                        onClick={() => triggerRealCase(c)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-opacity hover:opacity-90 ${
                          c.variant === 'danger'
                            ? 'bg-red-600'
                            : c.variant === 'warning'
                            ? 'bg-amber-600'
                            : ''
                        }`}
                        style={
                          c.variant === 'info'
                            ? { backgroundColor: '#027e7e' }
                            : undefined
                        }
                      >
                        Tester
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </Section>

        <footer className="mt-12 pt-6 border-t border-gray-200 text-xs text-gray-500">
          <p>
            Cette page n'est pas référencée dans la navigation publique. Accès direct via{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded">/dev/notifications</code>.
          </p>
        </footer>
      </div>
    </div>
  );
}

/* ═══════════════ UI helpers ═══════════════ */

function Section({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-5 sm:px-6 pt-5 sm:pt-6">
        <div className="flex items-start gap-3 mb-1">
          <span
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ backgroundColor: '#027e7e' }}
          >
            {number}
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900" style={{ fontFamily: 'Verdana, sans-serif' }}>
            {title}
          </h2>
        </div>
        <p className="text-sm text-gray-600 ml-10 mb-5">{description}</p>
      </div>
      <div className="px-5 sm:px-6 pb-6 space-y-5">{children}</div>
    </section>
  );
}

function SubSection({
  label,
  codeHint,
  children,
}: {
  label: string;
  codeHint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {codeHint && (
          <code className="text-[11px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded font-mono">
            {codeHint}
          </code>
        )}
      </div>
      {children}
    </div>
  );
}

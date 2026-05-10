'use client';

import {
  DOC_TYPE_LABELS,
  DOC_TYPE_COLORS,
  MIME_LABELS,
  expiryDaysLeft,
  expiryStatus,
  formatBytes,
  formatFrenchDate,
  type ChildDocumentRow,
} from '@/lib/family/coffre-fort';

interface Props {
  documents: ReadonlyArray<ChildDocumentRow>;
  onView: (doc: ChildDocumentRow) => void;
  onDownload: (doc: ChildDocumentRow) => void;
  onShare: (doc: ChildDocumentRow) => void;
  onEdit: (doc: ChildDocumentRow) => void;
  onDelete: (doc: ChildDocumentRow) => void;
  onShowActivity: (doc: ChildDocumentRow) => void;
  busyDocId: string | null;
}

/**
 * Liste des documents avec actions par ligne.
 * Chaque ligne montre : type, titre, émetteur, date d'émission, taille, MIME,
 * badge échéance, et boutons d'action.
 */
export default function DocumentList({
  documents,
  onView,
  onDownload,
  onShare,
  onEdit,
  onDelete,
  onShowActivity,
  busyDocId,
}: Props) {
  if (documents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(2, 126, 126, 0.08)' }}
          aria-hidden="true"
        >
          <svg className="w-8 h-8" style={{ color: '#027e7e' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          Aucun document dans cette catégorie
        </h3>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          Ajoutez vos notifications MDPH, comptes-rendus, ordonnances ou documents
          de scolarité pour les centraliser au même endroit.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 sm:space-y-3">
      {documents.map((doc) => {
        const colors = DOC_TYPE_COLORS[doc.doc_type];
        const status = expiryStatus(doc.expires_at);
        const days = expiryDaysLeft(doc.expires_at);
        const busy = busyDocId === doc.id;

        return (
          <li
            key={doc.id}
            className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 transition hover:shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: colors.bg }}
                aria-hidden="true"
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: colors.text }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.border,
                    }}
                  >
                    {DOC_TYPE_LABELS[doc.doc_type]}
                  </span>
                  {doc.doc_subtype && (
                    <span className="text-xs text-gray-500">{doc.doc_subtype}</span>
                  )}
                  {status === 'expired' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                      Expiré
                    </span>
                  )}
                  {status === 'soon' && days !== null && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                      Expire dans {days} j
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                {doc.description && (
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                  {doc.issuer_name && (
                    <span>
                      <span className="text-gray-400">Émetteur :</span> {doc.issuer_name}
                    </span>
                  )}
                  {doc.issued_at && (
                    <span>
                      <span className="text-gray-400">Émis le</span> {formatFrenchDate(doc.issued_at)}
                    </span>
                  )}
                  {doc.expires_at && (
                    <span>
                      <span className="text-gray-400">Expire le</span> {formatFrenchDate(doc.expires_at)}
                    </span>
                  )}
                  <span>
                    {MIME_LABELS[doc.mime_type] ?? doc.mime_type} · {formatBytes(doc.size_bytes)}
                  </span>
                </div>

                {doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => onView(doc)}
                disabled={busy}
                className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Consulter
              </button>
              <button
                type="button"
                onClick={() => onDownload(doc)}
                disabled={busy}
                className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                style={{ backgroundColor: '#027e7e' }}
              >
                Télécharger
              </button>
              <button
                type="button"
                onClick={() => onShare(doc)}
                disabled={busy}
                className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Partager
              </button>
              <button
                type="button"
                onClick={() => onShowActivity(doc)}
                disabled={busy}
                className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                Activité
              </button>
              <button
                type="button"
                onClick={() => onEdit(doc)}
                disabled={busy}
                className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg text-teal-700 hover:bg-teal-50 disabled:opacity-50"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => onDelete(doc)}
                disabled={busy}
                className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50 ml-auto"
              >
                Supprimer
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
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

const ICON_VIEW = 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7z';
const ICON_DOWNLOAD = 'M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z';
const ICON_SHARE = 'M8.7 13.3l6.6 3.4M15.3 7.3l-6.6 3.4M19 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM19 19a3 3 0 1 1-6 0 3 3 0 0 1 6 0z';
const ICON_ACTIVITY = 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z';
const ICON_EDIT = 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z';
const ICON_DELETE = 'M19 7l-.87 12.14A2 2 0 0 1 16.14 21H7.86a2 2 0 0 1-1.99-1.86L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3';
const ICON_KEBAB = 'M12 5v.01M12 12v.01M12 19v.01';
const ICON_FILE = 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z';
const ICON_LOCK = 'M12 11c1.657 0 3-1.343 3-3V7a3 3 0 1 0-6 0v1c0 1.657 1.343 3 3 3zm-7 9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v7z';

interface ActionBtnProps {
  iconPath: string;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'edit' | 'danger';
  disabled?: boolean;
}

function ActionBtn({ iconPath, label, onClick, variant = 'default', disabled }: ActionBtnProps) {
  const styles =
    variant === 'primary'
      ? { backgroundColor: '#027e7e', color: '#fff', borderColor: '#027e7e' }
      : variant === 'edit'
        ? { backgroundColor: '#fff', color: '#027e7e', borderColor: '#cdeae9' }
        : variant === 'danger'
          ? { backgroundColor: '#fff', color: '#dc2626', borderColor: '#fecaca' }
          : { backgroundColor: '#fff', color: '#374151', borderColor: '#e5e7eb' };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-lg border transition hover:shadow-sm disabled:opacity-50"
      style={styles}
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
      </svg>
      <span>{label}</span>
    </button>
  );
}

function KebabMenu({
  doc,
  busy,
  onView,
  onDownload,
  onShare,
  onShowActivity,
  onEdit,
  onDelete,
}: {
  doc: ChildDocumentRow;
  busy: boolean;
  onView: (d: ChildDocumentRow) => void;
  onDownload: (d: ChildDocumentRow) => void;
  onShare: (d: ChildDocumentRow) => void;
  onShowActivity: (d: ChildDocumentRow) => void;
  onEdit: (d: ChildDocumentRow) => void;
  onDelete: (d: ChildDocumentRow) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const items: Array<{ label: string; iconPath: string; onClick: () => void; danger?: boolean }> = [
    { label: 'Consulter', iconPath: ICON_VIEW, onClick: () => onView(doc) },
    { label: 'Télécharger', iconPath: ICON_DOWNLOAD, onClick: () => onDownload(doc) },
    { label: 'Partager', iconPath: ICON_SHARE, onClick: () => onShare(doc) },
    { label: 'Activité', iconPath: ICON_ACTIVITY, onClick: () => onShowActivity(doc) },
    { label: 'Modifier', iconPath: ICON_EDIT, onClick: () => onEdit(doc) },
    { label: 'Supprimer', iconPath: ICON_DELETE, onClick: () => onDelete(doc), danger: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
        aria-label="Plus d'actions"
        aria-expanded={open}
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d={ICON_KEBAB} />
        </svg>
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
          role="menu"
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => {
                setOpen(false);
                it.onClick();
              }}
              className={`flex items-center gap-2 w-full text-left text-sm px-3 py-2 transition hover:bg-gray-50 ${
                it.danger ? 'text-red-600' : 'text-gray-700'
              }`}
              role="menuitem"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d={it.iconPath} />
              </svg>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
      <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)' }}
          aria-hidden="true"
        >
          <svg className="w-8 h-8" style={{ color: '#dc2626' }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={ICON_LOCK} />
          </svg>
        </div>
        <h3
          className="text-sm sm:text-base font-bold mb-1"
          style={{ fontFamily: 'Verdana, sans-serif', color: '#015c5c' }}
        >
          Aucun document dans cette catégorie
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
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
        const sharedCount = (doc as any).shares_count as number | undefined;

        return (
          <li
            key={doc.id}
            className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition hover:shadow-md"
          >
            <div className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colors.bg }}
                  aria-hidden="true"
                >
                  <svg
                    className="w-5 h-5"
                    style={{ color: colors.text }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={ICON_FILE} />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-sm sm:text-base font-bold text-gray-900 truncate"
                        style={{ fontFamily: 'Verdana, sans-serif' }}
                      >
                        {doc.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border,
                          }}
                        >
                          {DOC_TYPE_LABELS[doc.doc_type]}
                        </span>
                        {doc.doc_subtype && (
                          <span className="text-[11px] text-gray-500 truncate">
                            {doc.doc_subtype}
                          </span>
                        )}
                        {sharedCount !== undefined && sharedCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d={ICON_SHARE} />
                            </svg>
                            Partagé ({sharedCount})
                          </span>
                        )}
                        {status === 'expired' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            Expiré
                          </span>
                        )}
                        {status === 'soon' && days !== null && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-semibold border"
                            style={{
                              backgroundColor: 'rgba(217, 119, 6, 0.1)',
                              color: '#92400e',
                              borderColor: 'rgba(217, 119, 6, 0.3)',
                            }}
                          >
                            Expire dans {days} j
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Kebab mobile only */}
                    <div className="sm:hidden">
                      <KebabMenu
                        doc={doc}
                        busy={busy}
                        onView={onView}
                        onDownload={onDownload}
                        onShare={onShare}
                        onShowActivity={onShowActivity}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </div>
                  </div>

                  {doc.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1.5 line-clamp-2">
                      {doc.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] sm:text-xs text-gray-500">
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
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions inline desktop only */}
              <div className="hidden sm:flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                <ActionBtn iconPath={ICON_VIEW} label="Consulter" onClick={() => onView(doc)} disabled={busy} />
                <ActionBtn iconPath={ICON_DOWNLOAD} label="Télécharger" onClick={() => onDownload(doc)} variant="primary" disabled={busy} />
                <ActionBtn iconPath={ICON_SHARE} label="Partager" onClick={() => onShare(doc)} disabled={busy} />
                <ActionBtn iconPath={ICON_ACTIVITY} label="Activité" onClick={() => onShowActivity(doc)} disabled={busy} />
                <ActionBtn iconPath={ICON_EDIT} label="Modifier" onClick={() => onEdit(doc)} variant="edit" disabled={busy} />
                <div className="ml-auto">
                  <ActionBtn iconPath={ICON_DELETE} label="Supprimer" onClick={() => onDelete(doc)} variant="danger" disabled={busy} />
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

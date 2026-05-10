import Link from 'next/link';
import type { DirectoryEntry } from '@/lib/annuaire/types';
import { DIRECTORY_TYPES } from '@/lib/annuaire/types';
import { getDepartment } from '@/lib/annuaire/departments';

interface EntryCardProps {
  entry: DirectoryEntry;
}

export default function EntryCard({ entry }: EntryCardProps) {
  const config = DIRECTORY_TYPES[entry.type];
  const dept = entry.department_code ? getDepartment(entry.department_code) : null;
  const href = `/annuaire/${entry.type}/${entry.department_code ?? 'autre'}/${entry.slug}`;

  return (
    <Link
      href={href}
      className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-teal-300 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded ${config.accent}`}>
          {config.label}
        </span>
        {dept && (
          <span className="text-xs text-gray-500">
            {dept.name} ({dept.code})
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{entry.name}</h3>
      {entry.city && (
        <p className="text-sm text-gray-600">
          {entry.address ? `${entry.address}, ` : ''}
          {entry.postal_code} {entry.city}
        </p>
      )}
      {entry.phone && (
        <p className="text-sm text-gray-500 mt-1">
          <span className="text-gray-400">Tél : </span>
          {entry.phone}
        </p>
      )}
    </Link>
  );
}

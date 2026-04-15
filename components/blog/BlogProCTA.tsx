import Link from 'next/link';

export default function BlogProCTA() {
  return (
    <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
      <Link
        href="/auth/register-educator"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
        style={{ color: '#41005c' }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Rejoindre NeuroCare Pro
      </Link>
      <Link
        href="/pro"
        className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl text-white border border-white/30 hover:bg-white/10 transition-colors text-sm"
      >
        En savoir plus
      </Link>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function BlogEducatorCTA() {
  const [isEducator, setIsEducator] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data: educator } = await supabase
        .from('educator_profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (educator) setIsEducator(true);
    })();
  }, []);

  if (!isEducator) return null;

  return (
    <Link
      href="/dashboard/educator/blog"
      className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 transition-colors text-sm"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      Mes articles
    </Link>
  );
}

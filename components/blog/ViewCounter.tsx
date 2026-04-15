'use client';

import { useEffect } from 'react';
import { incrementViewCount } from '@/lib/blog/actions';

interface ViewCounterProps {
  postId: string;
}

export default function ViewCounter({ postId }: ViewCounterProps) {
  useEffect(() => {
    incrementViewCount(postId).catch(() => {});
  }, [postId]);

  return null;
}

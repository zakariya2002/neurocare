-- Add audience column to blog_posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'family'
  CHECK (audience IN ('family', 'pro', 'both'));

CREATE INDEX IF NOT EXISTS idx_blog_posts_audience ON public.blog_posts(audience);

-- Existing posts stay 'family' by default (safe backfill)

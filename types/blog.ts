// Blog types for professional articles

export type BlogPostStatus = 'draft' | 'pending' | 'published' | 'rejected';

export type BlogCategory =
  | 'education'
  | 'sante'
  | 'conseils'
  | 'temoignages'
  | 'ressources'
  | 'daily_life'
  | 'professionals'
  | 'rights';

export const BLOG_CATEGORIES: { value: BlogCategory; label: string; color: string }[] = [
  { value: 'education', label: 'Éducation', color: '#027e7e' },
  { value: 'sante', label: 'Santé', color: '#ef4444' },
  { value: 'conseils', label: 'Conseils pratiques', color: '#f59e0b' },
  { value: 'temoignages', label: 'Témoignages', color: '#8b5cf6' },
  { value: 'ressources', label: 'Ressources', color: '#3b82f6' },
  { value: 'daily_life', label: 'Vie quotidienne', color: '#0ea5e9' },
  { value: 'professionals', label: 'Professionnels', color: '#41005c' },
  { value: 'rights', label: 'Droits & démarches', color: '#0d9488' },
];

export const BLOG_STATUS_LABELS: { [key in BlogPostStatus]: { label: string; color: string; bgColor: string } } = {
  draft: { label: 'Brouillon', color: '#6b7280', bgColor: '#f3f4f6' },
  pending: { label: 'En attente de validation', color: '#f59e0b', bgColor: '#fef3c7' },
  published: { label: 'Publié', color: '#10b981', bgColor: '#d1fae5' },
  rejected: { label: 'Refusé', color: '#ef4444', bgColor: '#fee2e2' },
};

export interface BlogAuthor {
  id: string;
  first_name: string;
  last_name: string;
  profession_type: string;
  avatar_url?: string;
  gender?: 'male' | 'female';
}

export interface BlogPost {
  id: string;
  author_id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: BlogCategory;
  tags?: string[];
  image_url?: string;
  status: BlogPostStatus;
  rejection_reason?: string;
  read_time_minutes: number;
  views_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author?: BlogAuthor;
}

export interface CreateBlogPostData {
  title: string;
  content: string;
  excerpt: string;
  category: BlogCategory;
  image_url?: string;
}

export interface UpdateBlogPostData {
  title?: string;
  content?: string;
  excerpt?: string;
  category?: BlogCategory;
  image_url?: string;
}

export interface BlogPostsQueryParams {
  category?: BlogCategory;
  search?: string;
  page?: number;
  limit?: number;
  status?: BlogPostStatus;
  authorId?: string;
}

export interface BlogPostsResult {
  posts: BlogPost[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Helper function to get category info
export function getCategoryInfo(category: BlogCategory) {
  return BLOG_CATEGORIES.find(c => c.value === category) || BLOG_CATEGORIES[0];
}

// Helper function to get status info
export function getStatusInfo(status: BlogPostStatus) {
  return BLOG_STATUS_LABELS[status];
}

// Helper function to calculate read time from content
export function calculateReadTime(content: string): number {
  // Average reading speed: 200 words per minute
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

// Helper function to generate excerpt from content
export function generateExcerpt(content: string, maxLength: number = 200): string {
  // Remove HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');
  // Truncate and add ellipsis
  if (plainText.length <= maxLength) return plainText;
  return plainText.slice(0, maxLength).trim() + '...';
}

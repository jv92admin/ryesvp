import { redirect } from 'next/navigation';

interface ShortProfilePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Short URL redirect for user profiles
 * /u/[id] → /users/[id]
 * 
 * Preserves query params for ref codes and other context
 */
export default async function ShortProfilePage({ params, searchParams }: ShortProfilePageProps) {
  const { id } = await params;
  const query = await searchParams;
  
  // Build query string from searchParams
  const queryString = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      queryString.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach(v => queryString.append(key, v));
    }
  }
  
  const qs = queryString.toString();
  const targetUrl = `/users/${id}${qs ? `?${qs}` : ''}`;
  
  redirect(targetUrl);
}


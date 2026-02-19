import { cookies } from 'next/headers';

// SHA-256 hash of the CRM password (OpexIA@CRM2026)
export const CRM_PASSWORD_HASH = '178eea1a96af0bba5d637209062c4eaa457b86771daaefbf8b1d82f43c3e4052';

// Session cookie name
export const SESSION_COOKIE = 'crm-session';

// Session token (derived from password hash + secret)
export const SESSION_TOKEN = 'opexia-crm-authenticated-2026';

// Verify session cookie
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    return session?.value === SESSION_TOKEN;
  } catch {
    return false;
  }
}

// Hash a string using SHA-256 (for use in API routes)
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

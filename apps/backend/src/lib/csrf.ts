import { cookies } from 'next/headers';
import crypto from 'crypto';

const CSRF_COOKIE = 'csrfToken';

export async function ensureCsrfToken() {
  const c = await cookies();
  const existing = c.get(CSRF_COOKIE)?.value;
  if (!existing) {
    const token = crypto.randomBytes(16).toString('hex');
    c.set(CSRF_COOKIE, token, { path: '/', sameSite: 'lax', httpOnly: false });
    return token;
  }
  return existing;
}

export async function validateCsrf(headerToken?: string | null) {
  const c = await cookies();
  const cookieToken = c.get(CSRF_COOKIE)?.value;
  return cookieToken && headerToken && cookieToken === headerToken;
}


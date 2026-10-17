// Single shared-password auth. The cookie holds SHA-256(password:secret), so it is
// useless without the server-side secret and invalidates when either one changes.
// Uses Web Crypto so it works in both the Edge middleware and Node server actions.
export const COOKIE = "dash_session";

export async function sessionToken(): Promise<string> {
  const pw = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!pw || !secret) throw new Error("DASHBOARD_PASSWORD and AUTH_SECRET must be set");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${pw}:${secret}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

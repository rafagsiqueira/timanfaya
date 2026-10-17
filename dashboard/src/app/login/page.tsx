import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE, safeEqual, sessionToken } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";
  const given = String(formData.get("password") ?? "");
  const expected = process.env.DASHBOARD_PASSWORD ?? "";
  // Compare as hashes of equal length so comparison time doesn't leak the password length.
  const h = async (s: string) =>
    [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
      .map((b) => b.toString(16).padStart(2, "0")).join("");
  if (!expected || !safeEqual(await h(given), await h(expected))) redirect("/login?error=1");
  (await cookies()).set(COOKIE, await sessionToken(), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="login">
      <form action={login} className="card">
        <h1>Timanfaya · Marketing</h1>
        <label>Senha<input name="password" type="password" autoFocus required /></label>
        {error && <p className="err">Senha incorreta.</p>}
        <button className="btn">Entrar</button>
      </form>
    </main>
  );
}

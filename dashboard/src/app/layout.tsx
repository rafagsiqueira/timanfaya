import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "Marketing · Timanfaya", robots: { index: false, follow: false } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="top"><div className="wrap"><Link href="/">Marketing · Imóveis</Link><Link href="/connections">Conexões</Link></div></header>
        {children}
      </body>
    </html>
  );
}

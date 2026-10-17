"use client";
import { useState } from "react";
import { formatBRL, parseBRL, splitTwoWays } from "@/lib/money";

/** Budget total + Instagram/Google split, with a live preview of the resulting amounts. */
export function SplitFields({ defaultTotal = "", defaultPct = 50 }: { defaultTotal?: string; defaultPct?: number }) {
  const [total, setTotal] = useState(defaultTotal);
  const [pct, setPct] = useState(defaultPct);
  const cents = parseBRL(total);
  const [ig, g] = cents ? splitTwoWays(cents, pct) : [0, 0];
  return (
    <>
      <label>Orçamento total (R$)
        <input name="total" required inputMode="decimal" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="5.000,00" />
      </label>
      <label style={{ flexBasis: 280 }}>
        Divisão: Instagram {pct}% · Google {100 - pct}%
        <input type="range" name="instagramPct" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(+e.target.value)} />
        <span style={{ display: "flex", justifyContent: "space-between" }}>
          <span><i className="dot" style={{ background: "var(--ig)" }} />{formatBRL(ig)}</span>
          <span><i className="dot" style={{ background: "var(--g)" }} />{formatBRL(g)}</span>
        </span>
      </label>
    </>
  );
}

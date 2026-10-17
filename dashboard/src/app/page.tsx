import { desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { db, schema } from "@/db";
import { createProperty } from "./actions";
import { formatBRL } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { properties, budgets } = schema;
  const rows = await db
    .select({
      id: properties.id, name: properties.name, location: properties.location, status: properties.status,
      asking: properties.askingPriceCents,
      budgetTotal: sql<number>`coalesce(sum(${budgets.totalCents}),0)::int`,
    })
    .from(properties).leftJoin(budgets, eq(budgets.propertyId, properties.id))
    .groupBy(properties.id).orderBy(desc(properties.createdAt));

  return (
    <main className="wrap">
      <h1>Imóveis</h1>
      <p className="sub">Escolha um imóvel para ver orçamento, divisão entre Instagram e Google e gastos.</p>
      <div className="grid">
        {rows.map((p) => (
          <Link key={p.id} href={`/properties/${p.id}`} className="card" style={{ textDecoration: "none" }}>
            <span className="pill">{p.status === "sold" ? "Vendido" : "À venda"}</span>
            <h3 style={{ marginTop: 8 }}>{p.name}</h3>
            <p className="sub" style={{ margin: "2px 0 12px" }}>{p.location ?? "—"}</p>
            <div className="sub" style={{ margin: 0 }}>Orçamento total de marketing</div>
            <div className="big">{formatBRL(p.budgetTotal)}</div>
            {p.asking != null && <div className="sub" style={{ margin: "6px 0 0" }}>Preço: {formatBRL(p.asking)}</div>}
          </Link>
        ))}
      </div>
      {rows.length === 0 && <p className="sub">Nenhum imóvel ainda. Cadastre o primeiro abaixo.</p>}

      <h2>Novo imóvel</h2>
      <form action={createProperty} className="card stack">
        <div className="row">
          <label>Nome<input name="name" required placeholder="Timanfaya · Estúdio 3º andar" /></label>
          <label>Localização<input name="location" placeholder="Jurerê, Florianópolis/SC" /></label>
        </div>
        <div className="row">
          <label>Preço de venda (R$)<input name="askingPrice" inputMode="decimal" placeholder="750.000" /></label>
          <label>Site do anúncio<input name="siteUrl" type="url" placeholder="https://rafagsiqueira.github.io/timanfaya/" /></label>
        </div>
        <div><button className="btn">Cadastrar imóvel</button></div>
      </form>
    </main>
  );
}

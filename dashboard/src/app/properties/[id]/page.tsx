import { asc, desc, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { formatBRL } from "@/lib/money";
import { CHANNEL_COLOR, CHANNEL_LABEL, budgetChannelStats, ratio, type ChannelStats } from "@/lib/stats";
import {
  addSpend, createBudget, createCampaign, deleteBudget, deleteSpend, setCampaignStatus, updateBudget,
} from "../../actions";
import { SplitFields } from "./split-fields";

export const dynamic = "force-dynamic";
const { properties, budgets, campaigns, spendEntries } = schema;
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) => d.split("-").reverse().join("/");
const reais = (c: number) => (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctOf = (n: number, d: number) => (d > 0 ? Math.min(100, (n / d) * 100) : 0);

function ChannelCard({ s }: { s: ChannelStats }) {
  const over = s.spent > s.allocated;
  const cpc = ratio(s.spent, s.clicks), cpl = ratio(s.spent, s.leads), ctr = ratio(s.clicks * 100, s.impressions);
  return (
    <div className="card ch">
      <div className="head">
        <h3><i className="dot" style={{ background: CHANNEL_COLOR[s.channel] }} />{CHANNEL_LABEL[s.channel]}</h3>
        <span className={over ? "warn" : "sub"} style={{ margin: 0 }}>{over ? "Acima do orçamento" : `${Math.round(pctOf(s.spent, s.allocated))}% usado`}</span>
      </div>
      <div className="big">{formatBRL(s.spent)} <span className="sub" style={{ fontSize: 14, fontWeight: 400 }}>de {formatBRL(s.allocated)}</span></div>
      <div className="meter"><i style={{ width: `${pctOf(s.spent, s.allocated)}%`, background: over ? "var(--bad)" : CHANNEL_COLOR[s.channel] }} /></div>
      <div className="sub" style={{ margin: 0 }}>Saldo: <b className={over ? "warn" : ""}>{formatBRL(s.allocated - s.spent)}</b></div>
      <div className="kpis">
        <div><b>{s.impressions.toLocaleString("pt-BR")}</b>impressões</div>
        <div><b>{s.clicks.toLocaleString("pt-BR")}</b>cliques{ctr != null && ` · ${ctr.toFixed(1)}%`}</div>
        <div><b>{s.leads}</b>contatos</div>
        <div><b>{cpc != null ? formatBRL(Math.round(cpc)) : "—"}</b>por clique</div>
        <div><b>{cpl != null ? formatBRL(Math.round(cpl)) : "—"}</b>por contato</div>
      </div>
    </div>
  );
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [property] = await db.select().from(properties).where(eq(properties.id, id));
  if (!property) notFound();

  const bs = await db.select().from(budgets).where(eq(budgets.propertyId, id)).orderBy(desc(budgets.startsOn));
  const ids = bs.map((b) => b.id);
  const stats = await budgetChannelStats(ids);
  const camps = ids.length ? await db.select().from(campaigns).where(inArray(campaigns.budgetId, ids)).orderBy(asc(campaigns.id)) : [];
  const spend = camps.length
    ? await db.select().from(spendEntries).where(inArray(spendEntries.campaignId, camps.map((c) => c.id))).orderBy(desc(spendEntries.spentOn), desc(spendEntries.id))
    : [];

  return (
    <main className="wrap">
      <p className="sub"><Link href="/">← Imóveis</Link></p>
      <h1>{property.name}</h1>
      <p className="sub">
        {property.location ?? ""}{property.askingPriceCents != null && ` · ${formatBRL(property.askingPriceCents)}`}
        {property.siteUrl && <> · <a href={property.siteUrl} target="_blank" rel="noopener">ver anúncio</a></>}
      </p>

      {bs.map((b) => {
        const st = stats.get(b.id)!;
        const spent = st.reduce((a, s) => a + s.spent, 0);
        const bCamps = camps.filter((c) => c.budgetId === b.id);
        const bSpend = spend.filter((s) => bCamps.some((c) => c.id === s.campaignId));
        const igPct = b.totalCents ? Math.round((st[0].allocated / b.totalCents) * 100) : 50;
        return (
          <section key={b.id}>
            <h2>{b.name} <span className="pill">{fmtDate(b.startsOn)}{b.endsOn ? ` → ${fmtDate(b.endsOn)}` : ""}</span></h2>
            <div className="card stack">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <div><div className="sub" style={{ margin: 0 }}>Orçamento total</div><div className="big">{formatBRL(b.totalCents)}</div></div>
                <div style={{ textAlign: "right" }}><div className="sub" style={{ margin: 0 }}>Gasto até agora</div><div className="big">{formatBRL(spent)}</div></div>
              </div>
              <div className="bar" title="Divisão do orçamento">
                {st.map((s) => <i key={s.channel} style={{ width: `${pctOf(s.allocated, b.totalCents)}%`, background: CHANNEL_COLOR[s.channel] }} />)}
              </div>
              <details>
                <summary>Alterar orçamento e divisão</summary>
                <form action={updateBudget.bind(null, b.id, id)} className="row" style={{ marginTop: 12 }}>
                  <SplitFields defaultTotal={reais(b.totalCents)} defaultPct={igPct} />
                  <button className="btn sm">Salvar</button>
                </form>
              </details>
            </div>

            <div className="grid" style={{ marginTop: 14 }}>{st.map((s) => <ChannelCard key={s.channel} s={s} />)}</div>

            <h3 style={{ margin: "28px 0 10px" }}>Campanhas</h3>
            <div className="card scroll">
              {bCamps.length === 0 ? <p className="sub" style={{ margin: 0 }}>Nenhuma campanha ainda.</p> : (
                <table>
                  <thead><tr><th>Campanha</th><th>Canal</th><th>Status</th><th className="n">Gasto</th></tr></thead>
                  <tbody>{bCamps.map((c) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td><i className="dot" style={{ background: CHANNEL_COLOR[c.channel] }} />{CHANNEL_LABEL[c.channel]}</td>
                      <td>
                        <form action={setCampaignStatus.bind(null, c.id, id)}>
                          <select name="status" defaultValue={c.status} style={{ padding: "4px 6px" }}>
                            {(["draft", "active", "paused", "ended"] as const).map((v) => <option key={v} value={v}>{{ draft: "Rascunho", active: "Ativa", paused: "Pausada", ended: "Encerrada" }[v]}</option>)}
                          </select> <button className="btn ghost sm">OK</button>
                        </form>
                      </td>
                      <td className="n">{formatBRL(bSpend.filter((s) => s.campaignId === c.id).reduce((a, s) => a + s.amountCents, 0))}</td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
              <details>
                <summary>Nova campanha</summary>
                <form action={createCampaign.bind(null, b.id, id)} className="row" style={{ marginTop: 12 }}>
                  <label>Nome<input name="name" required placeholder="Stories · vista para o mar" /></label>
                  <label>Canal<select name="channel"><option value="instagram">Instagram</option><option value="google">Google</option></select></label>
                  <label>ID na plataforma (opcional)<input name="externalId" /></label>
                  <button className="btn sm">Criar</button>
                </form>
              </details>
            </div>

            <h3 style={{ margin: "28px 0 10px" }}>Gastos</h3>
            <div className="card">
              {bCamps.length > 0 && (
                <form action={addSpend.bind(null, id)} className="row" style={{ marginBottom: 16 }}>
                  <label>Campanha<select name="campaignId">{bCamps.map((c) => <option key={c.id} value={c.id}>{CHANNEL_LABEL[c.channel]} · {c.name}</option>)}</select></label>
                  <label>Data<input type="date" name="spentOn" defaultValue={today()} required /></label>
                  <label>Valor (R$)<input name="amount" required inputMode="decimal" placeholder="150,00" /></label>
                  <label>Impressões<input name="impressions" type="number" min={0} defaultValue={0} /></label>
                  <label>Cliques<input name="clicks" type="number" min={0} defaultValue={0} /></label>
                  <label>Contatos<input name="leads" type="number" min={0} defaultValue={0} /></label>
                  <button className="btn sm">Registrar</button>
                </form>
              )}
              <div className="scroll">
                {bSpend.length === 0 ? <p className="sub" style={{ margin: 0 }}>Nenhum gasto registrado.</p> : (
                  <table>
                    <thead><tr><th>Data</th><th>Campanha</th><th className="n">Valor</th><th className="n">Cliques</th><th className="n">Contatos</th><th /></tr></thead>
                    <tbody>{bSpend.map((s) => {
                      const c = bCamps.find((x) => x.id === s.campaignId)!;
                      return (
                        <tr key={s.id}>
                          <td>{fmtDate(s.spentOn)}</td>
                          <td><i className="dot" style={{ background: CHANNEL_COLOR[c.channel] }} />{c.name}</td>
                          <td className="n">{formatBRL(s.amountCents)}</td><td className="n">{s.clicks}</td><td className="n">{s.leads}</td>
                          <td className="n"><form action={deleteSpend.bind(null, s.id, id)}><button className="btn danger sm" aria-label="Remover gasto">Remover</button></form></td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                )}
              </div>
            </div>
            <form action={deleteBudget.bind(null, b.id, id)} style={{ marginTop: 14 }}>
              <button className="btn danger sm">Excluir este orçamento</button>
            </form>
          </section>
        );
      })}

      <h2>{bs.length ? "Novo orçamento" : "Definir orçamento"}</h2>
      <form action={createBudget.bind(null, id)} className="card stack">
        <div className="row">
          <label>Nome<input name="name" required defaultValue="Lançamento" /></label>
          <label>Início<input type="date" name="startsOn" defaultValue={today()} required /></label>
          <label>Fim (opcional)<input type="date" name="endsOn" /></label>
        </div>
        <div className="row"><SplitFields defaultPct={60} /></div>
        <div><button className="btn">Criar orçamento</button></div>
      </form>
    </main>
  );
}

"use client";
import { useActionState, useState } from "react";
import { createCampaign, type CampaignFormState } from "../../actions";
import { OBJECTIVES, trackedUrl } from "@/lib/campaign";

type Props = { budgetId: number; propertyId: number; defaultLink: string; startsOn: string; endsOn: string };

export function CampaignForm({ budgetId, propertyId, defaultLink, startsOn, endsOn }: Props) {
  const [state, action, pending] = useActionState<CampaignFormState, FormData>(
    createCampaign.bind(null, budgetId, propertyId), {},
  );
  const [channel, setChannel] = useState("instagram");
  const [name, setName] = useState("");
  const [link, setLink] = useState(defaultLink);
  let preview = "";
  try { if (link && name) preview = trackedUrl(link, channel, name); } catch { /* invalid URL while typing */ }

  return (
    <form action={action} className="stack" style={{ marginTop: 12 }}>
      <div className="row">
        <label>Nome<input name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Vista para o mar · Brasil" /></label>
        <label>Canal
          <select name="channel" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="instagram">Instagram</option><option value="google">Google</option>
          </select>
        </label>
        <label>Objetivo
          <select name="objective" defaultValue="whatsapp">
            {Object.entries(OBJECTIVES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
      </div>
      <div className="row">
        <label>Orçamento diário (R$)<input name="dailyBudget" required inputMode="decimal" placeholder="30,00" /></label>
        <label>Início<input type="date" name="startsOn" required defaultValue={startsOn} /></label>
        <label>Fim<input type="date" name="endsOn" required defaultValue={endsOn} /></label>
      </div>
      <div className="row">
        <label>Localização<input name="locations" required defaultValue="Brasil" /></label>
        <label>Idade mín.<input type="number" name="ageMin" min={18} max={65} defaultValue={28} required /></label>
        <label>Idade máx.<input type="number" name="ageMax" min={18} max={65} defaultValue={65} required /></label>
      </div>
      <label>{channel === "instagram" ? "Interesses (separados por vírgula)" : "Palavras-chave (separadas por vírgula)"}
        <input name="audience" defaultValue={channel === "instagram"
          ? "Imóveis, Investimento imobiliário, Florianópolis, Casa de praia"
          : "apartamento jurerê, studio à venda florianópolis, imóvel vista mar florianópolis"} key={channel} />
      </label>
      <div className="row">
        <label>Título do anúncio (máx. 40)<input name="headline" required maxLength={40} defaultValue="Estúdio com vista para o mar" /></label>
        <label>Imagem (URL)<input name="creativeUrl" type="url" placeholder="https://…/img/hoje-sala.jpg" /></label>
      </div>
      <label>Texto do anúncio (máx. 125)
        <input name="bodyText" required maxLength={125} defaultValue="Estúdio de 32 m² em Jurerê, 3º andar, com lazer completo. Fale direto com o proprietário." />
      </label>
      <label>Link de destino<input name="linkUrl" type="url" required value={link} onChange={(e) => setLink(e.target.value)} /></label>
      {preview && <p className="sub" style={{ margin: 0, wordBreak: "break-all" }}>Link rastreado: {preview}</p>}
      {state.error && <p className="err" role="alert">{state.error}</p>}
      {state.ok && <p style={{ margin: 0, color: "var(--ok)" }}>Campanha salva como rascunho.</p>}
      <div><button className="btn sm" disabled={pending}>{pending ? "Salvando…" : "Salvar rascunho"}</button></div>
      <p className="sub" style={{ margin: 0 }}>O rascunho não gasta nada. A publicação no Instagram/Google exige conectar as contas de anúncios (ver Conexões).</p>
    </form>
  );
}

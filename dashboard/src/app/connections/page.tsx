export const dynamic = "force-dynamic";

const PLATFORMS = [
  {
    name: "Instagram (Meta Ads)",
    vars: ["META_ACCESS_TOKEN", "META_AD_ACCOUNT_ID", "META_PAGE_ID", "META_INSTAGRAM_ACCOUNT_ID"],
    steps: [
      "Crie uma Página do Facebook e converta o Instagram para conta profissional, ligada à Página.",
      "Crie um Business Manager (business.facebook.com) e adicione a Página, o Instagram e uma conta de anúncios com forma de pagamento.",
      "Crie um app em developers.facebook.com, adicione o produto Marketing API e gere um token de usuário do sistema com ads_management.",
      "Preencha as 4 variáveis na Vercel (META_AD_ACCOUNT_ID no formato act_123…).",
    ],
  },
  {
    name: "Google Ads",
    vars: ["GOOGLE_ADS_DEVELOPER_TOKEN", "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN", "GOOGLE_ADS_CUSTOMER_ID"],
    steps: [
      "Crie uma conta Google Ads (modo especialista, não 'campanha inteligente') com forma de pagamento.",
      "Crie uma conta de administrador (MCC) e solicite o Developer Token em Ferramentas → Central de API. A aprovação do acesso Básico pode levar dias.",
      "No Google Cloud, crie credenciais OAuth (Client ID/Secret) e gere um Refresh Token.",
      "Preencha as 5 variáveis na Vercel.",
    ],
  },
];

export default function Connections() {
  return (
    <main className="wrap">
      <h1>Conexões</h1>
      <p className="sub">Contas de anúncios necessárias para publicar campanhas direto do painel. Aqui só mostramos se cada variável está definida, nunca o valor.</p>
      <div className="grid">
        {PLATFORMS.map((p) => {
          const missing = p.vars.filter((v) => !process.env[v]);
          return (
            <div key={p.name} className="card stack">
              <h3>{p.name} <span className="pill" style={{ color: missing.length ? "var(--bad)" : "var(--ok)" }}>{missing.length ? "Não conectado" : "Conectado"}</span></h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {p.vars.map((v) => <li key={v}><code>{v}</code> {process.env[v] ? "✓" : <span className="warn">faltando</span>}</li>)}
              </ul>
              {missing.length > 0 && <ol style={{ margin: 0, paddingLeft: 18 }}>{p.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
            </div>
          );
        })}
      </div>
    </main>
  );
}

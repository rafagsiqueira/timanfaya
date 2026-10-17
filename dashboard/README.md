# Dashboard de marketing

Next.js (App Router) + Drizzle ORM + Neon Postgres, hospedado na Vercel.
Controla, por imóvel, o orçamento de marketing, a divisão entre Instagram e Google, campanhas e gastos.

## Rodar localmente
```bash
cd dashboard
cp .env.example .env.local     # preencha DATABASE_URL, DASHBOARD_PASSWORD, AUTH_SECRET
npm install
npm run db:migrate             # aplica drizzle/*.sql no Neon
npm run dev
```

## Publicar
1. **Neon:** crie um projeto e copie a connection string *pooled* para `DATABASE_URL`.
2. **Vercel:** importe o repositório, defina **Root Directory = `dashboard`** e as 3 variáveis de ambiente de `.env.example`.
3. Rode `npm run db:migrate` uma vez com a `DATABASE_URL` de produção.

## Modelo de dados
`properties` → `budgets` → `budget_allocations` (instagram/google; a soma é sempre igual ao total)
`budgets` → `campaigns` → `spend_entries` (gasto diário, impressões, cliques, contatos).
Valores em centavos (inteiros). Para novos imóveis basta cadastrar outro em "Novo imóvel".

## Testes
`npm test` (conversão de moeda e divisão do orçamento).

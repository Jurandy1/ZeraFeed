# ZeraFeed

SaaS para gestão e limpeza de publicações de Páginas do Facebook.

## Stack

- TanStack Start + React + Vite + Tailwind
- Supabase (auth + dados)
- Deploy: Vercel — https://zera-feed.vercel.app

## Desenvolvimento

```bash
cp .env.example .env   # preencha as chaves
npm install
npm run dev
```

## Variáveis (produção)

Veja `.env.example`. Na Vercel, configure no mínimo:

- `VITE_LOCAL_MODE=false`
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`

## Estrutura

```
src/           app, rotas, UI, lógica ZeraFeed
public/        assets estáticos (logo, prints do tutorial)
supabase/      migrations
```

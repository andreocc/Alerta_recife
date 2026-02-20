
# Deploy no Cloudflare (Alerta Recife)

## Pré-requisitos
- Conta Cloudflare
- Node.js instalado
- Wrangler CLI: `npm install -g wrangler`

## 1. Configurar Worker (Backend Proxy)

```bash
cd worker
npm install
wrangler login
wrangler secret put GEMINI_API_KEY
# Cole sua API key do Google AI Studio (obtenha em ai.google.dev)
wrangler deploy
```

Anote a URL do Worker gerada (ex: `https://alerta-recife-api.subdominio.workers.dev`).

## 2. Configurar Pages (Frontend)

```bash
cp .env.example .env
# Edite .env com a URL do Worker obtida no passo anterior
npm install
npm run build
wrangler pages deploy dist --project-name=alerta-recife
```

## 3. Variáveis de Ambiente no Painel Cloudflare

### No Cloudflare Pages:
1. Vá em **Settings > Environment Variables**.
2. Adicione: `VITE_WORKER_API_URL` com a URL do seu Worker.
3. Realize um novo deploy.

### No Cloudflare Workers:
1. Vá em **Settings > Variables**.
2. Adicione: `FRONTEND_URL` com a URL do seu site Pages para permitir CORS.
3. Clique em **Save and Deploy**.

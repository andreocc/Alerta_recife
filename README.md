# 🌊 Alerta Recife

**Prevenção Inteligente de Alagamentos em Recife** — PWA mobile-first que prevê riscos de alagamento combinando dados de chuva e maré em tempo real.

🔗 **[alerta-recife-three.vercel.app](https://alerta-recife-three.vercel.app/)**

---

## ⚡ Funcionamento

Recife é uma cidade abaixo do nível do mar. O alagamento ocorre quando **chuva forte** coincide com **maré alta** — a maré bloqueia o escoamento da água pelos canais, causando refluxo e transbordamento.

O app cruza dois dados em tempo real:

| Fonte | Dado | Custo |
|---|---|---|
| [Open-Meteo](https://open-meteo.com/) | Precipitação, temperatura | **Grátis**, sem chave |
| Cálculo harmônico | Altura da maré (Porto do Recife) | **Grátis**, client-side |

A partir desses dados, um **motor determinístico** calcula o nível de risco:

```
Sem chuva                  → 🟢 BAIXO (não tem água acumulando)
Chuva forte + maré baixa   → 🟡 MÉDIO/🟠 ALTO (escoa)
Chuva forte + maré alta    → 🔴 CRÍTICO/🟣 EXTREMO (não escoa!)
```

**Zero dependência de IA ou APIs pagas.** Todos os textos são templates em português.

---

## 🚀 Stack

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 19 + TypeScript |
| **Build** | Vite 6 |
| **PWA** | vite-plugin-pwa + Service Worker customizado |
| **Estilo** | Tailwind CSS + Glassmorphism |
| **Mapa** | Leaflet (lazy loading) |
| **Gráficos** | Recharts |
| **Testes** | Vitest + Testing Library |
| **Deploy** | Vercel (estático) |

---

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Dev server (http://localhost:3000)
npm run dev

# Build produção
npm run build

# Testes
npm run test:run

# Preview produção local
npm run preview
```

---

## 📱 PWA

O app funciona como Progressive Web App:
- **Instalável** no celular (Android + iOS)
- **Offline**: cache de dados meteorológicos e de maré
- **Notificações**: alertas locais quando o nível de risco muda
- **Service Worker**: estratégia NetworkFirst para API, CacheFirst para assets

---

## 🗂️ Estrutura

```
src/
├── App.tsx                    # Componente principal
├── index.tsx                  # Entry point + PWA registration
├── types.ts                   # Tipos TypeScript
├── env.d.ts                   # Declarações de ambiente
├── sw.ts                      # Service Worker customizado
├── components/
│   ├── StatusCard.tsx         # Card principal de risco (3D glass)
│   ├── AlertBanner.tsx        # Banner de alerta com glow
│   ├── TideChart.tsx          # Gráfico de maré 24h
│   ├── TimelineOverlay.tsx    # Timeline hora a hora
│   ├── HistorySection.tsx     # Histórico de alagamentos
│   └── InteractiveMap.tsx     # Mapa Leaflet com zonas de risco
├── services/
│   ├── riskEngine.ts          # Motor determinístico de risco
│   ├── weatherService.ts      # Open-Meteo API (grátis)
│   ├── tideService.ts         # Cálculo harmônico de marés
│   ├── notificationService.ts # Alertas locais PWA
│   └── cacheManager.ts        # Cache localStorage genérico
└── test/
    ├── setup.ts
    ├── riskEngine.test.ts     # 21 testes de thresholds
    ├── cacheManager.test.ts   # 6 testes de cache
    ├── StatusCard.test.tsx    # 4 testes de renderização
    └── TideChart.test.tsx     # 3 testes de gráfico
```

---

## 🎨 Design System

- **Glassmorphism**: cards com `backdrop-blur` + bordas translúcidas
- **Sombras 3D**: camadas de profundidade (`shadow-3d`, `shadow-3d-lg`)
- **Gradientes dinâmicos**: cores mudam por nível de risco
- **Pílula flutuante**: navegação mobile-first
- **Animações**: `pulse-glow`, `float`, `slide-up`, `shimmer`

---

## 📊 Níveis de Risco

| Nível | Chuva | Maré | Cor |
|---|---|---|---|
| 🟢 **Baixo** | < 10mm/h | < 1.5m | Esmeralda |
| 🟡 **Médio** | 10-30mm/h | 1.5-2.0m | Âmbar |
| 🟠 **Alto** | 30-50mm/h | 2.0-2.5m | Laranja |
| 🔴 **Crítico** | 50-100mm/h | 2.5-3.0m | Vermelho |
| 🟣 **Extremo** | > 100mm/h | > 3.0m | Roxo |

O risco de alagamento é a **combinação** dos dois fatores: chuva forte **E** maré alta simultaneamente.

---

## 📄 Licença

MIT

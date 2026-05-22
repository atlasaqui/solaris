<div align="center">

<img src="https://img.shields.io/badge/Solaris-Ecossistema%20Dermatol%C3%B3gico-1B8A7A?style=for-the-badge&logo=sun&logoColor=white" alt="Solaris" />

# ☀️ Solaris

### Plataforma White Label para Clínicas Dermatológicas

**O app da sua clínica. Com a sua marca.**  
Biblioteca de conteúdo · Evolução fotográfica · Wiki clínica · Alertas UV · Gamificação

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.16x-FF4154?style=flat-square)](https://tanstack.com/start)
[![Supabase](https://img.shields.io/badge/Supabase-BaaS-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=flat-square&logo=stripe)](https://stripe.com/)
[![Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare%20Workers-F38020?style=flat-square&logo=cloudflare)](https://workers.cloudflare.com/)
[![LGPD](https://img.shields.io/badge/LGPD-Compliant-22C55E?style=flat-square&logo=shieldcheck)]()

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Banco de Dados](#-banco-de-dados)
- [Autenticação e Autorização](#-autenticação-e-autorização)
- [Sistema White Label](#-sistema-white-label)
- [Módulo de Pagamentos](#-módulo-de-pagamentos)
- [Gamificação](#-gamificação)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Instalação e Execução](#-instalação-e-execução)
- [Deploy](#-deploy)

---

## 🌟 Visão Geral

O **Solaris** é um **SaaS multi-tenant white label** voltado para clínicas dermatológicas. A premissa central é simples: cada clínica que assina a plataforma recebe um aplicativo totalmente personalizado com sua própria identidade visual (logo, paleta de cores, nome), sem nenhum esforço de desenvolvimento próprio.

O sistema é dividido em dois mundos distintos:

| Portal | Usuário | Finalidade |
|--------|---------|------------|
| `/admin/*` | Médico / Gestor | Gerenciar pacientes, publicar conteúdo, revisar fotos, customizar a marca |
| `/app/*` | Paciente | Consumir conteúdo, registrar evolução fotográfica, acompanhar tratamento |

A arquitetura é **multi-clínica desde o zero** — cada recurso no banco (posts, pacientes, fotos, feedbacks) é isolado por `clinic_id`, garantindo segregação total de dados entre clientes da plataforma.

---

## 🚀 Funcionalidades

### Para a Clínica (Admin)

#### 📊 Dashboard Central
Visão consolidada em tempo real de todos os indicadores da clínica: total de pacientes ativos, fotos enviadas na semana, posts publicados e fotos pendentes de revisão. Inclui link de convite gerado automaticamente com o código de acesso da clínica, pronto para ser compartilhado com pacientes.

#### 👥 Gestão de Pacientes
Listagem paginada dos pacientes vinculados à clínica. O prontuário individual (`/admin/patients/:id`) concentra todo o histórico do paciente: dados cadastrais, tratamento em curso, galeria de fotos por semana, análises de IA e o sistema de feedback clínico estruturado.

#### 📸 Revisão de Evolução Fotográfica
O médico acessa as fotos enviadas pelos pacientes semana a semana, visualiza a análise automática gerada por IA, aprova ou rejeita a exibição dessa análise para o paciente, e registra o `improvement_score` (0–100) que alimenta o sistema de gamificação.

#### 📝 Editor de Conteúdo
CMS completo para publicação de conteúdo educativo em quatro formatos:

- **Artigo** — texto rico via Tiptap com suporte a imagens embutidas
- **Vídeo** — com thumbnail personalizada e player integrado
- **Dica** — conteúdo curto e objetivo
- **Protocolo** — instruções clínicas estruturadas

O editor (`/admin/content/video-editor`) inclui gerenciamento de slug, categoria, tempo de leitura, imagem de capa e vinculação opcional a condições da Wiki.

#### 📚 Wiki Clínica
Base de conhecimento dermatológico da clínica. O médico cadastra condições (ex.: acne, rosácea, melasma) com descrição, causas, tratamentos e imagens. Os pacientes podem pesquisar e consultar esse conteúdo pelo app.

#### 🎨 Personalização White Label
Interface visual para configurar a identidade da clínica em tempo real: cor primária (com geração automática de variantes escura e clara), logo, banner e nome do médico. Inclui presets prontos (Teal Solaris, Rosé Clínico, Azul Royal, Esmeralda, Ametista, Âmbar Pro) e preview ao vivo antes de salvar.

#### 💳 Gestão de Assinatura
Painel de billing integrado ao Stripe para visualização do plano atual, status da assinatura e acesso ao portal do cliente para gerenciar cobranças.

---

### Para o Paciente (App)

#### 🏠 Feed de Conteúdo
Feed personalizado com o conteúdo publicado pela sua clínica, filtrado por tipo (artigos, vídeos, dicas, protocolos). Suporte a likes, bookmarks e visualizações — tudo persistido no banco. A identidade visual do feed reflete 100% a personalização configurada pelo médico.

#### 📷 Câmera / Envio de Foto Semanal
Fluxo guiado para o paciente registrar a foto semanal do tratamento. O sistema orienta sobre posicionamento (frontal, lateral esquerda, lateral direita), iluminação e ambiente antes do upload, garantindo consistência entre as fotos ao longo do tratamento.

#### 📈 Evolução e Acompanhamento
A tela mais rica do lado do paciente. Apresenta:
- Gráfico de área com evolução do `improvement_score` semana a semana (via Recharts)
- Galeria comparativa de fotos por semana e ângulo
- Comentários do médico e análise de IA (quando aprovada)
- Feedbacks clínicos com próximos passos e checklist de tarefas
- Sistema de gamificação com nível atual, pontuação e conquistas desbloqueadas

#### ☀️ Alertas UV
Integração com a API pública do **Open-Meteo** (sem necessidade de chave) para exibir o índice UV atual com base na geolocalização do paciente. O índice é classificado em cinco níveis (Baixo → Extremo) com cor, percentual de risco e recomendação clínica personalizada — relevante especialmente para pacientes em tratamento fotossensibilizante.

#### 📖 Wiki / Busca
Interface de busca na base de conhecimento da clínica. O paciente digita um termo e consulta condições, causas e tratamentos explicados pelo próprio médico.

#### 🏥 Perfil da Clínica
Página institucional com dados da clínica: nome, médico responsável, logo e banner — tudo vindo da configuração white label.

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Cliente (Browser)                       │
│         React 19 + TanStack Router + TanStack Query          │
└────────────────────────┬────────────────────────────────────┘
                         │ SSR / API Routes
┌────────────────────────▼────────────────────────────────────┐
│              TanStack Start (Server Functions)               │
│         Nitro · Cloudflare Workers · Vite 7                  │
└──────┬────────────────────────────┬───────────────────────┘
       │                            │
┌──────▼──────┐            ┌────────▼────────┐
│  Supabase   │            │     Stripe      │
│  Postgres   │            │  Subscriptions  │
│  Auth       │            │  Webhooks       │
│  Storage    │            └─────────────────┘
│  RLS        │
└─────────────┘
```

O projeto utiliza **TanStack Start** como framework full-stack. As rotas de API (ex.: webhook do Stripe em `/api/public/payments/webhook`) rodam como **server functions** no mesmo bundle, eliminando a necessidade de um backend separado. O deploy é feito diretamente no edge via **Cloudflare Workers**.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| **Framework** | TanStack Start | 1.16x |
| **UI** | React | 19 |
| **Roteamento** | TanStack Router (file-based) | 1.16x |
| **Estado Servidor** | TanStack Query | 5.x |
| **Estilização** | Tailwind CSS | 4.x |
| **Componentes** | shadcn/ui + Radix UI | — |
| **Animações** | Framer Motion | 12.x |
| **Gráficos** | Recharts | 2.x |
| **Editor de Texto** | Tiptap | 3.x |
| **Formulários** | React Hook Form + Zod | — |
| **Backend/DB** | Supabase (Postgres + Auth + Storage) | — |
| **Pagamentos** | Stripe (Embedded Checkout) | 22.x |
| **Runtime** | Cloudflare Workers (via Nitro) | — |
| **Build** | Vite | 7.x |
| **Package Manager** | Bun | — |
| **Linguagem** | TypeScript | 5.8 |

---

## 📁 Estrutura do Projeto

```
solaris/
├── src/
│   ├── routes/                    # File-based routing (TanStack Router)
│   │   ├── __root.tsx             # Layout raiz + providers globais
│   │   ├── index.tsx              # Landing page pública
│   │   ├── auth/
│   │   │   ├── login.tsx          # Login unificado (médico e paciente)
│   │   │   ├── register-doctor.tsx  # Cadastro de clínica
│   │   │   └── register-patient.tsx # Cadastro via código de convite
│   │   ├── onboarding.tsx         # Fluxo de onboarding pós-cadastro
│   │   ├── admin/                 # Portal do médico
│   │   │   ├── admin.tsx          # Layout + sidebar do admin
│   │   │   ├── dashboard.tsx      # Métricas e posts recentes
│   │   │   ├── patients.tsx       # Listagem de pacientes
│   │   │   ├── patients.$id.tsx   # Prontuário completo
│   │   │   ├── content/
│   │   │   │   ├── index.tsx      # Hub do módulo de conteúdo
│   │   │   │   ├── list.tsx       # Lista e gerenciamento de posts
│   │   │   │   ├── new.tsx        # Criação de novo post
│   │   │   │   └── video-editor.tsx # Editor completo (texto + vídeo)
│   │   │   ├── wiki.tsx           # Lista de condições da wiki
│   │   │   ├── wiki.new.tsx       # Cadastro de condição
│   │   │   ├── customize.tsx      # Personalização white label
│   │   │   ├── billing.tsx        # Gestão de assinatura Stripe
│   │   │   └── profile.tsx        # Perfil do médico
│   │   ├── app/                   # Portal do paciente
│   │   │   ├── app.tsx            # Layout + nav bottom do paciente
│   │   │   ├── home.tsx           # Feed de conteúdo
│   │   │   ├── evolution.tsx      # Evolução + gamificação
│   │   │   ├── camera.tsx         # Envio de foto semanal
│   │   │   ├── content.$slug.tsx  # Leitura de post individual
│   │   │   ├── content.feed.tsx   # Feed paginado
│   │   │   ├── wiki.$slug.tsx     # Detalhe de condição
│   │   │   ├── wiki.search.tsx    # Busca na wiki
│   │   │   └── clinic-profile.tsx # Perfil institucional da clínica
│   │   ├── checkout.return.tsx    # Retorno após checkout Stripe
│   │   └── api/
│   │       └── public/payments/
│   │           └── webhook.ts     # Webhook Stripe (server-side)
│   ├── components/
│   │   ├── clinic/
│   │   │   └── WhiteLabelProvider.tsx  # Context da identidade visual
│   │   ├── PaymentTestModeBanner.tsx   # Banner de modo de teste
│   │   ├── StripeEmbeddedCheckout.tsx  # Checkout embutido
│   │   └── ui/                    # Componentes shadcn/ui (40+ componentes)
│   ├── hooks/
│   │   ├── use-mobile.tsx         # Detecção de viewport mobile
│   │   └── use-subscription.ts    # Status da assinatura Stripe
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Cliente Supabase (browser)
│   │       ├── client.server.ts   # Cliente Supabase (server)
│   │       ├── auth-middleware.ts # Middleware de autenticação SSR
│   │       ├── auth-attacher.ts   # Attacher de sessão
│   │       └── types.ts           # Tipos gerados do schema Postgres
│   ├── lib/
│   │   ├── gamification.ts        # Engine de níveis, pontos e conquistas
│   │   ├── clinical.functions.ts  # Server functions clínicas
│   │   ├── stripe.ts              # Utilitários Stripe (client)
│   │   ├── stripe.server.ts       # Utilitários Stripe (server)
│   │   ├── storage-upload.ts      # Upload para Supabase Storage
│   │   ├── uv.ts                  # Integração Open-Meteo (UV + tempo)
│   │   ├── error-capture.ts       # Captura de erros
│   │   ├── error-page.ts          # Página de erro genérica
│   │   └── utils.ts               # Helpers (cn, etc.)
│   ├── utils/
│   │   └── payments.functions.ts  # Server functions de pagamento
│   ├── styles.css                 # CSS global + tokens Tailwind
│   ├── router.tsx                 # Configuração do router
│   ├── server.ts                  # Entry point servidor (Nitro/Cloudflare)
│   └── start.ts                   # Entry point SSR
├── supabase/
│   ├── config.toml                # Config do projeto Supabase
│   └── migrations/                # Histórico de migrações SQL
├── vite.config.ts                 # Config Vite + TanStack + Cloudflare
├── components.json                # Config shadcn/ui
├── tsconfig.json
└── wrangler.jsonc                 # Config Cloudflare Workers
```

---

## 🗄️ Banco de Dados

O schema é gerenciado via migrações SQL versionadas em `supabase/migrations/`. As principais entidades são:

```
clinics                  — Dados e configuração visual de cada clínica
  └── doctors            — Médico(s) vinculado(s) à clínica
  └── patients           — Pacientes cadastrados via código de convite
       └── treatments    — Tratamento em curso (semana atual)
       └── evolution_photos — Fotos semanais por ângulo
            └── feedbacks    — Feedback clínico estruturado do médico
  └── content_posts      — Conteúdo publicado (artigos, vídeos, dicas, protocolos)
       └── post_likes    — Likes dos pacientes
       └── post_bookmarks — Bookmarks dos pacientes
       └── post_views    — Contagem de visualizações
       └── post_comments — Comentários
  └── wiki_conditions    — Base de conhecimento da clínica
  └── subscriptions      — Assinatura Stripe vinculada à clínica
```

Todo acesso ao banco no lado do cliente é protegido por **Row Level Security (RLS)** do Postgres, garantindo que um paciente só acesse dados da sua clínica e que um médico só gerencie sua própria clínica.

---

## 🔐 Autenticação e Autorização

A autenticação é gerenciada pelo **Supabase Auth** com JWT. O fluxo SSR utiliza um middleware customizado (`auth-middleware.ts`) que:

1. Intercepta todas as requisições server-side
2. Valida e refresca o token de sessão
3. Injeta o cliente Supabase autenticado no contexto da requisição

O roteamento protege as áreas por papel:

- `/admin/*` — requer usuário com papel `doctor`
- `/app/*` — requer usuário com papel `patient`
- `/auth/*` — público (redireciona se já autenticado)

O cadastro de pacientes utiliza um **código de convite** (`SLR-XXXXXX`) gerado pela clínica, vinculando automaticamente o novo usuário à clínica correta.

---

## 🎨 Sistema White Label

O `WhiteLabelProvider` é o coração da personalização. Ao iniciar a sessão do paciente, o provider:

1. Busca o `clinic_id` do paciente no banco
2. Carrega as configurações de branding da clínica (cores, logo, nome)
3. Injeta as cores como **CSS Custom Properties** diretamente no `document.documentElement`

```typescript
// Resultado: o Tailwind lê essas variáveis em tempo de execução
document.documentElement.style.setProperty('--color-primary', brand.primary);
document.documentElement.style.setProperty('--color-primary-dark', brand.primaryDark);
document.documentElement.style.setProperty('--color-primary-light', brand.primaryLight);
```

Isso significa que **um único deploy** serve todas as clínicas com identidades visuais completamente distintas, sem CSS estático por tenant.

---

## 💳 Módulo de Pagamentos

A integração com o Stripe utiliza o **Embedded Checkout** — o formulário de pagamento é renderizado dentro do próprio app (sem redirect para o Stripe), mantendo a experiência white label.

O fluxo completo:

```
Clínica seleciona plano
  → Server function cria PaymentIntent / Session no Stripe
  → StripeEmbeddedCheckout renderiza o formulário in-app
  → Pagamento confirmado → redirect para /checkout/return
  → Webhook /api/public/payments/webhook atualiza status da subscription no banco
```

O webhook (`webhook.ts`) é executado como server function no edge, valida a assinatura do Stripe e processa os eventos `checkout.session.completed` e `customer.subscription.*`.

---

## 🎮 Gamificação

O módulo de gamificação (`src/lib/gamification.ts`) implementa um sistema de progressão para engajar pacientes durante o tratamento:

### Níveis de Evolução

| # | Nível | Score | Emoji |
|---|-------|-------|-------|
| 1 | Início | 0–19 | 🌱 |
| 2 | Melhora Leve | 20–39 | 🌿 |
| 3 | Melhora Moderada | 40–69 | 🌸 |
| 4 | Melhora Ótima | 70–89 | ✨ |
| 5 | Transformação | 90–100 | 🏆 |

### Pontuação por Feedback

Cada feedback do médico atribui pontos ao paciente com base no `progress_level`:

| Nível | Pontos |
|-------|--------|
| Sem melhora | 0 |
| Melhora Leve | +10 |
| Melhora Moderada | +20 |
| Melhora Ótima | +35 |
| Excelente | +50 |

### Conquistas (Achievements)

O sistema rastreia marcos do tratamento como primeira foto enviada, sequências de envio semanal (`streak_4`, `streak_8`), primeira melhora registrada e conclusão do tratamento, exibindo badges desbloqueadas na tela de evolução.

---

## ⚙️ Variáveis de Ambiente

Copie `.env` e preencha os valores:

```env
# Supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # Apenas server-side

# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_live_...             # ou pk_test_... para dev
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
VITE_APP_URL=https://seuapp.com
```

> **Segurança:** variáveis prefixadas com `VITE_` são expostas ao bundle do cliente. Nunca coloque `STRIPE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` com prefixo `VITE_`.

---

## 🚀 Instalação e Execução

### Pré-requisitos

- [Bun](https://bun.sh/) >= 1.x
- Projeto no [Supabase](https://supabase.com/) configurado
- Conta no [Stripe](https://stripe.com/) com webhook configurado

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/solaris.git
cd solaris

# 2. Instale as dependências
bun install

# 3. Configure as variáveis de ambiente
cp .env .env.local
# edite .env.local com suas credenciais

# 4. Aplique as migrações no Supabase
bunx supabase db push

# 5. Inicie o servidor de desenvolvimento
bun dev
```

O app estará disponível em `http://localhost:3000`.

### Modo de desenvolvimento

Em modo `dev`, o banner de teste do Stripe fica visível no topo da aplicação (componente `PaymentTestModeBanner`). Use os cartões de teste do Stripe (`4242 4242 4242 4242`) para simular pagamentos.

---

## 🌐 Deploy

O projeto está configurado para deploy no **Cloudflare Workers** via `wrangler.jsonc` e `vercel.json`.

### Cloudflare Workers

```bash
# Build para produção (Cloudflare edge runtime)
bun build

# Deploy
bunx wrangler deploy
```

A configuração `@cloudflare/vite-plugin` adapta o bundle de SSR para rodar no runtime V8 isolate do Cloudflare, sem Node.js. As server functions são executadas no edge, próximas ao usuário.

### Variáveis de ambiente em produção

Configure os secrets no painel do Cloudflare Workers ou via CLI:

```bash
bunx wrangler secret put STRIPE_SECRET_KEY
bunx wrangler secret put STRIPE_WEBHOOK_SECRET
bunx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

---

<div align="center">

Feito com ☀️ para dermatologistas e seus pacientes.

</div>

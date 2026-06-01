## Objetivo
1. Reconectar a paleta dinâmica da clínica (definida pelo médico em `WhiteLabelProvider` → `--clinic-primary` etc.) aos componentes do paciente que voltaram a usar azul/branco fixos.
2. Converter a landing page Solaris (`src/routes/index.tsx`) de tema escuro para Light Mode mantendo a paleta azul oficial.

Nenhuma lógica de navegação, banco ou handlers será tocada. Apenas estilos.

---

## 1. Reatribuir paleta dinâmica nas telas do paciente

A função existe e funciona: `WhiteLabelProvider` carrega a clínica do paciente em `src/routes/app.tsx` (via `loadByClinicId`) e injeta `--clinic-primary`, `--clinic-primary-dark`, `--clinic-primary-light`, `--clinic-primary-rgb` no `:root`. O `PatientHeader` já consome corretamente.

O problema: os cards/badges novos usam **hex fixo** `#1472D0` e `#E8F2FC` em vez das CSS vars. Trocar nestes arquivos:

### `src/components/patient/QuickActionsGrid.tsx`
- Ícone container: `background: "#E8F2FC"` → `var(--clinic-primary-light)`; `color: "#1472D0"` → `var(--clinic-primary)`.
- Label: `color: "#1472D0"` → `var(--clinic-primary)`.

### `src/components/patient/NextAppointmentCard.tsx`
- Avatar consulta + badge "Hoje/Amanhã": `#E8F2FC` → `var(--clinic-primary-light)`, `#1472D0` → `var(--clinic-primary)`.
- Variante empty: borda/background → tokens; texto `#0E5BAA` → `var(--clinic-primary-dark)`.

### `src/routes/app.home.tsx`
- `AnalysisRow` mantém cores semânticas de prioridade (alta/média/baixa) — não tocar.
- Demais labels já usam tokens (`--text-soft`, etc.).

### Suporte warm (médico escolheu marrom)
Onde aplicável, espelhar o padrão do `PatientHeader` (`useWhiteLabel().isWarm`) para QuickActions/NextAppointment usarem `--warm-beige-card` / `--warm-brown-mid` em vez de `--clinic-primary-light` / `--clinic-primary`. Mantém consistência quando paleta é quente.

### Verificação
Após edição, abrir `/app/home` com clínica configurada em cor diferente (ex.: roxo) e confirmar que header, cards de acesso rápido, badge de próxima consulta e ícones herdaram a cor.

---

## 2. Landing page Solaris em Light Mode

Arquivo único: `src/routes/index.tsx`. Trocar somente classes de cor (estrutura, animações, conteúdo e links intactos).

### Mudanças por seção
- **Wrapper root**: `bg-night text-white` → `bg-white text-foreground` (com `bg-slate-50` em seções alternadas para respiro).
- **Nav**: links `text-white/70 hover:text-white` → `text-slate-600 hover:text-slate-900`; botão "Criar minha clínica" mantém `bg-primary` (azul Solaris) — já tem contraste no claro. Adicionar `border-b border-slate-200` sutil.
- **Logo Solaris**: trocar o quadradinho "S" pelo arquivo `src/assets/solaris/screen-01-onboarding-splash/logo-solaris-white.svg` em variante escura/colorida — usar o mesmo SVG com `filter: invert` simples ou referenciar o SVG diretamente (ele é monocromático, então aplicar `text-primary`).
- **Hero**:
  - Remover `bg-solaris-hero` → fundo branco com gradient sutil radial em azul claro (`radial-gradient(ellipse at top right, rgba(20,114,208,0.10), transparent 60%)`).
  - Pill: `border-white/10 bg-white/5 text-white/80` → `border-slate-200 bg-white text-slate-700`.
  - H1: cor padrão (foreground); span gradient mantém `text-gradient-clinic`.
  - Parágrafo: `text-white/70` → `text-slate-600`.
  - Botão primário "Começar gratuitamente": já é `bg-primary`, manter; remover `shadow-glow` ou trocar por sombra azul mais leve.
  - Botão secundário "Sou paciente": `border-white/15 bg-white/5 text-white` → `border-slate-300 bg-white text-slate-900 hover:bg-slate-100`.
  - Trust row: `text-white/50` → `text-slate-500`.
- **Mock phone**:
  - Glow externo `bg-primary/20` mantém (fica suave no branco).
  - Moldura `border-night bg-night` → `border-slate-900 bg-slate-900` (ou `border-[10px] border-slate-800`) para o "celular" continuar com bezel escuro contrastando com o fundo claro.
  - Conteúdo interno do mock mantém gradiente azul (`from-primary/90 to-primary-dark`) — é a tela do app, deve permanecer colorida.
- **Seção Features**:
  - `border-white/5 bg-midnight` → `border-slate-200 bg-slate-50`.
  - Grid: `bg-white/5` → `bg-slate-200` (linhas divisórias); cada card `bg-night` → `bg-white`.
  - Títulos: cor padrão; descrição `text-white/60` → `text-slate-600`.
- **CTA final**:
  - `bg-night` → `bg-white`; texto padrão.
  - Subtítulo: `text-white/70` → `text-slate-600`.
- **Footer**: `border-white/5 text-white/40` → `border-slate-200 text-slate-500`.

### Verificação
- Carregar `/` no preview e validar contraste WCAG dos botões e textos.
- Confirmar que rotas/cliques (`/auth/login`, `/auth/register-doctor`, `/auth/register-patient`) continuam funcionando.

---

## Detalhes técnicos
- Nenhum token novo em `styles.css` — `--clinic-*` já existem e são atualizados pelo `WhiteLabelProvider.applyToDom`.
- Sem mudança no `routeTree.gen.ts`, rotas, server functions, schema ou auth.
- Edições restritas a 4 arquivos:
  - `src/components/patient/QuickActionsGrid.tsx`
  - `src/components/patient/NextAppointmentCard.tsx`
  - `src/routes/index.tsx`
  - (opcional, se necessário para consistência warm) pequeno ajuste em `src/routes/app.home.tsx` para o link "Para você" usar token em vez de classes fixas — verificar antes de tocar.

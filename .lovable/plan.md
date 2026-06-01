
# Redesign completo do app do paciente — Solaris

Vou implementar todas as 15 telas + infraestrutura num único batch. Aviso: é muita coisa, então alguns ajustes finos provavelmente vão precisar de iterações depois.

## 1. Base / Infra

- Adicionar Nunito ao `src/styles.css` (import Google Fonts)
- Estender `src/styles.css` com tokens novos: `--solaris-blue-*`, `--warm-*`, `--bg-page`, `--text-*`, `--prob-*`
- Estender `WhiteLabelProvider`: detectar tema warm via `brand_color_accent`, expor flag `isWarm`
- Criar migration: tabela `appointments` (patient_id, doctor_id, clinic_id, scheduled_at, status, notes) + RLS + índices

## 2. Componentes compartilhados (`src/components/patient/`)

- `PatientHeader.tsx` — header White Label com logo, nome, sino
- `BottomNav.tsx` — 5 itens com central elevado (HeartPulse)
- `FloatingChatButton.tsx`
- `UVWidget.tsx` — card com barra gradiente UV
- `QuickActionsGrid.tsx` — 2x2 atalhos
- `SymptomChip.tsx`, `SymptomResultCard.tsx`
- `DoctorCard.tsx`, `DoctorProfileHero.tsx`, `DateSelector.tsx`, `TimeSlotPicker.tsx`
- `ContentPostCard.tsx`, `AppointmentItem.tsx`
- `LesionCameraView.tsx` (getUserMedia + captura)
- `SupportChat.tsx`

## 3. Rotas substituídas/criadas em `src/routes/`

Reaproveitar layout `app.tsx` (substituir BottomNav antigo pelo novo). Criar/substituir:

- `app.splash.tsx`
- `app.onboarding.tsx` (3 slides com swipe + dots)
- `auth.welcome.tsx` (já existe login/register; criar welcome novo)
- `auth.clinic-code.tsx`
- `auth.register-patient.tsx` (redesign)
- `auth.login.tsx` (redesign)
- `app.home.tsx` (redesign completo: UV + QuickActions + banner)
- `app.schedule.tsx` (lista de médicos)
- `app.schedule.$doctorId.tsx` (perfil + agendar)
- `app.content.tsx` (feed novo com tabs Cuidados/Novidades/Skincare)
- `app.uv.tsx`
- `app.symptom-checker.tsx`
- `app.symptom-results.tsx`
- `app.lesion-camera.tsx`
- `app.lesion-results.tsx`
- `app.condition.$slug.tsx`
- `app.history.tsx`
- `app.profile.tsx`
- `app.support.tsx`

## 4. Hooks / queries

`src/hooks/patient/` com: `useUVIndex`, `useDoctors`, `useBookAppointment`, `useAppointments`, `useContentFeed` (todos via supabase client + React Query)

## 5. Lógica especial

- **Symptom matching**: algoritmo local que conta sintomas selecionados vs campos `symptoms/causes/description` de `wiki_conditions`, gera score 0-100, top 3
- **Câmera**: getUserMedia → canvas → blob → upload no bucket `evolution-photos` → insert em `evolution_photos`
- **UV**: usar tabela/edge function existente (`fetch-uv-index` se houver) ou mock se não
- **Support chat**: usar Lovable AI Gateway (google/gemini-2.5-flash) via server function

## Considerações importantes

- **NÃO vou mexer no `/admin/*`** — só `/app/*` e `/auth/*` do paciente
- **WhiteLabel**: usar `var(--clinic-primary)` em tudo, zero hex hardcoded nas telas
- **Voice command da câmera** (Web Speech): feature simples, com fallback
- **Edge function `fetch-uv-index`**: se não existir, faço fetch direto de api.openweathermap (precisaria de API key) ou uso mock com geolocation. Vou começar com mock determinístico e marcar TODO.
- **OAuth Google/Facebook nos slides**: vou deixar os botões visuais mas só Google funcional (broker do Lovable); Facebook é fora do escopo padrão.
- **CPF validation**: algoritmo dos dígitos verificadores
- **Tabela appointments**: criada via migration (aprovação necessária)

## O que pode quebrar

Por ser muito código de uma vez:
- Tipos do Supabase só atualizam após a migration ser aprovada — `appointments` vai dar erro de tipo até lá
- Pequenos detalhes visuais provavelmente vão precisar de ajuste depois
- Câmera só funciona em HTTPS (preview Lovable é ok)
- Performance: 15 rotas novas = bundle maior

Confirma que posso seguir? Vou começar pela migration da tabela `appointments` (precisa da sua aprovação), depois faço base/tokens, componentes, e por fim as 15 rotas.

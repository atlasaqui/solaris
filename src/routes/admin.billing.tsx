import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Check, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/use-subscription";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { createPortalSession } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/billing")({
  head: () => ({ meta: [{ title: "Faturamento — Solaris" }] }),
  component: AdminBilling,
});

interface Plan {
  id: string;
  priceId: string;
  name: string;
  price: string;
  patients: string;
  features: string[];
  accent: boolean;
}

const PLANS: Plan[] = [
  {
    id: "starter",
    priceId: "starter_monthly",
    name: "Starter",
    price: "R$ 97",
    patients: "Até 30 pacientes",
    features: ["Perfil da clínica", "Biblioteca de conteúdo", "Wiki-Clínica", "Câmera de evolução", "Suporte por e-mail"],
    accent: false,
  },
  {
    id: "pro",
    priceId: "pro_monthly",
    name: "Pro",
    price: "R$ 197",
    patients: "Até 100 pacientes",
    features: ["Tudo do Starter", "White Label completo", "Notificações push", "Alertas UV personalizados", "Analytics básico"],
    accent: true,
  },
  {
    id: "premium",
    priceId: "premium_monthly",
    name: "Premium",
    price: "R$ 397",
    patients: "Pacientes ilimitados",
    features: ["Tudo do Pro", "Multi-médico", "Analytics avançado", "API & integrações", "Suporte prioritário"],
    accent: false,
  },
];

function AdminBilling() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>();
  const [checkoutPrice, setCheckoutPrice] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const { subscription, isActive, loading } = useSubscription(userId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
      setUserEmail(data.user?.email);
    });
  }, []);

  const openPortal = async () => {
    setOpening(true);
    try {
      const url = await createPortalSession({
        data: { environment: getStripeEnvironment(), returnUrl: window.location.href },
      });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao abrir portal");
    }
    setOpening(false);
  };

  if (checkoutPrice) {
    return (
      <div className="mx-auto max-w-3xl">
        <PaymentTestModeBanner />
        <div className="mt-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-semibold">Finalizar assinatura</h1>
          <button onClick={() => setCheckoutPrice(null)} className="text-sm text-muted-foreground hover:text-foreground">
            ← Voltar aos planos
          </button>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
          <StripeEmbeddedCheckout
            priceId={checkoutPrice}
            userId={userId ?? undefined}
            customerEmail={userEmail}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PaymentTestModeBanner />

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary-light text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Faturamento</h1>
            <p className="text-sm text-muted-foreground">Gerencie sua assinatura do Solaris</p>
          </div>
        </div>
        {isActive && (
          <button onClick={openPortal} disabled={opening} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-60">
            {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Gerenciar assinatura
          </button>
        )}
      </header>

      {/* Current subscription banner */}
      {loading ? (
        <div className="grid h-24 place-items-center rounded-2xl border border-border bg-card"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : isActive && subscription ? (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary-light/40 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-5 w-5" /></div>
            <div>
              <div className="font-display text-base font-semibold">
                Plano {PLANS.find((p) => p.priceId === subscription.price_id)?.name ?? subscription.price_id} ativo
              </div>
              <div className="text-xs text-muted-foreground">
                Status: {subscription.status}
                {subscription.current_period_end && ` · Renova em ${new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}`}
                {subscription.cancel_at_period_end && " · Cancelamento agendado"}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
          Você ainda não tem uma assinatura ativa. Escolha um plano abaixo para começar.
        </div>
      )}

      {/* Plans grid */}
      <div className="grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => {
          const current = subscription?.price_id === p.priceId && isActive;
          return (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition ${
                p.accent ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {p.accent && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                  <Sparkles className="h-3 w-3" /> Mais popular
                </span>
              )}
              <div>
                <h3 className="font-display text-xl font-semibold">{p.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.patients}</p>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold tracking-tight">{p.price}</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setCheckoutPrice(p.priceId)}
                disabled={current || !userId}
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                  p.accent
                    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                    : "border border-border bg-background hover:bg-secondary"
                }`}
              >
                {current ? "Plano atual" : isActive ? "Mudar para este plano" : "Assinar agora"}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Impostos calculados automaticamente no checkout. Cancele quando quiser pelo portal de gerenciamento.
      </p>
    </div>
  );
}

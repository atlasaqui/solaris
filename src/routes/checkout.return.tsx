import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/return")({
  head: () => ({ meta: [{ title: "Pagamento concluído" }] }),
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof s.session_id === "string" ? s.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="grid min-h-screen place-items-center bg-secondary p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-card">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-primary text-2xl text-primary-foreground">✓</div>
        <h1 className="font-display text-2xl font-semibold">Pagamento confirmado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session_id ? "Sua assinatura foi ativada. Bem-vindo ao Solaris!" : "Estamos processando seu pagamento."}
        </p>
        <Link to="/admin/billing" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
          Ir para faturamento
        </Link>
      </div>
    </div>
  );
}

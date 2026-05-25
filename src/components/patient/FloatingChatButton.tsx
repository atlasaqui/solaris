import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export function FloatingChatButton() {
  return (
    <Link to="/app/support" aria-label="Suporte" className="fixed z-30 grid h-[52px] w-[52px] place-items-center rounded-full text-white transition active:scale-95"
      style={{
        background: "var(--clinic-primary)",
        boxShadow: "0 4px 16px rgba(var(--clinic-primary-rgb), 0.4)",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
        right: 20,
      }}>
      <MessageCircle className="h-6 w-6" />
    </Link>
  );
}

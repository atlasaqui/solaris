import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { PatientHeader } from "@/components/patient/PatientHeader";

export const Route = createFileRoute("/app/support")({
  head: () => ({ meta: [{ title: "Suporte Solaris" }] }),
  component: Page,
});

type Msg = { role: "bot" | "user"; text: string };

const FAQS: Record<string, string> = {
  uv: "O índice UV mede a intensidade da radiação ultravioleta. Use protetor solar FPS 30+ a partir do nível 3.",
  lesao: "Para analisar uma lesão, use o botão central da barra inferior. Capture a foto bem iluminada e centralizada.",
  consulta: "Para agendar uma consulta, vá em Início → Agendar consulta e escolha um médico disponível.",
  cadastro: "Seus dados ficam armazenados com segurança e só são acessíveis pelo(a) médico(a) da sua clínica.",
};

function botReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("uv") || t.includes("sol")) return FAQS.uv;
  if (t.includes("lesão") || t.includes("lesao") || t.includes("foto") || t.includes("pinta")) return FAQS.lesao;
  if (t.includes("consulta") || t.includes("agendar")) return FAQS.consulta;
  if (t.includes("dados") || t.includes("cadastro") || t.includes("conta")) return FAQS.cadastro;
  return "Posso ajudar com dúvidas sobre UV, análise de lesões, consultas ou cadastro. O que você gostaria de saber?";
}

function Page() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: "Olá! Sou o suporte Solaris. Como posso te ajudar hoje?" }]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t) return;
    const next: Msg[] = [...msgs, { role: "user", text: t }];
    setMsgs(next);
    setInput("");
    setTimeout(() => setMsgs((cur) => [...cur, { role: "bot", text: botReply(t) }]), 400);
  };

  return (
    <>
      <PatientHeader title="Solaris Support" showBack />
      <div className="flex h-[calc(100vh-180px)] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto bg-white p-4">
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[75%] ${m.role === "user" ? "ml-auto" : ""}`}>
              <div className="px-4 py-3 text-[14px] text-white" style={{
                background: m.role === "user" ? "var(--clinic-primary)" : "var(--clinic-primary-dark)",
                borderRadius: m.role === "user" ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
              }}>{m.text}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex gap-2 border-t bg-white p-3">
          {["UV", "Lesão", "Consulta"].map((q) => (
            <button key={q} onClick={() => send(q)} className="rounded-full border-[1.5px] px-3 py-1 text-[12px] font-semibold" style={{ borderColor: "var(--clinic-primary)", color: "var(--clinic-primary)" }}>{q}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t bg-white p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Digite sua dúvida..." className="flex-1 rounded-full border px-4 py-2.5 text-[14px] outline-none focus:border-[var(--clinic-primary)]" />
          <button onClick={() => send()} aria-label="Enviar" className="grid h-10 w-10 place-items-center rounded-full text-white" style={{ background: "var(--clinic-primary)" }}>
            <ArrowUp className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}

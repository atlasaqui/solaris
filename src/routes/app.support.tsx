import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { PatientHeader } from "@/components/patient/PatientHeader";
import avatarAgent from "@/assets/solaris/screen-08-support-chat/avatar-support-agent.png";
import backBtn from "@/assets/solaris/screen-08-support-chat/btn-icon-back.png";
import faqChip from "@/assets/solaris/screen-08-support-chat/btn-quick-reply-faq.png";
import tutorialChip from "@/assets/solaris/screen-08-support-chat/btn-quick-reply-tutorial.png";
import contactChip from "@/assets/solaris/screen-08-support-chat/btn-quick-reply-contact.png";
import sendBtn from "@/assets/solaris/screen-08-support-chat/btn-send-message.png";
import bubbleBot from "@/assets/solaris/screen-08-support-chat/bubble-bot.png";
import bubbleUser from "@/assets/solaris/screen-08-support-chat/bubble-user.png";
import inputBg from "@/assets/solaris/screen-08-support-chat/input-chat-message.png";

export const Route = createFileRoute("/app/support")({
  head: () => ({ meta: [{ title: "Suporte Solaris" }] }),
  component: Page,
});

type Msg = { role: "bot" | "user"; text: string };

const FAQS: Record<string, string> = {
  uv: "O índice UV mede a intensidade da radiação ultravioleta. Use protetor solar FPS 30+ a partir do nível 3.",
  lesao: "Para analisar uma lesão, use o botão central da barra inferior. Capture a foto bem iluminada e centralizada.",
  consulta: "Para agendar uma consulta, vá em Início → Agendar consulta e escolha um médico disponível.",
  contato: "Você pode falar com a clínica pela tela Clínica ou pelo telefone listado no perfil dela.",
};

function botReply(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("uv") || t.includes("sol")) return FAQS.uv;
  if (t.includes("lesão") || t.includes("lesao") || t.includes("foto") || t.includes("pinta")) return FAQS.lesao;
  if (t.includes("consulta") || t.includes("agendar") || t.includes("tutorial")) return FAQS.consulta;
  if (t.includes("contato") || t.includes("clínica") || t.includes("clinica")) return FAQS.contato;
  return "Posso ajudar com FAQ, tutoriais ou contato com a clínica. O que você gostaria de saber?";
}

function Page() {
  const nav = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: "Olá! Sou o suporte Solaris. Como posso te ajudar hoje?" }]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = (text?: string) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setMsgs((cur) => [...cur, { role: "user", text: t }]);
    setInput("");
    setTimeout(() => setMsgs((cur) => [...cur, { role: "bot", text: botReply(t) }]), 400);
  };

  return (
    <>
      <PatientHeader title="Solaris Support" showBack />
      <div className="flex h-[calc(100vh-220px)] flex-col">
        <div className="flex items-center gap-3 border-b bg-white px-4 py-3">
          <button onClick={() => nav({ to: "/app/home" })} className="active:scale-95" aria-label="Voltar">
            <img src={backBtn} alt="" className="h-8 w-8" />
          </button>
          <img src={avatarAgent} alt="" className="h-10 w-10 rounded-full" />
          <div>
            <div className="text-[14px] font-bold text-[var(--text-dark)]">Agente Solaris</div>
            <div className="text-[11px] text-[var(--text-soft)]">Online</div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--bg-page)] p-4">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className="relative max-w-[78%]">
                <img
                  src={m.role === "user" ? bubbleUser : bubbleBot}
                  alt=""
                  className="pointer-events-none block w-full"
                  draggable={false}
                />
                <div
                  className="absolute inset-0 flex items-center px-5 text-[14px] text-white"
                  style={{ paddingTop: 12, paddingBottom: 14 }}
                >
                  <span>{m.text}</span>
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="flex gap-2 border-t bg-white px-3 py-2">
          {[
            { img: faqChip, q: "FAQ" },
            { img: tutorialChip, q: "Tutorial de agendamento" },
            { img: contactChip, q: "Contato com a clínica" },
          ].map((c) => (
            <button key={c.q} onClick={() => send(c.q)} className="active:scale-95" aria-label={c.q}>
              <img src={c.img} alt={c.q} className="h-10" draggable={false} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t bg-white px-3 py-3">
          <div className="relative flex-1">
            <img src={inputBg} alt="" className="pointer-events-none w-full" draggable={false} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Digite sua mensagem..."
              className="absolute inset-0 m-auto h-[80%] w-[92%] bg-transparent px-3 text-[14px] outline-none"
            />
          </div>
          <button onClick={() => send()} aria-label="Enviar" className="active:scale-95">
            <img src={sendBtn} alt="" className="h-12 w-12" draggable={false} />
          </button>
        </div>
      </div>
    </>
  );
}

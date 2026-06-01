import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ClinicCodeInput } from "@/components/patient/ClinicCodeInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/clinic-code")({
  head: () => ({ meta: [{ title: "Código da clínica — Solaris" }] }),
  component: Page,
});

function Page() {
  const navigate = useNavigate();

  const onValid = async (clinicId: string) => {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase
          .from("patients")
          .update({ clinic_id: clinicId })
          .eq("user_id", u.user.id);
      }
      navigate({ to: "/app/home" });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao vincular clínica");
    }
  };

  return (
    <div className="patient-app flex h-screen flex-col items-center overflow-hidden bg-white px-8 pt-10">
      <div className="flex flex-1 w-full items-center justify-center min-h-0">
        <ClinicCodeInput onValid={onValid} />
      </div>
    </div>
  );
}

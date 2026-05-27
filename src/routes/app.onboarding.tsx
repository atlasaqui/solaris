import { createFileRoute } from "@tanstack/react-router";
import { OnboardingCarousel } from "@/components/patient/OnboardingCarousel";

export const Route = createFileRoute("/app/onboarding")({
  head: () => ({ meta: [{ title: "Bem-vindo — Solaris" }] }),
  component: OnboardingCarousel,
});

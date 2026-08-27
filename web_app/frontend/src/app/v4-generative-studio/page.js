import { GenerativeStudioWorkspace } from "@/components/v4_generative_studio/GenerativeStudioWorkspace";

export const metadata = {
  title: "SAM 3 AI Generative Studio V4.0 (CPU Diffusion Inpainting)",
  description: "CPU-Optimized Generative Latent Diffusion Inpainting & Architectural Room Restyling powered by Meta SAM 3 and DPM++ Karras.",
};

export default function V4GenerativeStudioPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <GenerativeStudioWorkspace />
    </main>
  );
}

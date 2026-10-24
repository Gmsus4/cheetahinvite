import { BrandEmblem } from "@/components/BrandEmblem";

export default function CreateEventLoading() {
  return (
    <main className="dashboard-loading" aria-label="Preparando formulario">
      <BrandEmblem size={43} className="dashboard-loading-mark" />
      <p>Preparando tu invitación…</p>
    </main>
  );
}

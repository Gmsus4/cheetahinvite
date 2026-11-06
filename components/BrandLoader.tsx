import { BrandEmblem } from "@/components/BrandEmblem";

export function BrandLoader({ message = "Preparando tu espacio para celebrar…", className = "", showMessage = true }: {
  message?: string;
  className?: string;
  showMessage?: boolean;
}) {
  return <div className={`dashboard-loading dashboard-loading-animated ${className}`} role="status" aria-label={message}>
    <div className="dashboard-loading-orbit" aria-hidden="true">
      <BrandEmblem size={100} className="dashboard-loading-mark" priority />
    </div>
    {showMessage && <p>{message}</p>}
  </div>;
}

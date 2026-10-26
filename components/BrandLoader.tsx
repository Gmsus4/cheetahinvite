import { BrandEmblem } from "@/components/BrandEmblem";

export function BrandLoader({ message = "Preparando tu espacio para celebrar…", className = "" }: {
  message?: string;
  className?: string;
}) {
  return <div className={`dashboard-loading dashboard-loading-animated ${className}`} role="status" aria-label={message}>
    <div className="dashboard-loading-orbit" aria-hidden="true">
      <BrandEmblem size={100} className="dashboard-loading-mark" priority />
    </div>
    <p>{message}</p>
  </div>;
}

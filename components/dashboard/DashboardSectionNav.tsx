import Link from "next/link";
import { FiCalendar, FiFileText, FiGift } from "react-icons/fi";

export function DashboardSectionNav({ eventCount, activeView }: { eventCount: number; activeView: "summary" | "events" }) {
  return <nav className="dashboard-nav" aria-label="Panel de usuario">
    <Link className={`dashboard-nav-item${activeView === "summary" ? " active" : ""}`} href="/dashboard" aria-current={activeView === "summary" ? "page" : undefined}>
      <FiFileText aria-hidden="true" /> Resumen
    </Link>
    <Link className={`dashboard-nav-item${activeView === "events" ? " active" : ""}`} href="/dashboard/eventos" aria-current={activeView === "events" ? "page" : undefined}>
      <FiCalendar aria-hidden="true" /> Mis eventos
      <span className="dashboard-nav-count">{eventCount}</span>
    </Link>
    <Link className="dashboard-nav-item" href="/#plantillas">
      <FiGift aria-hidden="true" /> Plantillas
    </Link>
  </nav>;
}

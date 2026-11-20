import type { ReactNode } from "react";
import styles from "./dashboard-shell.module.css";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}

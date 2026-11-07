import type { ReactNode } from "react";
import styles from "./creation-colors.module.css";

export default function CreateLayout({ children }: { children: ReactNode }) {
  return <div className={styles.scope}>{children}</div>;
}

import { BrandEmblem } from "@/components/BrandEmblem";
import styles from "./BrandWordmark.module.css";

export function BrandWordmark({ priority = false, compact = false }: { priority?: boolean; compact?: boolean }) {
  return <span className={`${styles.wordmark}${compact ? ` ${styles.compact}` : ""}`}>
    <BrandEmblem size={compact ? 32 : 40} priority={priority} />
    <span className={styles.name}>Soccasion</span>
  </span>;
}

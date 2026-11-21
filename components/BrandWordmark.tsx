import Image from "next/image";
import styles from "./BrandWordmark.module.css";

export function BrandWordmark({ priority = false, compact = false, tone = "auto" }: {
  priority?: boolean;
  compact?: boolean;
  tone?: "auto" | "white";
}) {
  return <span className={`${styles.wordmark} ${styles[tone]}${compact ? ` ${styles.compact}` : ""}`} role="img" aria-label="Soccasion">
    <Image className={`${styles.image} ${styles.blackImage}`} src="/logo-letra-black.png" alt="" width={5540} height={1202} sizes={compact ? "180px" : "154px"} loading={priority ? "eager" : "lazy"} />
    <Image className={`${styles.image} ${styles.whiteImage}`} src="/logo-letra-white.png" alt="" width={5540} height={1202} sizes={compact ? "180px" : "154px"} loading={priority ? "eager" : "lazy"} />
  </span>;
}

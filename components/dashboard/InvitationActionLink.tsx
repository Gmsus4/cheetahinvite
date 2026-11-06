import Link from "next/link";
import type { ReactNode } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import styles from "./InvitationActionLink.module.css";

export function InvitationActionLink({ href, title, description, icon, tone = "peach" }: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  tone?: "peach" | "lavender";
}) {
  return <Link className={`${styles.card} ${styles[tone]}`} href={href}>
    <span className={styles.icon} aria-hidden="true">{icon}</span>
    <div className={styles.copy}><h2>{title}</h2><p>{description}</p></div>
    <span className={styles.arrow} aria-hidden="true"><FiArrowUpRight /></span>
  </Link>;
}

"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import styles from "./ExampleStyleAction.module.css";

const subscribe = () => () => {};
const isStandalone = () => window.self === window.top;
const serverSnapshot = () => false;

export function ExampleStyleAction({ styleSlug, priceLabel }: { styleSlug: string; priceLabel: string }) {
  const standalone = useSyncExternalStore(subscribe, isStandalone, serverSnapshot);
  if (!standalone) return null;
  return <>
    <div className={styles.spacer} aria-hidden="true" />
    <aside className={styles.bar} aria-label="Opciones de la demostración">
      <div className={styles.demoOptions}>
        <span className={styles.demoLabel}>Demo</span>
        <Link className={styles.explore} href="/demo">Ver diseños <FiArrowUpRight aria-hidden="true" /></Link>
      </div>
      <Link className={styles.link} href={`/ejemplo-invitacion/${encodeURIComponent(styleSlug)}/utilizar`}>
        <span>Utilizar este estilo para mi invitación<small className={styles.price}>Desde {priceLabel}</small></span> <FiArrowUpRight aria-hidden="true" />
      </Link>
    </aside>
  </>;
}

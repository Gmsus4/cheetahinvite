"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import styles from "./ExampleStyleAction.module.css";

const subscribe = () => () => {};
const isStandalone = () => window.self === window.top;
const serverSnapshot = () => false;

export function ExampleStyleAction({ styleSlug }: { styleSlug: string }) {
  const standalone = useSyncExternalStore(subscribe, isStandalone, serverSnapshot);
  if (!standalone) return null;
  return <>
    <div className={styles.spacer} aria-hidden="true" />
    <aside className={styles.bar} aria-label="Usar este diseño">
      <Link className={styles.link} href={`/ejemplo-invitacion/${encodeURIComponent(styleSlug)}/utilizar`}>
        Utilizar este estilo para mi invitación <FiArrowUpRight aria-hidden="true" />
      </Link>
    </aside>
  </>;
}

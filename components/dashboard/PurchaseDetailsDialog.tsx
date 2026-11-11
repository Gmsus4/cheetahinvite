"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { FiArrowRight, FiX } from "react-icons/fi";
import styles from "@/app/dashboard/compras/purchases.module.css";

export function PurchaseDetailsDialog({ name, receipt, support, actions }: {
  name: string; receipt: ReactNode; support: ReactNode; actions: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [view, setView] = useState<"receipt" | "support">("receipt");
  return <>
    <button type="button" className={styles.detailButton} aria-haspopup="dialog" aria-label={`Ver detalle de la compra: ${name}`} onClick={() => { setView("receipt"); dialog.current?.showModal(); }}>Ver detalle <FiArrowRight aria-hidden="true" /></button>
    <dialog ref={dialog} className={styles.purchaseDialog} aria-labelledby={titleId}>
      <header className={styles.dialogHeader}>
        <div><span className={styles.eyebrow}>TU COMPRA</span><h2 id={titleId}>{name}</h2></div>
        <button type="button" className={styles.closeButton} aria-label="Cerrar detalle de compra" autoFocus onClick={() => dialog.current?.close()}><FiX aria-hidden="true" /></button>
      </header>
      <div className={styles.dialogSwitch} role="group" aria-label="Información de la compra">
        <button type="button" aria-pressed={view === "receipt"} onClick={() => setView("receipt")}>Detalle del pago</button>
        <button type="button" aria-pressed={view === "support"} onClick={() => setView("support")}>Necesito ayuda</button>
      </div>
      <div className={styles.dialogContent}>
        <section hidden={view !== "receipt"} aria-label="Detalle del pago">{receipt}<div className={styles.actions}>{actions}</div></section>
        <section hidden={view !== "support"} aria-label="Ayuda con esta compra">{support}</section>
      </div>
    </dialog>
  </>;
}

import type { CSSProperties } from "react";
import { getInvitationFont } from "@/lib/invitation-fonts";
import { weddingArtwork, type WeddingDesign } from "@/lib/wedding-designs";
import styles from "@/components/dashboard/WeddingDesignPicker.module.css";

/** Shared miniature cover for the editor and the public catalog. */
export function WeddingDesignPreview({ design }: { design: WeddingDesign }) {
  const palette = design.palettes[0];
  const art = weddingArtwork(design);
  const style = {
    "--paper": palette.paper, "--panel": palette.panel, "--ink": palette.ink,
    "--accent": palette.accent, "--dark": palette.dark,
    "--heading": getInvitationFont(design.typography).family,
    "--art-top": art.topLeft ? `url("${art.topLeft}")` : "none",
    "--art-bottom": art.bottomRight ? `url("${art.bottomRight}")` : "none",
    "--flower": art.flower ? `url("${art.flower}")` : "none",
  } as CSSProperties;

  return <span className={styles.scene} style={style} data-design={design.kind} aria-hidden="true">
    <span className={styles.paper} /><span className={styles.artTop} /><span className={styles.artBottom} />
    <span className={styles.motif} /><span className={styles.kicker}>NOS ELEGIMOS PARA SIEMPRE</span>
    <span className={styles.names}>Sofía <i>y</i> Mateo</span><span className={styles.rule} /><span className={styles.date}>12 · OCTUBRE · 2027</span>
  </span>;
}

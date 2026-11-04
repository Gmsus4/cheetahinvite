import { weddingArtwork, type WeddingDesign } from "@/lib/wedding-designs";
import { atmosphereStyle } from "@/lib/wedding-atmosphere";
import styles from "./WeddingAtmospherePreview.module.css";

/** Shared miniature cover for the editor and the public catalog. */
export function WeddingDesignPreview({ design }: { design: WeddingDesign }) {
  const palette = design.palettes[0];
  const art = weddingArtwork(design);
  return <span className={styles.scene} style={atmosphereStyle(design, palette.accent)} data-design={design.kind} aria-hidden="true">
    <span className={styles.glass}><span className={styles.kicker}>NUESTRA BODA</span>
      <span className={styles.names}>Sofía <i>&amp;</i> Mateo</span>
      <span className={styles.date}>12 · OCTUBRE · 2027</span><span className={styles.photo} />
    </span>
    {art.flower && <span className={styles.motif} style={{ backgroundImage: `url("${art.flower}")` }} />}
  </span>;
}

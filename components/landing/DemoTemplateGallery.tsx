"use client";

import Link from "next/link";
import Image from "next/image";
import { useId, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { HeroInvitationPhone } from "./HeroInvitationPhone";
import styles from "@/app/demo/demo.module.css";

type DemoTemplateOption = { slug: string; label: string; typeLabel: string; previewImage: string | null; fallbackImage: string };

export function DemoTemplateGallery({ examples }: { examples: DemoTemplateOption[] }) {
  const filterId = useId();
  const [category, setCategory] = useState("");
  const categories = Array.from(new Set(examples.map(example => example.typeLabel)));
  const visible = category ? examples.filter(example => example.typeLabel === category) : examples;

  if (!examples.length) return <p className={styles.empty}>Pronto encontrarás nuevos diseños para tu celebración.</p>;

  return <section aria-label="Plantillas de demostración">
    {categories.length > 1 && <div className={styles.filter}>
      <label htmlFor={filterId}>Tipo de evento</label>
      <select id={filterId} value={category} onChange={event => setCategory(event.target.value)}>
        <option value="">Todos los eventos</option>
        {categories.map(label => <option key={label} value={label}>{label}</option>)}
      </select>
    </div>}
    <div className={styles.gallery}>
      {visible.map(example => <Link key={example.slug} className={styles.card} href={`/ejemplo-invitacion/${encodeURIComponent(example.slug)}`} prefetch={false}>
        <div className={styles.preview} aria-hidden="true"><HeroInvitationPhone id={`demo-phone-${example.slug}`} preload={false}>
          {example.previewImage || example.fallbackImage ? <Image className={styles.snapshot} src={example.previewImage || example.fallbackImage} alt="" fill sizes="280px" loading="lazy" unoptimized /> : <div className={styles.noSnapshot}>{example.label}</div>}
          {!example.previewImage && <div className={styles.fallbackCaption}>{example.typeLabel}<strong>{example.label}</strong></div>}
        </HeroInvitationPhone></div>
        <div className={styles.caption}><span><small>{example.typeLabel}</small><strong>{example.label}</strong><span className={styles.cardAction}>Ver demo</span></span><FiArrowRight aria-hidden="true" /></div>
      </Link>)}
    </div>
  </section>;
}


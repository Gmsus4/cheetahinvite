"use client";

import type { ReactNode } from 'react';
import { FiCheck, FiArrowUpRight } from 'react-icons/fi';
import styles from './WeddingDesignPicker.module.css';

export type InvitationDesignOption = { id: string; label: string; preview: ReactNode; href?: string };

/** One card layout and responsive grid for every occasion. */
export function InvitationDesignGrid({ legend, description, notice, options, value, onChange }: {
  legend: string; description: string; notice?: ReactNode; options: InvitationDesignOption[];
  value: string; onChange(id: string): void;
}) {
  return <fieldset className={styles.picker}>
    <legend>{legend}</legend><p>{description}</p>{notice}
    <div className={styles.grid}>{options.map(option => {
      const selected = value === option.id;
      return <div className={styles.option} key={option.id}>
        <label className={`${styles.card}${selected ? ` ${styles.selected}` : ''}`}>
          <input type="radio" name="invitation-design" value={option.id} aria-label={option.label} checked={selected} onChange={() => onChange(option.id)} />
          {option.preview}
          <span className={styles.caption}><strong>{option.label}</strong><span className={styles.check} aria-hidden="true">{selected && <FiCheck />}</span></span>
        </label>
        {option.href && <a className={styles.explore} href={option.href} target="_blank" rel="noopener noreferrer" aria-label={`Ver invitación completa: ${option.label}`}>Ver invitación <FiArrowUpRight aria-hidden="true" /></a>}
      </div>;
    })}</div>
  </fieldset>;
}

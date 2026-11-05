"use client";

import type { IconType } from "react-icons";
import { LuArrowUpRight, LuBaby, LuCake, LuCheck, LuGraduationCap, LuHeart, LuInfinity, LuPartyPopper, LuSparkles } from "react-icons/lu";
import { invitationEventTypes, getInvitationEventContent, type InvitationEventType } from "@/lib/invitation-event-content";
import { DashboardHeader } from "./DashboardHeader";
import { CreationDraftResume } from "./CreationDraftResume";
import styles from "./EventTypePicker.module.css";

const occasions = {
  wedding: { icon: LuHeart, description: "El comienzo de una vida juntos." },
  birthday: { icon: LuCake, description: "Un año más. Muchos motivos para celebrar." },
  graduation: { icon: LuGraduationCap, description: "Un gran logro merece compartirse." },
  baby_shower: { icon: LuBaby, description: "Una pequeña llegada, una alegría enorme." },
  anniversary: { icon: LuInfinity, description: "Por todo lo vivido y lo que viene." },
  other: { icon: LuPartyPopper, description: "Ese momento especial que tienes en mente." },
} satisfies Record<InvitationEventType, { icon: IconType; description: string }>;

export function EventTypePicker({ ownerId, account, onSelect }: {
  ownerId: string;
  account?: { name: string; email: string; image?: string | null };
  onSelect(type: InvitationEventType): void;
}) {
  return <main className={styles.page}>
    <DashboardHeader name={account?.name || "Usuario"} email={account?.email || ""} image={account?.image} />
    <div className={styles.content}>
      <div className={styles.layout}>
        <section className={styles.intro} aria-labelledby="event-type-heading">
          <span className={styles.eyebrow}><LuSparkles aria-hidden="true" /> TU PRÓXIMA INVITACIÓN</span>
          <h1 id="event-type-heading">¿Qué vamos a <em>celebrar?</em></h1>
          <p className={styles.lead}>Cada ocasión tiene su historia. Empecemos por la tuya.</p>
          <p className={styles.explanation}>Elige tu tipo de evento. Después lo haremos tuyo con tus fotos, tus palabras y todos esos detalles que lo hacen especial.</p>
          <div className={styles.note}><span><LuCheck aria-hidden="true" /></span><p>Puedes empezar ahora y completar los detalles después.</p></div>
        </section>
        <section className={styles.selection} aria-labelledby="event-type-options-heading">
          <div className={styles.selectionHeading}><span className={styles.step} aria-hidden="true">01</span><div><h2 id="event-type-options-heading">Todo empieza con una ocasión</h2><p>Selecciona la que quieres compartir.</p></div></div>
          <div className={styles.options}>
            {invitationEventTypes.map(type => {
              const { icon: Icon, description } = occasions[type];
              const label = getInvitationEventContent(type).label;
              return <button className={styles.option} type="button" key={type} onClick={() => onSelect(type)} aria-labelledby={`occasion-${type}`} aria-describedby={`occasion-${type}-description`}>
                <span className={styles.icon}><Icon aria-hidden="true" /></span>
                <span className={styles.optionCopy}><strong id={`occasion-${type}`}>{label}</strong><span id={`occasion-${type}-description`}>{description}</span></span>
                <LuArrowUpRight className={styles.arrow} aria-hidden="true" />
              </button>;
            })}
          </div>
          <div className={styles.recovery}><CreationDraftResume ownerId={ownerId} /></div>
          <p className={styles.selectionNote}>Una ocasión. Una invitación hecha por ti.</p>
        </section>
      </div>
    </div>
  </main>;
}

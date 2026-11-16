"use client";

import Image from "next/image";
import { useState } from "react";
import { FiEye, FiX } from "react-icons/fi";
import { CelebrationInvitation } from "@/components/invitation/CelebrationInvitation";
import type { EditorValues } from "@/lib/invitation-editor";
import { InvitationLivePreview, type InvitationPreviewFocus } from "./InvitationLivePreview";
import styles from "./CreationInvitationPreview.module.css";

export function CreationInvitationPreview({ values, date, focus }: { values: EditorValues; date: string; focus?: InvitationPreviewFocus }) {
  const [open, setOpen] = useState(false);

  return <aside className={styles.preview} aria-label="Vista previa de tu invitación" data-open={open}>
    <button className={styles.toggle} type="button" aria-expanded={open} aria-controls="creation-phone-preview" onClick={() => setOpen(current => !current)}>
      {open ? <FiX aria-hidden="true" /> : <FiEye aria-hidden="true" />}{open ? "Ocultar vista previa" : "Ver mi invitación"}
    </button>
    <div className={styles.panel} id="creation-phone-preview">
      <div className={styles.caption} role="status" title={focus?.label}><span />{focus ? `Editando: ${focus.label}` : 'Tu invitación en vivo'}</div>
      <div className={styles.phone}>
        <div className={styles.screen}>
          <InvitationLivePreview initialDevice="mobile" fitViewport focus={focus}>
            <CelebrationInvitation {...values} date={date} eventDateKey={values.eventDate} preview showPlaceholders />
          </InvitationLivePreview>
        </div>
        <Image className={styles.frame} src="/iphone.png" alt="" aria-hidden="true" width={541} height={1114} sizes="(max-width: 1199px) 280px, 300px" />
      </div>
      <p className={styles.hint}>Desliza dentro del celular para explorar tu invitación.</p>
    </div>
  </aside>;
}

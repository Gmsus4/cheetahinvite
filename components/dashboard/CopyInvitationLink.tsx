"use client";

import { useState } from "react";
import Link from "next/link";
import { FiCheck, FiCopy, FiExternalLink } from "react-icons/fi";

export function CopyInvitationLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copia el enlace de tu invitación:", url);
    }
  }

  return <>
    <Link className="dashboard-event-open" href={path} target="_blank" rel="noreferrer" aria-label="Ver invitación" title="Ver invitación"><FiExternalLink aria-hidden="true" /><span>Ver</span></Link>
    <button className="dashboard-event-share" type="button" onClick={copyLink} aria-label={copied ? "Enlace copiado" : "Copiar enlace"} title={copied ? "Enlace copiado" : "Copiar enlace"}><span aria-hidden="true">{copied ? <FiCheck /> : <FiCopy />}</span><span>{copied ? "Copiado" : "Copiar enlace"}</span></button>
  </>;
}

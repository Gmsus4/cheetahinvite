"use client";

import { useState } from "react";
import Link from "next/link";
import { FiCheck, FiCopy, FiExternalLink } from "react-icons/fi";

export function CopyInvitationLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const path = `/invitacion/${slug}`;

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

  return <div className="dashboard-share-actions">
    <Link className="dashboard-event-open" href={path} target="_blank" rel="noreferrer"><FiExternalLink aria-hidden="true" /> Ver</Link>
    <button className="dashboard-event-share" type="button" onClick={copyLink}><span aria-hidden="true">{copied ? <FiCheck /> : <FiCopy />}</span>{copied ? "Copiado" : "Compartir"}</button>
  </div>;
}

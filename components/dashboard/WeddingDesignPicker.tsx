"use client";

import { getWeddingDesign, weddingDesigns } from "@/lib/wedding-designs";
import { WeddingDesignPreview } from "@/components/invitation/WeddingDesignPreview";
import { InvitationDesignGrid } from './InvitationDesignGrid';

export function WeddingDesignPicker({ value, onChange }: { value: string; onChange(id: string): void }) {
  const current = getWeddingDesign(value);
  return <InvitationDesignGrid value={value} onChange={onChange}
    legend="¿Cuál se siente más como ustedes?"
    description="Elige el estilo que cuenta su historia. Tus fotos y datos se conservan al cambiar de diseño."
    notice={current && !current.edition ? <p className="guided-legacy-design">Tu invitación conserva su diseño original. Elegir uno de esta colección aplica su nueva composición.</p> : undefined}
    options={weddingDesigns.map(design => ({ id: design.id, label: design.label, preview: <WeddingDesignPreview design={design} />, href: `/ejemplo-invitacion/boda-${design.kind}` }))} />;
}

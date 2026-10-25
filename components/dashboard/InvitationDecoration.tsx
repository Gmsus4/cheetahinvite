import Image from 'next/image';
import type { InvitationTemplate } from '@/lib/invitation-templates';

export function InvitationDecoration({ template, bottomOnly = false }: { template: InvitationTemplate; bottomOnly?: boolean }) {
  const slots = bottomOnly ? ['bottomLeft', 'bottomRight'] as const : ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const;
  return <div className="invite-decoration-frame" aria-hidden="true">{slots.map((slot) => template.assets[slot] && <span className={`invite-decoration-corner is-${slot}`} key={slot}><Image src={template.assets[slot]!} alt="" fill sizes="(max-width: 760px) 100px, 220px" unoptimized /></span>)}</div>;
}

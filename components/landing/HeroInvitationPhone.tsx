import Image from "next/image";
import type { ReactNode } from "react";
import { BrandLoader } from "@/components/BrandLoader";

export function HeroInvitationPhone({ children, action, loading = false, id = "hero-invitation-example", preload = true }: { children?: ReactNode; action?: ReactNode; loading?: boolean; id?: string; preload?: boolean }) {
  return <div className="hero-example-phone" id={id} aria-busy={loading || undefined}>
    <div className="hero-example-phone-screen">
      {loading ? <BrandLoader className="invitation-example-loader" message="Preparando tu invitación…" showMessage={false} /> : children}
    </div>
    <Image
      className="hero-phone-frame"
      src="/iphone.png"
      alt=""
      aria-hidden="true"
      width={541}
      height={1114}
      sizes="(max-width: 760px) 280px, 320px"
      preload={preload}
    />
    {action}
  </div>;
}

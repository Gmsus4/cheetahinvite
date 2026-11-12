import Image from "next/image";
import type { ReactNode } from "react";
import { BrandLoader } from "@/components/BrandLoader";

export function HeroInvitationPhone({ children, action, loading = false }: { children?: ReactNode; action?: ReactNode; loading?: boolean }) {
  return <div className="hero-example-phone" id="hero-invitation-example" aria-busy={loading || undefined}>
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
      preload
    />
    {action}
  </div>;
}

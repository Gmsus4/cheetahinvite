"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Link>, "href" | "onNavigate"> & {
  href: string; guard(event: { preventDefault(): void }, href: string): void;
};
export function EditorProtectedLink({ guard, href, ...props }: Props) {
  return <Link {...props} href={href} onNavigate={event => guard(event, href)} />;
}

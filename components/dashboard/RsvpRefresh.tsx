"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RsvpRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className="purchase-history-action" type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Actualizando…" : "Actualizar respuestas"}</button>;
}

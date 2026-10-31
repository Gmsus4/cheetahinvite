"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FiRefreshCw } from "react-icons/fi";

export function RsvpRefresh() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button className="purchase-history-action" type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}><FiRefreshCw aria-hidden="true" />{pending ? "Actualizando…" : "Actualizar respuestas"}</button>;
}

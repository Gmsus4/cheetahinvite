"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PaymentRefresh() {
  const router = useRouter();
  useEffect(() => {
    let attempts = 0;
    const interval = window.setInterval(() => {
      router.refresh();
      if (++attempts >= 20) window.clearInterval(interval);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [router]);
  return <div><p role="status">Esperando la confirmación del pago. Esta página se actualizará automáticamente. No necesitas volver a pagar.</p><button className="button" type="button" onClick={() => router.refresh()}>Verificar pago de nuevo</button></div>;
}

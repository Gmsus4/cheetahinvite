"use client";
import { useEffect, useState } from "react";
import { celebrationExceedsTerm } from "@/lib/invitation-date";

export function InvitationDateNotice({ date, time, expiresAt, now: initialNow, showTimeHelp = true }: { date: string; time: string; expiresAt?: Date | string | null; now?: number; showTimeHelp?: boolean }) {
  const [now, setNow] = useState<number | null>(initialNow ?? null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 60000);
    return () => window.clearInterval(interval);
  }, []);
  const outsideTerm = now !== null && celebrationExceedsTerm(date, time, expiresAt, new Date(now));
  return <div style={{ gridColumn: "1 / -1" }}>
    {showTimeHelp && <p><small>La fecha y la hora de la cuenta regresiva usan UTC−6 (hora del centro de México). Si no eliges una hora, contará hasta las 00:00 del día indicado.</small></p>}
    {outsideTerm && <p role="status">{expiresAt ? "La celebración queda fuera de la vigencia actual de tu invitación." : "La celebración queda después de los 12 meses que estás comprando si pagas hoy."} El enlace dejará de estar disponible antes de la celebración. Los 12 meses empiezan al confirmar el pago, no en la fecha del evento; considera pagar más cerca de la celebración o renovar durante el mes de archivo.</p>}
  </div>;
}

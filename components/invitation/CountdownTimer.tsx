"use client";
import { useState, useEffect } from "react";
import { invitationTimestamp } from "@/lib/invitation-date";

export function CountdownTimer({ date, time }: { date: string; time: string }) {
  const [now, setNow] = useState<number | null>(null);
  const target = invitationTimestamp(date, time);

  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (!Number.isFinite(target)) return null;
  if (now !== null && now >= target) return <p className="invite-countdown-started">¡Llegó el gran día! Que empiece la celebración.</p>;

  const totalSeconds = now === null ? 0 : Math.floor((target - now) / 1000);
  const values = [
    { value: now === null ? "--" : String(Math.floor(totalSeconds / 86400)), label: "días" },
    { value: now === null ? "--" : String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, "0"), label: "horas" },
    { value: now === null ? "--" : String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0"), label: "minutos" },
    { value: now === null ? "--" : String(totalSeconds % 60).padStart(2, "0"), label: "segundos" },
  ];

  return <div className="invite-countdown-clock" aria-label="Cuenta regresiva para el evento">
    {values.map((item) => <div className="invite-countdown-unit" key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>)}
  </div>;
}

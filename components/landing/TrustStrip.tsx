"use client";

import { useState } from "react";
import { FiAward, FiGift, FiHeart, FiPause, FiPlay, FiSmile, FiStar, FiSun } from "react-icons/fi";

const celebrations = [
  { label: "Bodas", icon: FiHeart },
  { label: "Cumpleaños", icon: FiGift },
  { label: "Graduaciones", icon: FiAward },
  { label: "Baby showers", icon: FiSmile },
  { label: "Aniversarios", icon: FiStar },
  { label: "Y todo lo que quieras celebrar", icon: FiSun },
];

export function TrustStrip() {
  const [paused, setPaused] = useState(false);

  return (
    <section className="trust-strip" aria-label="Tipos de celebración" data-paused={paused}>
      <span>Para todos tus grandes días</span>
      <div className="trust-strip-marquee">
        <div className="trust-strip-track">
          {[false, true].map((duplicate) => <ul className="trust-strip-group" key={String(duplicate)} aria-hidden={duplicate || undefined}>
            {celebrations.map(({ label, icon: Icon }) => <li className="trust-strip-chip" key={label}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </li>)}
          </ul>)}
        </div>
      </div>
      <button className="trust-strip-pause" type="button" onClick={() => setPaused((current) => !current)} aria-label={paused ? "Reanudar movimiento" : "Pausar movimiento"} aria-pressed={paused} title={paused ? "Reanudar movimiento" : "Pausar movimiento"}>
        {paused ? <FiPlay aria-hidden="true" /> : <FiPause aria-hidden="true" />}
      </button>
    </section>
  );
}

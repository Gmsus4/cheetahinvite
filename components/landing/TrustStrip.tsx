import { FiAward, FiGift, FiHeart, FiSun } from "react-icons/fi";

export function TrustStrip() {
  return (
    <section className="trust-strip" aria-label="Tipos de celebración">
      <span>PARA TODOS TUS GRANDES DÍAS</span>
      <div>
        <b><FiHeart aria-hidden="true" /></b> Bodas
      </div>
      <div>
        <b><FiGift aria-hidden="true" /></b> Cumpleaños
      </div>
      <div>
        <b><FiAward aria-hidden="true" /></b> Graduaciones
      </div>
      <div>
        <b><FiSun aria-hidden="true" /></b> Y todo lo que quieras celebrar
      </div>
    </section>
  );
}

import {
  FiArrowUpRight,
  FiCheck,
  FiChevronDown,
  FiHeart,
  FiStar,
} from "react-icons/fi";

export function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-dot" /> TUS MOMENTOS, EN UN SOLO LUGAR
        </div>
        <h1 className="text-black!">
          Hay días que
          <br />
          merecen <em>compartirse.</em>
        </h1>
        <p className="hero-lead">
          Crea una invitación digital tan especial como tu celebración.
          Personalízala, compártela y disfruta cada respuesta.
        </p>
        <div className="hero-actions">
          <a className="button" href="/crear">
            Crea tu invitación <span><FiArrowUpRight aria-hidden="true" /></span>
          </a>
          <a className="text-link" href="#plantillas">
            Explorar diseños <span><FiChevronDown aria-hidden="true" /></span>
          </a>
        </div>
        <div className="social-proof">
          <div className="avatar-stack">
            <span>V</span>
            <span>M</span>
            <span>A</span>
            <span>+</span>
          </div>
          <div>
            <strong>Momentos que ya se celebran</strong>
            <small>Hecho para compartir con quienes más quieres</small>
          </div>
        </div>
      </div>

      <div className="hero-art" aria-label="Vista previa de invitación de boda">
        <div className="art-sun sun-one" />
        <div className="art-sun sun-two" />
        <div className="floating-note note-top">
          <span><FiStar aria-hidden="true" /></span> Tu historia, tu estilo
        </div>
        <div className="invite-card">
          <div className="invite-photo">
            <div className="photo-sky" />
            <div className="photo-hill hill-back" />
            <div className="photo-hill hill-front" />
            <div className="photo-sun" />
            <span className="photo-caption">UNA CELEBRACIÓN PARA RECORDAR</span>
          </div>
          <div className="invite-content">
            <span className="invite-kicker">NOS CASAMOS</span>
            <div className="invite-names">
              Sofía <i>&amp;</i>
              <br />
              Mateo
            </div>
            <div className="invite-rule">
              <span><FiHeart aria-hidden="true" /></span>
            </div>
            <p>
              12 · OCTUBRE · 2026
              <br />
              HACIENDA LAS NUBES · OAXACA
            </p>
            <span className="invite-rsvp">ACOMPÁÑANOS</span>
          </div>
        </div>
        <div className="floating-note note-bottom">
          <span className="note-check"><FiCheck aria-hidden="true" /></span>
          <span>
            <b>¡Confirmado!</b>
            <small>Una invitada respondió</small>
          </span>
        </div>
        <div className="art-spark spark-one"><FiStar aria-hidden="true" /></div>
        <div className="art-spark spark-two"><FiStar aria-hidden="true" /></div>
      </div>

      <a className="scroll-cue" href="#plantillas">
        <span>01</span>
        <i /> DESLIZA PARA DESCUBRIR
      </a>
    </section>
  );
}

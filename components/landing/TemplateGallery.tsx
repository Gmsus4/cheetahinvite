import { FiArrowUpRight, FiAward, FiGift, FiHeart } from "react-icons/fi";

const templates = [
  {
    name: "Jardín eterno",
    type: "Boda",
    tone: "garden",
    mark: FiHeart,
    detail: "Sofía & Mateo",
  },
  {
    name: "Un día de estrellas",
    type: "Cumpleaños",
    tone: "stars",
    mark: FiGift,
    detail: "Emma cumple 5",
  },
  {
    name: "El gran comienzo",
    type: "Graduación",
    tone: "grad",
    mark: FiAward,
    detail: "Lo logramos",
  },
];

export function TemplateGallery() {
  return (
    <section className="templates-section" id="plantillas">
      <div className="section-heading">
        <div>
          <span className="eyebrow">DISEÑOS CON MUCHO CORAZÓN</span>
          <h2>
            Una invitación
            <br />
            que se siente <em>muy tuya.</em>
          </h2>
        </div>
        <p>
          Elige un punto de partida y hazlo tuyo. Cada detalle está pensado para
          que tu evento se sienta especial desde el primer clic.
        </p>
      </div>

      <div className="template-grid">
        {templates.map((template, index) => (
          <article className="template-item" key={template.name}>
            <div className={`template-preview ${template.tone}`}>
              <span className="template-number">0{index + 1}</span>
              <div className="template-ornament">
                <template.mark aria-hidden="true" />
              </div>
              <div className="template-title">{template.detail}</div>
              <div className="template-date">UNA FECHA · UN RECUERDO</div>
              <a
                className="template-arrow"
                href="/crear"
                aria-label={`Elegir plantilla ${template.name}`}
              >
                <FiArrowUpRight aria-hidden="true" />
              </a>
            </div>
            <div className="template-meta">
              <div>
                <h3>{template.name}</h3>
                <span>{template.type}</span>
              </div>
              <span className="template-count">0{index + 1}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="center-link">
        <a className="text-link" href="/plantillas">
          Ver todas las plantillas <span><FiArrowUpRight aria-hidden="true" /></span>
        </a>
      </div>
    </section>
  );
}

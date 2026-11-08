import Link from "next/link";
import { FiArrowUpRight, FiMessageCircle, FiPlus } from "react-icons/fi";
import { Suspense } from "react";
import { getCurrentPrice } from "@/lib/site-pricing";

async function PriceAnswer() {
  const price = await getCurrentPrice();
  return <>La publicación cuesta {price.label} MXN por evento, con IVA incluido. Tu invitación estará activa durante {price.months} meses desde la confirmación del pago. Es un solo pago, sin mensualidades ni renovación automática.</>;
}

const questions = [
  {
    question: "¿Puedo crear mi invitación antes de pagar?",
    answer: "Sí. Crea tu cuenta, personaliza tu invitación y revisa la vista previa gratis. Solo pagas cuando decidas publicarla para obtener el enlace que compartirás con tus invitados.",
  },
  {
    question: "¿Cuánto cuesta y cuánto tiempo estará activa?",
    answer: <Suspense fallback="Consultando precio vigente…"><PriceAnswer /></Suspense>,
  },
  {
    question: "¿Qué puedo personalizar?",
    answer: "Puedes cambiar los textos, las fotos, los colores y las tipografías. También puedes elegir las secciones que necesites, como ubicación, programa y confirmación de asistencia.",
  },
  {
    question: "¿Cómo la comparto con mis invitados?",
    answer: "Después de publicar, copia el enlace desde tu panel y envíalo por WhatsApp, correo o tus redes sociales. Tus invitados pueden abrirlo en su navegador, sin crear una cuenta ni instalar una aplicación.",
  },
  {
    question: "¿Puedo editarla después de publicarla?",
    answer: "Sí. Puedes actualizar los datos, los textos y las fotos desde tu panel durante la vigencia de la invitación. Guarda tus cambios para que tus invitados los vean al abrir de nuevo el enlace.",
  },
  {
    question: "¿Cómo funciona la confirmación de asistencia?",
    answer: "Activa la confirmación integrada para que tus invitados indiquen su nombre, si asistirán y hasta cinco acompañantes adicionales. Las respuestas son privadas para ti: puedes consultarlas en tu panel y descargar la lista para abrirla en Excel. Si prefieres, puedes usar un enlace externo de confirmación, como WhatsApp.",
  },
];

const questionGroups = [
  { title: "Antes de publicar", questions: questions.slice(0, 3) },
  { title: "Después de publicar", questions: questions.slice(3) },
];

export function FAQ() {
  return (
    <section className="home-faq" id="preguntas-frecuentes" aria-labelledby="home-faq-title">
      <div className="home-faq-heading">
        <span className="eyebrow">ANTES DE TU GRAN DÍA</span>
        <h2 id="home-faq-title">Preguntas <em>frecuentes.</em></h2>
        <p>Resuelve tus dudas y empieza a preparar una invitación muy tuya.</p>
      </div>

      <div className="home-faq-grid">
        {questionGroups.map(({ title, questions: groupQuestions }) => (
          <div className="home-faq-group" key={title}>
            <h3>{title}</h3>
            <div className="home-faq-list">
              {groupQuestions.map(({ question, answer }) => (
                <details className="home-faq-item" name="home-faq" key={question}>
                  <summary>
                    <span>{question}</span>
                    <FiPlus aria-hidden="true" />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="home-faq-support">
        <span className="home-faq-support-icon"><FiMessageCircle aria-hidden="true" /></span>
        <p><strong>¿Te quedó alguna duda?</strong> Estamos para ayudarte.</p>
        <Link className="text-link" href="/ayuda">
          Visitar ayuda y soporte <FiArrowUpRight aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

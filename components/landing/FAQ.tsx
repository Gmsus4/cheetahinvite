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
    answer: "Puedes cambiar los textos, las fotos, los colores y las tipografías, y elegir qué secciones mostrar: historia, programa, galería, regalos, confirmación de asistencia y más. Los ejemplos te ayudan a conocer el resultado; tú agregas los datos de tu celebración.",
  },
  {
    question: "¿Puedo proteger mi invitación con un PIN?",
    answer: "Sí. Antes de publicar eliges entre acceso público o protegido con un PIN de seis dígitos. Si eliges PIN, compártelo junto con el enlace: tus invitados lo necesitarán para abrir la invitación. También puedes cambiar esta opción desde los ajustes de tu evento.",
  },
  {
    question: "¿Cómo la comparto con mis invitados?",
    answer: "Después de publicar, copia el enlace desde tu panel y envíalo por WhatsApp, correo o tus redes sociales. Tus invitados lo abren en su navegador, sin crear una cuenta ni instalar una aplicación. Si la protegiste con PIN, recuerda enviarles también ese código.",
  },
  {
    question: "¿Puedo editarla después de publicarla?",
    answer: "Sí. Durante la vigencia puedes actualizar los datos, los textos y las fotos desde tu panel, sin pagar otra publicación. Publica los cambios para que se vean en el mismo enlace que ya compartiste.",
  },
  {
    question: "¿Cómo funciona la confirmación de asistencia?",
    answer: "Activa la confirmación integrada para recibir el nombre, la respuesta de asistencia y el número de acompañantes. Tú defines el máximo de acompañantes permitido por respuesta. Consulta las respuestas y los totales en tu panel, o descarga la lista para abrirla en Excel; no se muestran a otros invitados. También puedes usar un enlace externo de confirmación, como WhatsApp.",
  },
  {
    question: "¿Qué pasa cuando termina la vigencia?",
    answer: "El enlace deja de estar disponible para tus invitados y la edición se desactiva. La invitación se conserva archivada durante un mes natural; si no se renueva, se elimina al terminar ese plazo. Descarga tus confirmaciones antes del vencimiento si quieres conservarlas.",
  },
];

const questionGroups = [
  { title: "Antes de publicar", questions: questions.slice(0, 4) },
  { title: "Después de publicar", questions: questions.slice(4) },
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

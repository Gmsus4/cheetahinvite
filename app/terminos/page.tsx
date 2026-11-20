import type { Metadata } from "next";
import { LegalPage } from "@/app/legal/LegalPage";
import { LEGAL_OPERATOR, LEGAL_UPDATED_AT } from "@/lib/legal";
import { ACCOUNT_LIMITS } from "@/lib/limits";
import { RSVP_LIMITS } from "@/lib/rsvp";

export const metadata: Metadata = {
  title: "Términos y condiciones | Soccasion",
  description: "Condiciones de creación, publicación, pagos, privacidad y vigencia de las invitaciones digitales de Soccasion.",
};

export default function TermsPage() {
  return <LegalPage
    currentPath="/terminos"
    eyebrow="CONDICIONES DEL SERVICIO"
    title="Términos y condiciones"
    intro="Estas condiciones regulan el acceso y uso de Soccasion, plataforma para crear, personalizar, publicar y compartir invitaciones digitales. Al crear una cuenta o contratar un servicio, aceptas estos términos."
    updated={LEGAL_UPDATED_AT}
    sections={[
      {
        title: "Quién presta el servicio y contacto",
        body: <>
          <p>Soccasion es operado por <strong>{LEGAL_OPERATOR.name}</strong> (en adelante, “Soccasion” o el “Proveedor”). Domicilio: <strong>{LEGAL_OPERATOR.address}</strong>.</p>
          <p>Atención, aclaraciones y solicitudes de privacidad: <a href={LEGAL_OPERATOR.emailHref}>{LEGAL_OPERATOR.email}</a>. Teléfono: <a href={LEGAL_OPERATOR.phoneHref}>{LEGAL_OPERATOR.phone}</a>.</p>
        </>,
      },
      {
        title: "El servicio",
        body: <>
          <p>Puedes crear y previsualizar gratis invitaciones para bodas, cumpleaños, graduaciones, baby showers, aniversarios y otros eventos, personalizando textos, fotografías, colores y fuentes. La publicación se contrata por evento. Puedes tener hasta {ACCOUNT_LIMITS.invitations} invitaciones en tu cuenta, incluidos los borradores. Eliminar una libera un espacio; no traslada un pago a otra invitación ni genera por sí mismo un reembolso.</p>
          <p>Los borradores sin pago confirmado ni cortesía se eliminan tras seis meses naturales desde su creación o el último guardado de cambios reales. Guardar cambios de contenido, diseño o privacidad reinicia ese plazo; abrir el borrador o iniciar sesión no lo reinicia. El panel muestra la fecha prevista de eliminación. Los avisos por correo aún no están disponibles. Antes de eliminar se verifican los pagos pendientes; las incidencias pueden retrasar el borrado. La eliminación libera el espacio y encola las fotos que ya no se utilizan.</p>
          <p>La publicación incluye un enlace de la plataforma personalizable según disponibilidad. No incluye dominio propio, conexión de dominios externos, pases individuales, verificación de identidad ni control de entrada. Puedes elegir acceso público o protegido con PIN.</p>
          <p>Las imágenes deben respetar los formatos y límites indicados en el editor: hasta {ACCOUNT_LIMITS.imageSizeBytes / (1024 * 1024)} MiB por archivo y {ACCOUNT_LIMITS.imagesPerGallery} fotografías por galería. Existen límites adicionales de almacenamiento y cargas; el editor informa cuando se alcanzan.</p>
        </>,
      },
      {
        title: "Cuenta y seguridad",
        body: <>
          <p>Puedes registrarte con nombre, correo y contraseña o acceder con Google cuando esté disponible. Debes proporcionar información exacta y proteger tus credenciales. Si detectas actividad que no reconoces, avisa a soporte. Podemos solicitar verificaciones razonables antes de modificar el acceso.</p>
          <p>El servicio está dirigido a personas con capacidad legal para contratar. Quien publique nombres, imágenes o datos de menores debe contar con las autorizaciones de su madre, padre o tutor que correspondan.</p>
          <p>El editor puede conservar copias de recuperación en tu navegador. No equivalen a un guardado confirmado en el servidor y pueden perderse al borrar los datos del sitio o cambiar de dispositivo. Revisa el estado de guardado antes de cerrar o publicar.</p>
        </>,
      },
      {
        title: "Contenido y permisos",
        body: <>
          <p>Conservas los derechos sobre tu contenido. Nos autorizas de forma limitada y no exclusiva a alojarlo, reproducirlo, adaptarlo técnicamente y mostrarlo para operar, proteger y prestar la plataforma y publicar tu invitación, durante el tiempo necesario para esos fines y su eliminación conforme al Aviso de privacidad.</p>
          <p>Debes contar con los derechos, licencias y consentimientos necesarios para utilizar nombres, fotografías, música, marcas y demás materiales. No subas documentos de identidad ni información sensible; evita datos de terceros innecesarios para la celebración.</p>
          <p>No utilices el servicio para contenido ilícito, fraudulento, infractor, discriminatorio, amenazante o que exponga a alguien a un riesgo indebido, ni intentes vulnerar su seguridad o disponibilidad.</p>
        </>,
      },
      {
        title: "Responsabilidad del Organizador y datos de terceros",
        body: <>
          <p>Para estos términos, el <strong>Organizador</strong> es la persona titular de la cuenta que crea y administra la invitación. Es responsable de la información que incorpora, de cómo comparte la invitación y del uso que hace de las funciones del servicio.</p>
          <ul>
            <li><strong>Datos y autorizaciones.</strong> El Organizador declara que los nombres, fotografías, ubicaciones, textos y demás datos que incorpora corresponden a su evento, son correctos y se utilizan de forma lícita. Debe contar con los derechos, consentimientos y autorizaciones necesarios para compartirlos con Soccasion y publicarlos o utilizarlos en las funciones que active. No debe incluir datos de personas ajenas al evento ni utilizar información de terceros para finalidades distintas de las autorizadas.</li>
            <li><strong>Alcance del servicio.</strong> Soccasion proporciona herramientas para crear, alojar, publicar y compartir invitaciones y gestionar respuestas de asistencia. El tratamiento de datos se realiza conforme al <a href="/aviso-de-privacidad">Aviso de privacidad</a>, para prestar el servicio y atender las finalidades de seguridad, soporte y cumplimiento legal allí descritas. La plataforma no organiza los eventos ni la publicación implica aprobación del contenido del Organizador.</li>
            <li><strong>Reclamaciones de terceros.</strong> En la medida permitida por la legislación aplicable, Soccasion no asume responsabilidad por reclamaciones derivadas de datos incorrectos, falta de consentimiento, infracción de derechos de terceros o uso indebido de las invitaciones que sean atribuibles al Organizador. El Organizador deberá responder por su incumplimiento y, cuando legalmente proceda, mantener a Soccasion a salvo de las responsabilidades y los gastos razonables y acreditados que deriven de dicho incumplimiento. Esta obligación no comprende actos u omisiones imputables a Soccasion ni limita sus obligaciones legales o los derechos de las personas afectadas.</li>
            <li><strong>Uso autorizado e incumplimientos.</strong> Las invitaciones y sus funciones deben utilizarse exclusivamente para fines lícitos relacionados con el evento, respetando los derechos de otras personas. Soccasion podrá retirar o suspender invitaciones y limitar el acceso cuando detecte o reciba indicios de un uso contrario a estos términos, incluso de forma preventiva mientras se revisa el caso. Estas reglas se aplican a borradores, invitaciones publicadas y protegidas con PIN, así como a su difusión.</li>
          </ul>
          <p>Cualquier persona puede reportar un uso no autorizado a <a href={`${LEGAL_OPERATOR.emailHref}?subject=${encodeURIComponent("Reporte de uso indebido de una invitación")}`}>{LEGAL_OPERATOR.email}</a>, aunque no tenga cuenta. Incluye el enlace, una descripción y únicamente la información necesaria para revisar el caso; no envíes contraseñas ni PIN.</p>
        </>,
      },
      {
        title: "Borradores, publicación y protección con PIN",
        body: <>
          <p>Crear o previsualizar una invitación no la publica. Para habilitar el enlace debes completar los datos necesarios, elegir su privacidad y contar con un pago confirmado o una cortesía vigente otorgada por el equipo. Revisa nombres, fechas, ubicaciones, textos e imágenes antes de publicar.</p>
          <p>En modo público, cualquier persona con el enlace puede abrirlo y reenviarlo. En modo protegido, se requiere un PIN de seis dígitos que compartes con tus invitados. Quien conozca el enlace y el PIN puede acceder: no se verifica su identidad. El acceso del navegador dura hasta doce horas; cambiar el PIN o la privacidad invalida los accesos anteriores.</p>
          <p>Las invitaciones públicas pueden mostrar su portada y textos en vistas previas de otras aplicaciones. Las protegidas presentan una vista previa genérica de Soccasion. El PIN protege la página; las imágenes siguen siendo accesibles para quien conozca su dirección directa. Evita contenido que necesite confidencialidad estricta.</p>
          <p>Puedes editar durante la vigencia y eliminar desde el panel. Cambiar el enlace puede mantener direcciones anteriores que conducen a la misma invitación y respetan su privacidad actual. El cambio a PIN o la eliminación no retiran capturas, descargas o vistas previas conservadas por terceros.</p>
        </>,
      },
      {
        title: "Confirmación de asistencia y servicios externos",
        body: <>
          <p>Si activas la confirmación integrada, los invitados responden con nombre y apellido, Sí o No asistiré y el número de acompañantes adicionales permitido por el organizador, de cero a {RSVP_LIMITS.companions}. No se solicitan nombres de acompañantes, teléfono ni correo. Las respuestas no son identidades verificadas, pases de acceso ni una garantía de asistencia.</p>
          <p>La lista no se publica: la cuenta organizadora puede consultarla, descargarla en CSV y eliminar respuestas. Cada invitado conserva una clave en su navegador para recuperar o modificar su respuesta. Cambiar de dispositivo o borrar el almacenamiento puede impedir recuperarla y generar duplicados. Desactivar el formulario conserva las respuestas hasta su eliminación o la del evento.</p>
          <p>Puedes añadir enlaces externos de confirmación, mapas, regalos y reproductores de Spotify, YouTube, Apple Music o SoundCloud. Su disponibilidad, contenido y tratamiento de datos dependen del servicio externo. El organizador debe contar con permisos y explicar cómo usará los datos que reciba fuera de Soccasion.</p>
        </>,
      },
      {
        title: "Precio, medios de pago y confirmación",
        body: <>
          <p>El precio total por evento, en pesos mexicanos e IVA incluido, se muestra antes de contratar. El importe de la pantalla de pago es el aplicable a esa compra; los cambios posteriores no alteran pagos confirmados. Para consultas sobre comprobantes fiscales, contacta a soporte.</p>
          <p>Según las opciones habilitadas, puedes continuar a Stripe para tarjeta u OXXO, PayPal o Mercado Pago. El proveedor elegido procesa los datos del medio de pago. Soccasion conserva referencias, importe, moneda, fechas y estados de la operación, sin almacenar el número completo de tu tarjeta ni su código de seguridad.</p>
          <p>Iniciar el pago, volver del proveedor o generar una ficha no publica la invitación: se requiere verificar la confirmación. Con OXXO, la ficha vence en un día y la confirmación puede llegar hasta el siguiente día hábil después del depósito. Respeta el vencimiento mostrado y, si ya pagaste, espera la confirmación o contacta a soporte antes de intentar otro cobro.</p>
        </>,
      },
      {
        title: "Vigencia, archivo, renovación y cortesías",
        body: <>
          <p>La publicación pagada dura doce meses naturales desde el inicio de vigencia registrado para el pago confirmado. El panel y los detalles de compra muestran su vencimiento. No es una suscripción y no tiene renovación automática. Editar o recibir de nuevo la confirmación del mismo pago no reinicia el periodo.</p>
          <p>Al vencer, el enlace, la confirmación de asistencia y la edición dejan de estar disponibles. La invitación permanece archivada un mes natural posterior al vencimiento. Durante ese plazo, si el estado de la compra lo permite, puedes contratar otro año al precio vigente desde el panel. La nueva vigencia se registra con el nuevo pago confirmado y conserva contenido, respuestas, PIN y enlaces.</p>
          <p>Al terminar el mes sin renovación, la invitación y sus respuestas pasan al proceso automático de eliminación. Las imágenes alojadas en Cloudflare se incorporan a una cola de borrado con reintentos. La eliminación física puede completarse después por tiempos de procesamiento o incidencias. Las compras se conservan por separado conforme al Aviso de privacidad.</p>
          <p>Las cortesías tienen el vencimiento indicado en el panel, sin cobro ni renovación automática. No ofrecen la renovación de una compra pagada; al vencer se aplica el mismo mes de archivo y proceso de eliminación.</p>
        </>,
      },
      {
        title: "Cancelaciones, reembolsos y aclaraciones",
        body: <>
          <p>Para cancelar el servicio, aclarar un pago o pedir un reembolso, escribe desde el correo de tu cuenta a <a href={LEGAL_OPERATOR.emailHref}>{LEGAL_OPERATOR.email}</a>. Indica la referencia de la invitación o compra, fecha aproximada y motivo. No envíes contraseñas ni datos completos de tarjeta. Soporte revisará y responderá por correo; la solicitud no implica aprobación automática del reembolso.</p>
          <p>La política comercial contempla reembolsos por fallas atribuibles a Soccasion que impidan prestar el servicio, incluidos cobros duplicados por error del sistema. Se comprobará la incidencia y se informará la solución y, cuando proceda, el importe. No se ofrece una devolución comercial por cambio de opinión, errores del contenido introducido por el usuario o eliminación voluntaria de la invitación.</p>
          <p>Esto no excluye devoluciones, compensaciones ni otros derechos irrenunciables de la legislación aplicable. Los tiempos de reflejo dependen del proveedor y de la institución financiera. OXXO no admite reembolso directo por Stripe; si procede una devolución, soporte acordará el mecanismo correspondiente.</p>
          <p>Los botones de ayuda y recuperación manual preparan un correo en tu aplicación: debes revisarlo y enviarlo. Abrirlo no crea un ticket ni envía una solicitud automáticamente.</p>
        </>,
      },
      {
        title: "Publicación durante reembolsos y disputas",
        body: <>
          <p>Un reembolso total confirmado retira la publicación; uno parcial mantiene el acceso dentro de su vigencia original. Los reembolsos pendientes, fallidos o cancelados no lo retiran por sí mismos. El estado depende de la información verificada con el proveedor del pago.</p>
          <p>Una disputa o contracargo puede suspender el enlace mientras se resuelve. Si se confirma la validez del pago, se recupera la publicación con el vencimiento original, siempre que siga vigente y no esté eliminada, archivada o totalmente reembolsada. Una disputa perdida mantiene la suspensión. Consulta el estado en Mis compras.</p>
        </>,
      },
      {
        title: "Disponibilidad, mantenimiento y soporte",
        body: <p>Trabajamos para mantener disponible el servicio. Pueden ocurrir interrupciones por mantenimiento, fallas técnicas, conectividad o servicios externos. Informaremos cuando sea razonablemente posible de mantenimientos programados y atenderemos incidencias por los canales indicados. Esto no limita nuestras obligaciones respecto del servicio contratado ni los derechos del consumidor.</p>,
      },
      {
        title: "Suspensión y terminación",
        body: <>
          <p>Podemos limitar temporalmente el acceso o retirar contenido para atender un requerimiento legal, proteger a las personas, responder a un incidente de seguridad o investigar un incumplimiento material, incluidos los usos indebidos descritos en estos términos. Cuando sea posible y no agrave el riesgo para las personas afectadas, notificaremos el motivo y ofreceremos una oportunidad razonable de aclararlo o corregirlo.</p>
          <p>Puedes eliminar invitaciones desde el panel, dejar de usar el servicio o solicitar el cierre de cuenta por correo. El cierre se gestiona mediante soporte; no es una baja automática. Se respetarán las solicitudes de cancelación de datos y los plazos legales aplicables, conservando los registros que procedan según el Aviso de privacidad.</p>
        </>,
      },
      {
        title: "Propiedad intelectual de la plataforma",
        body: <p>La marca, software, diseño, textos y recursos de Soccasion pertenecen al Proveedor o a sus licenciantes. Te concedemos un permiso personal, limitado y no transferible para utilizar la plataforma conforme a estos términos. No puedes copiar, revender ni explotar sus recursos fuera de las funciones autorizadas, sin perjuicio de los usos permitidos por la ley y de tus derechos sobre el contenido propio.</p>,
      },
      {
        title: "Privacidad y datos de invitados",
        body: <p>El tratamiento de datos de cuenta, pagos, invitaciones, asistencia y soporte se explica en el <a href="/aviso-de-privacidad">Aviso de privacidad</a>. Como organizador debes contar con las autorizaciones necesarias, compartir el aviso con tus invitados y proteger las listas que descargues. El equipo autorizado puede tratar datos para operación, seguridad y soporte; la lista de asistencia no es pública. Puedes reportar un uso indebido de tus datos aunque no tengas una cuenta.</p>,
      },
      {
        title: "Cambios a estos términos",
        body: <p>Podemos actualizar estos términos por cambios del servicio o de la legislación. Publicaremos la versión vigente con su fecha y comunicaremos los cambios materiales en el sitio o por el correo registrado antes de aplicarlos cuando corresponda. No se alterarán retroactivamente las condiciones de compras confirmadas ni se sustituirá el consentimiento que exija la ley.</p>,
      },
      {
        title: "Ley aplicable y atención al consumidor",
        body: <p>Estos términos se rigen por las leyes federales de México, incluida la <a href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPC.pdf" target="_blank" rel="noreferrer">Ley Federal de Protección al Consumidor</a>. Puedes acudir a PROFECO y a las autoridades o tribunales competentes. Ninguna cláusula priva al consumidor de sus derechos. Para aclaraciones o reclamaciones, utiliza los contactos de la sección 1.</p>,
      },
    ]}
  />;
}

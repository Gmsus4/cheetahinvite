import type { Metadata } from "next";
import { LegalPage } from "@/app/legal/LegalPage";
import { LEGAL_OPERATOR, LEGAL_UPDATED_AT } from "@/lib/legal";
import { RSVP_LIMITS } from "@/lib/rsvp";

export const metadata: Metadata = {
  title: "Aviso de privacidad | Soccasion",
  description: "Datos personales, invitaciones con PIN, asistencia, pagos, proveedores y derechos ARCO en Soccasion.",
};

export default function PrivacyPage() {
  return <LegalPage
    currentPath="/aviso-de-privacidad"
    eyebrow="PRIVACIDAD Y DATOS PERSONALES"
    title="Aviso de privacidad integral"
    intro="Este aviso explica el tratamiento de datos al visitar Soccasion, crear una cuenta, editar o consultar invitaciones, confirmar asistencia, contratar servicios o contactar a soporte. También aplica a invitados y personas cuyos datos aparezcan en un evento."
    updated={LEGAL_UPDATED_AT}
    sections={[
      {
        title: "Responsable, domicilio y contacto",
        body: <>
          <p>El responsable del tratamiento es <strong>{LEGAL_OPERATOR.name}</strong>, operador de Soccasion. Domicilio: <strong>{LEGAL_OPERATOR.address}</strong>.</p>
          <p>Para privacidad y derechos ARCO, escribe a <a href={LEGAL_OPERATOR.emailHref}>{LEGAL_OPERATOR.email}</a> con el asunto “Privacidad / Derechos ARCO”. Responsable de privacidad: <strong>{LEGAL_OPERATOR.name}</strong>. Teléfono de contacto: <a href={LEGAL_OPERATOR.phoneHref}>{LEGAL_OPERATOR.phone}</a>.</p>
        </>,
      },
      {
        title: "Datos personales que tratamos",
        body: <>
          <p>Los datos dependen de las funciones que utilices:</p>
          <ul>
            <li><strong>Cuenta y acceso:</strong> nombre, correo, hash de contraseña y, si eliges Google, identificador, fotografía, datos de perfil y credenciales técnicas de la cuenta vinculada que ese proveedor entregue para autenticarte.</li>
            <li><strong>Invitaciones:</strong> nombres de organizadores y festejados, tipo de evento, fecha, hora, lugares, direcciones, fotografías, textos y enlaces. Los enlaces o textos pueden incluir teléfono de WhatsApp o referencias de regalos que decidas publicar.</li>
            <li><strong>Asistencia integrada:</strong> nombre y apellido, respuesta Sí o No, cantidad de acompañantes adicionales según el límite del organizador —de cero a {RSVP_LIMITS.companions}—, fechas de respuesta y actualización y la huella de una clave privada del navegador. No pedimos teléfono, correo ni nombres de acompañantes en este formulario.</li>
            <li><strong>Compras:</strong> identificadores de cuenta y evento, nombre del evento, proveedor, referencias, importe, moneda, fechas, vigencia, estado del pago, reembolsos y disputas. Stripe, PayPal o Mercado Pago procesan los datos completos del medio de pago; no almacenamos el número completo de tarjeta ni su código de seguridad.</li>
            <li><strong>Recuperación, soporte y reportes de uso indebido:</strong> correo, mensajes, enlace de la invitación reportada y evidencias necesarias que proporciones para revisar una incidencia o verificar una solicitud; en la recuperación automática, huella del token temporal, vencimiento y contadores. No necesitamos tu contraseña actual por correo.</li>
            <li><strong>Seguridad y operación:</strong> sesiones, huellas de PIN y de tokens de acceso, contadores contra abuso, referencias técnicas de imágenes y registros administrativos de acciones sobre cuentas, compras o cortesías.</li>
            <li><strong>Navegación:</strong> cookies y almacenamiento descritos más adelante. La infraestructura puede recibir IP, navegador y registros de conexión. Al comprobar un PIN, la aplicación utiliza la IP para generar una huella por evento y limitar intentos; el contador no conserva la IP en texto claro.</li>
          </ul>
          <p>No solicitamos datos sensibles para el uso ordinario. El contenido que publiques puede revelar información íntima, por ejemplo creencias religiosas según el evento. Evita incluirla, así como documentos de identidad o datos innecesarios de otras personas.</p>
        </>,
      },
      {
        title: "Finalidades necesarias y medición opcional",
        body: <>
          <p>Tratamos los datos necesarios para administrar cuentas, autenticar y recuperar el acceso, guardar y editar invitaciones, alojar imágenes, publicar enlaces y comprobar PIN, recibir y consultar asistencia, gestionar pagos, vigencias y renovaciones, atender soporte y reportes de uso no autorizado de datos, contenido o funciones del servicio, prevenir abuso, resolver aclaraciones y cumplir obligaciones legales.</p>
          <p>Como finalidad adicional, medimos aproximadamente visitas al inicio y selecciones de ejemplos para conocer el uso de la plataforma. Esta medición no es necesaria para crear o consultar invitaciones. Puedes impedirla mediante Do Not Track, Global Privacy Control o bloqueando el almacenamiento de sesión, como se explica en el apartado de tecnologías.</p>
          <p>No utilizamos estos datos para publicidad personalizada ni ofrecemos actualmente campañas promocionales o suscripción a noticias. Si incorporamos otras finalidades que requieran consentimiento, las informaremos y solicitaremos antes del tratamiento correspondiente.</p>
        </>,
      },
      {
        title: "Invitaciones públicas y protegidas con PIN",
        body: <>
          <p>El organizador elige entre acceso público y protección con PIN de seis dígitos. En modo público, cualquier persona con el enlace puede abrirlo y reenviarlo; aplicaciones de mensajería o redes sociales pueden consultar y guardar portada, título y descripción para sus vistas previas.</p>
          <p>En modo protegido, la página requiere el PIN y muestra metadatos genéricos de Soccasion antes de desbloquearla. Tras introducirlo correctamente, una cookie permite el acceso durante hasta doce horas. Cambiar el PIN o la privacidad invalida los accesos previos. El PIN no verifica la identidad: cualquiera que lo reciba junto con el enlace puede entrar.</p>
          <p>La protección de la página no convierte las imágenes en archivos de acceso individual: quien conozca una dirección directa puede consultarla, incluidas referencias antiguas de Cloudinary. Cambiar a PIN o eliminar el evento no retira copias, descargas ni vistas previas guardadas por otros servicios.</p>
          <p>Quien publique debe tener autorización para utilizar fotografías y datos de terceros, incluidos menores. Si apareces en una invitación y quieres ejercer tus derechos, puedes contactar al responsable sin necesidad de registrarte.</p>
        </>,
      },
      {
        title: "Datos de terceros y gestión de asistencia",
        body: <>
          <p>La persona titular de la cuenta que crea y administra la invitación (el Organizador) es responsable de los datos de otras personas que incorpora y de contar con los derechos, consentimientos y autorizaciones necesarios para compartirlos y utilizarlos en las funciones del evento. Debe informar a las personas involucradas sobre ese uso y facilitarles este aviso. Soccasion trata la información conforme a las finalidades aquí descritas; esta obligación del Organizador no elimina las que correspondan a la plataforma.</p>
          <p>Las respuestas integradas se facilitan al organizador para gestionar su evento. La lista no es pública: la cuenta propietaria puede verla, exportarla en CSV y eliminar respuestas. El personal autorizado puede tratarla cuando sea necesario para operación, seguridad, atención de derechos o soporte.</p>
          <p>Cada invitado recupera o actualiza su propia respuesta mediante una clave aleatoria guardada en su navegador; el servidor conserva su huella. No se utiliza el nombre como identificador verificado. Si borras el almacenamiento o cambias de dispositivo, puedes perder el acceso a tu respuesta y generar registros duplicados.</p>
          <p>Desactivar el formulario conserva las respuestas ya recibidas. Eliminar una respuesta la retira de la aplicación y de futuras exportaciones; eliminar la invitación elimina sus respuestas. Los CSV descargados permanecen bajo control de quien los descargó. El organizador debe protegerlos y utilizar los datos para las finalidades informadas a sus invitados.</p>
        </>,
      },
      {
        title: "Proveedores, comunicaciones y transferencias",
        body: <>
          <p>Según la función utilizada, intervienen los siguientes proveedores:</p>
          <ul>
            <li><strong>Cloudflare:</strong> alojamiento de esta plataforma, entrega y transformación de nuevas imágenes en R2 e Images y generación de capturas de invitaciones.</li>
            <li><strong>Proveedor de la base PostgreSQL:</strong> almacenamiento de cuentas, eventos, respuestas, referencias de pago y registros operativos. La entidad y región concretas dependen del servicio contratado.</li>
            <li><strong>Cloudinary:</strong> entrega de imágenes antiguas que todavía lo referencian. Las nuevas cargas de esta versión se realizan en Cloudflare.</li>
            <li><strong>Google:</strong> inicio de sesión opcional; Gmail para recibir y atender mensajes enviados al correo de soporte.</li>
            <li><strong>Stripe, PayPal y Mercado Pago:</strong> procesamiento y verificación del pago seleccionado, incluidos reembolsos y disputas. Solo se ofrecen los métodos habilitados.</li>
            <li><strong>Resend:</strong> envío del enlace automático de recuperación cuando esa opción está configurada.</li>
          </ul>
          <p>Los servicios de infraestructura reciben los datos necesarios para sus funciones y pueden tratarlos fuera de México según la contratación. Los proveedores que actúan por cuenta propia, como el de pago o autenticación elegido, aplican también sus avisos. La distinción entre encargos y transferencias depende del servicio y de los acuerdos aplicables.</p>
          <p>No vendemos tus datos. Podemos comunicarlos a autoridades ante requerimientos legales válidos. Cuando una transferencia requiera consentimiento, informaremos destinatario y finalidad y lo solicitaremos antes de realizarla.</p>
          <p>Los botones de soporte y recuperación manual abren un borrador en tu aplicación de correo: debes enviarlo para que el equipo lo reciba.</p>
        </>,
      },
      {
        title: "Enlaces y reproductores de terceros",
        body: <>
          <p>Las invitaciones pueden incluir WhatsApp, mapas, mesas de regalos, enlaces externos o reproductores de Spotify, YouTube, Apple Music y SoundCloud elegidos por el organizador. Los reproductores incrustados pueden conectarse a esos proveedores al cargarse en la página, incluso antes de iniciar la reproducción, y transmitir datos técnicos o utilizar sus propias cookies.</p>
          <p>Al seguir un enlace externo, los datos que proporciones se tratan fuera de Soccasion conforme al aviso del destinatario. Las respuestas de WhatsApp no se guardan como confirmaciones integradas de la plataforma. Consulta las condiciones del servicio externo y la información que facilite el organizador.</p>
        </>,
      },
      {
        title: "Opciones para limitar uso o divulgación",
        body: <>
          <p>Puedes editar o eliminar tu invitación, elegir protección con PIN, cambiarlo y limitar a quién compartes enlace y código. Los invitados pueden pedir al organizador que elimine su respuesta o contactar al responsable para ejercer sus derechos. Estos controles no retiran copias que terceros ya tengan.</p>
          <p>Si consideras que tus datos, tu imagen u otro contenido se han utilizado sin autorización o para una finalidad que no corresponde al evento, puedes reportarlo a <a href={`${LEGAL_OPERATOR.emailHref}?subject=${encodeURIComponent("Reporte de uso indebido de una invitación")}`}>{LEGAL_OPERATOR.email}</a>, aunque no tengas cuenta. Facilita el enlace y una descripción con la información mínima necesaria para revisar el caso. El reporte no sustituye ni condiciona el ejercicio de tus derechos ARCO.</p>
          <p>Para limitar usos adicionales o solicitar información sobre tus datos, escribe a <a href={LEGAL_OPERATOR.emailHref}>{LEGAL_OPERATOR.email}</a>. Puedes impedir la medición con las preferencias de privacidad del navegador descritas más adelante. Rechazar esa medición no impide utilizar el servicio.</p>
        </>,
      },
      {
        title: "Derechos ARCO y revocación del consentimiento",
        body: <>
          <p>Puedes solicitar <strong>Acceso</strong>, <strong>Rectificación</strong>, <strong>Cancelación</strong> u <strong>Oposición</strong> (ARCO), así como revocar tu consentimiento cuando proceda, a <a href={LEGAL_OPERATOR.emailHref}>{LEGAL_OPERATOR.email}</a>, con el asunto “Privacidad / Derechos ARCO”. Incluye:</p>
          <ul>
            <li>Nombre y medio para recibir la respuesta.</li>
            <li>El derecho que solicitas y los datos involucrados; para acceso, puedes solicitar los datos que tratamos sobre ti.</li>
            <li>Información para localizar el registro, por ejemplo correo de cuenta o enlace del evento; para rectificación, la corrección y su sustento.</li>
            <li>Acreditación de identidad y, si corresponde, de la representación. Acordaremos un medio proporcional, evitando documentos o datos innecesarios.</li>
          </ul>
          <p>Comunicaremos la determinación en un máximo de veinte días hábiles desde la recepción y, si procede, la haremos efectiva en los quince días hábiles siguientes a la respuesta. Los plazos pueden ampliarse una sola vez por un periodo igual cuando exista justificación. El acceso podrá entregarse por correo o documento electrónico, previa acreditación de identidad.</p>
          <p>El ejercicio es gratuito, salvo costos de reproducción o envío legalmente permitidos. La cancelación puede requerir bloqueo o conservación por obligaciones legales y reclamaciones. Revocar el consentimiento no afecta tratamientos anteriores legítimos; si impide una función necesaria del servicio, te informaremos sus efectos. Comunicaremos cualquier negativa y su motivo.</p>
        </>,
      },
      {
        title: "Cookies y almacenamiento en el navegador",
        body: <>
          <ul>
            <li><strong>Autenticación:</strong> cookies de sesión y seguridad de Auth.js para mantener el acceso, proteger solicitudes y completar el inicio con Google. Los controles temporales de OAuth utilizados pueden durar hasta quince minutos; la sesión se renueva conforme al uso y puede cerrarse desde la cuenta.</li>
            <li><strong>Acceso con PIN:</strong> una cookie técnica por invitación protegida, con duración máxima de doce horas, que contiene un token de acceso y no el PIN.</li>
            <li><strong>Confirmación integrada:</strong> una clave aleatoria por evento en almacenamiento local, sin caducidad automática del navegador, para recuperar y actualizar tu respuesta.</li>
            <li><strong>Editor y preferencias:</strong> almacenamiento local para recuperar borradores, trasladar cambios a la vista privada y recordar tema visual y ayudas del editor. Las copias de borrador se consideran recuperables durante siete días desde su actualización; las de traslado a la vista privada, durante treinta minutos. Su limpieza ocurre al volver a utilizar las funciones o al borrar los datos del sitio; no equivale a un borrado inmediato del dispositivo al vencer.</li>
            <li><strong>Medición opcional:</strong> un identificador aleatorio en almacenamiento de sesión permite evitar conteos repetidos. El servidor guarda claves derivadas criptográficamente por día para visitas al inicio y selección de ejemplos; no guarda el identificador original, correo ni IP en esos registros ni los vincula con la cuenta para medir visitas.</li>
          </ul>
          <p>Respetamos Do Not Track y Global Privacy Control para no registrar esta medición. También puedes impedirla bloqueando el almacenamiento de sesión. Los registros de medición mayores de noventa días se eliminan en limpiezas periódicas asociadas a nuevas visitas, por lo que su eliminación no es instantánea al alcanzar ese plazo.</p>
          <p>Puedes administrar cookies y almacenamiento desde tu navegador. Bloquear los necesarios puede impedir el acceso, desbloquear invitaciones o recuperar borradores y respuestas. Borrar el navegador no elimina los datos ya guardados en el servidor. Google, los medios de pago y los reproductores externos pueden emplear tecnologías propias al utilizar sus servicios.</p>
        </>,
      },
      {
        title: "Conservación y eliminación",
        body: <>
          <p>Los borradores sin pago confirmado ni cortesía se eliminan automáticamente tras seis meses naturales desde su creación o el último guardado de cambios reales de contenido, diseño o privacidad. Abrirlos o iniciar sesión no reinicia el plazo. El panel muestra la fecha prevista; los recordatorios por correo todavía no están disponibles. Antes de eliminarlos se verifican los pagos pendientes; si la verificación falla, se conservan para reintentar. El resto del contenido de una cuenta se conserva conforme a los plazos aplicables o hasta su eliminación o una solicitud procedente.</p>
          <p>Al vencer una publicación se desactivan el enlace, las respuestas nuevas y la edición. El contenido permanece archivado un mes natural, con renovación manual para compras elegibles. Al concluir sin renovar, el proceso automático elimina el evento y sus respuestas, enlaces y sesiones de acceso. Las imágenes de Cloudflare se encolan para borrado con reintentos; las cargas temporales no utilizadas tienen un plazo de veinticuatro horas antes de quedar disponibles para limpieza.</p>
          <p>El borrado de imágenes depende del procesamiento y de referencias todavía utilizadas por otras invitaciones. La limpieza actual no elimina automáticamente archivos históricos de Cloudinary; su retiro debe gestionarse por separado. La eliminación no alcanza capturas, mensajes, CSV ni otras copias conservadas por destinatarios.</p>
          <p>El historial de compras se conserva independientemente de la invitación o de la cuenta para aclaraciones, reembolsos, disputas y obligaciones legales. Los mensajes de soporte, registros administrativos, técnicos y respaldos pueden tener conservación distinta. No se les aplica automáticamente el mes de archivo del evento ni existe en esta versión una purga automática general de esas categorías. Puedes solicitar información o su cancelación cuando proceda por los canales indicados.</p>
          <p>El cierre de cuenta se solicita a soporte y se tramita con verificación de identidad y los plazos legales correspondientes. No prometemos un borrado instantáneo de sistemas o respaldos ni un plazo adicional que retrase el ejercicio de tus derechos.</p>
        </>,
      },
      {
        title: "Medidas de seguridad",
        body: <p>Las contraseñas y PIN se guardan mediante hash, y los tokens de recuperación o acceso mediante huellas criptográficas. Aplicamos controles de sesión, propiedad de eventos y límites contra abuso. El restablecimiento de contraseña invalida las sesiones anteriores. El acceso del personal debe limitarse a sus funciones de operación, seguridad, atención de derechos y soporte. Ningún sistema garantiza seguridad absoluta; si ocurre una vulneración que afecte significativamente tus derechos, te informaremos en los términos legales aplicables.</p>,
      },
      {
        title: "Cambios al aviso",
        body: <p>La versión vigente estará disponible en esta página con su fecha. Los cambios relevantes se comunicarán por el correo registrado o mediante un aviso visible en el sitio. Cuando una nueva finalidad o transferencia requiera consentimiento, lo solicitaremos antes del tratamiento correspondiente.</p>,
      },
      {
        title: "Autoridad y legislación de protección de datos",
        body: <p>Este aviso se refiere a la <a href="https://www.diputados.gob.mx/LeyesBiblio/pdf/LFPDPPP.pdf" target="_blank" rel="noreferrer">Ley Federal de Protección de Datos Personales en Posesión de los Particulares</a>. Si consideras vulnerados tus derechos, puedes acudir a la Secretaría Anticorrupción y Buen Gobierno mediante sus <a href="https://www.gob.mx/buengobierno" target="_blank" rel="noreferrer">canales oficiales</a>, sin perjuicio de otros medios legales.</p>,
      },
    ]}
  />;
}

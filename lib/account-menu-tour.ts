import type { DriveStep } from "driver.js";

export function accountMenuTourSteps(): DriveStep[] {
  const step = (element: string, title: string, description: string): DriveStep => ({ element, popover: { title, description, side: 'left', align: 'center' } });
  return [
    step('[data-account-tour="invitations"]', 'Mis invitaciones', 'Aquí encuentras las invitaciones que has creado. Puedes continuar un borrador, editar su información, cambiar el diseño o compartir las que ya publicaste.'),
    step('[data-account-tour="purchases"]', 'Mis compras', 'Consulta tus pagos y el estado de tus compras. Aquí puedes revisar los detalles de cada operación.'),
    step('[data-account-tour="settings"]', 'Ajustes de tu cuenta', 'Aquí puedes revisar y administrar tu cuenta. Los datos y el diseño de cada invitación se editan desde Mis invitaciones.'),
    step('[data-account-tour="help"]', 'Ayuda y soporte', 'Encuentra respuestas a las preguntas frecuentes y las opciones para pedir ayuda cuando tengas un problema.'),
    step('.dashboard-account-signout', 'Cerrar sesión', 'Usa esta opción cuando termines, especialmente si compartes el dispositivo. Tus invitaciones guardadas seguirán en tu cuenta. Puedes repetir esta guía desde «Conocer este menú».'),
  ];
}

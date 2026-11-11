import { FiArrowRight } from "react-icons/fi";
import { startCheckout } from "@/app/dashboard/eventos/[id]/pago/actions";
import styles from "@/app/dashboard/eventos/[id]/pago/payment.module.css";

export function PaymentMethods({ eventId, providers, oxxo, renewal = false }: {
  eventId: string; providers: { stripe: boolean; paypal: boolean; mercadopago: boolean }; oxxo: boolean; renewal?: boolean;
}) {
  return <form action={startCheckout.bind(null, eventId)}>
    <fieldset className={styles.methods}>
      <legend>Elige cómo {renewal ? "renovar" : "pagar"}</legend>
      {providers.stripe && <button className={styles.primary} name="provider" value="stripe" type="submit">Tarjeta{oxxo ? " u OXXO" : ""} con Stripe <FiArrowRight aria-hidden="true" /></button>}
      {providers.paypal && <button className={styles.primary} name="provider" value="paypal" type="submit">PayPal <FiArrowRight aria-hidden="true" /></button>}
      {providers.mercadopago && <button className={styles.primary} name="provider" value="mercadopago" type="submit">Mercado Pago <FiArrowRight aria-hidden="true" /></button>}
    </fieldset>
    <small>Continuarás en la página segura del proveedor que elijas.</small>
    {oxxo && providers.stripe && <p className={styles.notice}>Para pagar en efectivo, elige OXXO dentro de Stripe. Tu ficha vence en 1 día. Publicaremos tu invitación cuando se confirme el depósito; puede tardar hasta el siguiente día hábil. Si ya pagaste, espera la confirmación antes de iniciar otro pago.</p>}
  </form>;
}

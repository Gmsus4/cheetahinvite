import { SiMercadopago, SiPaypal, SiStripe } from "react-icons/si";
import { startCheckout } from "@/app/dashboard/eventos/[id]/pago/actions";
import styles from "@/app/dashboard/eventos/[id]/pago/payment.module.css";

export function PaymentMethods({ eventId, providers, oxxo, renewal = false }: {
  eventId: string; providers: { stripe: boolean; paypal: boolean; mercadopago: boolean }; oxxo: boolean; renewal?: boolean;
}) {
  return <form action={startCheckout.bind(null, eventId)}>
    <fieldset className={styles.methods}>
      <legend>Elige cómo {renewal ? "renovar" : "pagar"}</legend>
      {providers.stripe && <button className={`${styles.primary} ${styles.providerButton}`} name="provider" value="stripe" type="submit"><SiStripe aria-hidden="true" /><span>Tarjeta{oxxo ? " u OXXO" : ""} con Stripe</span></button>}
      {providers.paypal && <button className={`${styles.primary} ${styles.providerButton}`} name="provider" value="paypal" type="submit"><SiPaypal aria-hidden="true" /><span>PayPal</span></button>}
      {providers.mercadopago && <button className={`${styles.primary} ${styles.providerButton}`} name="provider" value="mercadopago" type="submit"><SiMercadopago aria-hidden="true" /><span>Mercado Pago</span></button>}
    </fieldset>
    <small>Continuarás en la página segura del proveedor que elijas.</small>
    {oxxo && providers.stripe && <p className={styles.notice}>Para pagar en efectivo, elige OXXO dentro de Stripe. Tu ficha vence en 1 día. Publicaremos tu invitación cuando se confirme el depósito; puede tardar hasta el siguiente día hábil. Si ya pagaste, espera la confirmación antes de iniciar otro pago.</p>}
  </form>;
}

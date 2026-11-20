"use client";

import { useFormStatus } from "react-dom";
import { FiCreditCard } from "react-icons/fi";
import { SiMercadopago, SiPaypal } from "react-icons/si";
import { startCheckout } from "@/app/dashboard/eventos/[id]/pago/actions";
import styles from "@/app/dashboard/eventos/[id]/pago/payment.module.css";

type PaymentMethodsProps = {
  eventId: string;
  providers: { stripe: boolean; paypal: boolean; mercadopago: boolean };
  oxxo: boolean;
  renewal?: boolean;
};

function CheckoutFields({ providers, oxxo, renewal }: Omit<PaymentMethodsProps, "eventId">) {
  const { pending } = useFormStatus();
  const options = [
    { id: "stripe", title: oxxo ? "Tarjeta u OXXO" : "Tarjeta de crédito o débito", description: oxxo ? "Procesado por Stripe · Efectivo en OXXO" : "Procesado por Stripe", icon: FiCreditCard },
    { id: "paypal", title: "PayPal", description: "Continúa con tu cuenta de PayPal", icon: SiPaypal },
    { id: "mercadopago", title: "Mercado Pago", description: "Continúa con Mercado Pago", icon: SiMercadopago },
  ] as const;
  const available = options.filter((option) => providers[option.id]);

  return <>
    <fieldset className={styles.methods} disabled={pending}>
      <legend>Elige cómo {renewal ? "renovar" : "pagar"}</legend>
      {available.map(({ id, title, description, icon: Icon }, index) => <label className={styles.providerOption} key={id}>
        <input type="radio" name="provider" value={id} defaultChecked={index === 0} required />
        <span className={styles.providerLogo} data-provider={id}><Icon aria-hidden="true" /></span>
        <span className={styles.providerCopy}><strong>{title}</strong><span>{description}</span></span>
      </label>)}
    </fieldset>
    <button className={`${styles.primary} ${styles.checkoutButton}`} type="submit" disabled={pending || !available.length}>
      {pending ? "Abriendo pago seguro…" : "Continuar al pago"}
    </button>
    <span className={styles.checkoutHint} role="status">{pending ? "Estamos preparando tu pago. Espera un momento." : "Continuarás en la página segura del proveedor que elijas."}</span>
    {oxxo && providers.stripe && <p className={styles.notice}>Para pagar en efectivo, elige OXXO dentro de Stripe. Tu ficha vence en 1 día. Publicaremos tu invitación cuando se confirme el depósito; puede tardar hasta el siguiente día hábil. Si ya pagaste, espera la confirmación antes de iniciar otro pago.</p>}
  </>;
}

export function PaymentMethods({ eventId, ...props }: PaymentMethodsProps) {
  return <form className={styles.paymentForm} action={startCheckout.bind(null, eventId)}>
    <CheckoutFields {...props} />
  </form>;
}

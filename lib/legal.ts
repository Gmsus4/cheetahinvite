import { SUPPORT_EMAIL } from "@/lib/support";

export const LEGAL_UPDATED_AT = "18 de noviembre de 2026";

// Complete with the operator's actual address; never infer it from contact data.
export const LEGAL_OPERATOR = {
  name: "Fernando Gómez Montes",
  address: "[PENDIENTE: domicilio completo del responsable en México]",
  email: SUPPORT_EMAIL,
  emailHref: `mailto:${SUPPORT_EMAIL}`,
  phone: "33 5141 5751",
  phoneHref: "tel:+523351415751",
} as const;

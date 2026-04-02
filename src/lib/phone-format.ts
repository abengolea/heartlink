/**
 * Formatea números de teléfono para Argentina (WhatsApp).
 * Normaliza a E.164 móvil AR: 549 + código de área + abonado.
 */

/** Solo dígitos (y quita 0 inicial que puede venir de vCards) */
export function toDigits(phone: string): string {
  return (phone ?? "").replace(/\D/g, "").replace(/^0+/, "");
}

/** Prefijos de país explícitos distintos de Argentina (sin +) — no se les antepone 54 ni el 9 AR. */
const NON_AR_COUNTRY_PREFIXES = [
  "598",
  "595",
  "591",
  "56",
  "55",
  "51",
  "593",
  "57",
  "58",
  "52",
  "34",
  "506",
  "507",
  "53",
  "39",
  "49",
  "33",
  "44",
];

function hasNonArgentinaCountryCode(digits: string): boolean {
  if (digits.startsWith("1") && digits.length >= 11) return true; // NANP +1...
  return NON_AR_COUNTRY_PREFIXES.some(
    (p) => digits.startsWith(p) && digits.length >= p.length + 6
  );
}

/**
 * Parte nacional (sin 54): si falta el 9 móvil típico, lo agrega.
 * Celular ARG suele guardarse como código de área + número (10 dígitos) o ya con 9 adelante (11).
 */
export function applyArgentinaNationalMobileNine(nationalDigits: string): string {
  const n = nationalDigits.replace(/\D/g, "");
  if (!n) return n;
  if (n.startsWith("9")) return n;
  if (n.length >= 10 && n.length <= 11) return `9${n}`;
  return n;
}

/**
 * Tras asegurar prefijo 54, garantiza 549… para celular WhatsApp (inserta 9 si falta).
 */
function ensureArgentinaNineAfterCountry(digits: string): string {
  if (!digits.startsWith("54")) return digits;
  if (digits.startsWith("549")) return digits;
  const national = digits.slice(2);
  if (!national) return digits;
  if (national.startsWith("9")) return `54${national}`;
  if (national.length >= 10 && national.length <= 11) {
    return `549${national}`;
  }
  return digits;
}

/**
 * Normaliza a formato WhatsApp (solo dígitos).
 * Argentina: agrega 54 si falta y el 9 móvil si el usuario cargó solo área + número.
 * Otros países con prefijo explícito se dejan como vienen (solo toDigits).
 */
export function toWhatsAppFormat(phone: string): string {
  let digits = toDigits(phone);
  if (!digits || digits.length < 8) return digits;

  if (hasNonArgentinaCountryCode(digits)) {
    return digits;
  }

  if (!digits.startsWith("54")) {
    if (digits.startsWith("9") && digits.length >= 10) {
      digits = `54${digits}`;
    } else {
      digits = `54${digits}`;
    }
  }

  return ensureArgentinaNineAfterCountry(digits);
}

/**
 * Formato legible en UI. Argentina móvil WhatsApp: +54 9 XXX XXX-XXXX.
 */
export function toDisplayFormat(phone: string): string {
  let digits = toWhatsAppFormat(phone);
  if (!digits || digits.length < 12) return phone?.trim() || "";

  if (digits.startsWith("549") && digits.length === 13) {
    return `+54 9 ${digits.slice(3, 6)} ${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 8)}-${digits.slice(8)}`;
  }
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}-${digits.slice(8)}`;
}

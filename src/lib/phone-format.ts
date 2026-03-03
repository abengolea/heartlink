/**
 * Formatea números de teléfono para Argentina (WhatsApp).
 * Asegura formato +54 9 XXX XXX XXXX para evitar errores.
 */

/** Solo dígitos (y quita 0 inicial que puede venir de vCards) */
export function toDigits(phone: string): string {
  return (phone ?? '').replace(/\D/g, '').replace(/^0+/, '');
}

/**
 * Normaliza a formato WhatsApp: solo dígitos, con 54 si falta.
 * NO inserta el 9 automáticamente: los números 543364645357 y 5493364645357
 * se respetan tal cual (el 9 automático causaba que no llegaran mensajes).
 */
export function toWhatsAppFormat(phone: string): string {
  let digits = toDigits(phone);
  if (!digits || digits.length < 10) return digits;
  if (digits.startsWith('54')) return digits;
  if (digits.startsWith('9') && digits.length >= 10) return '54' + digits;
  if (digits.startsWith('11') || digits.startsWith('351') || digits.startsWith('3364') || digits.startsWith('336')) {
    return '54' + digits;
  }
  return '54' + digits;
}

/**
 * Formato para mostrar en UI. Argentina: +54 3364 62-9595 (sin el 9 que causaba problemas).
 * Si viene 549... lo muestra como 54... para el formato que funciona al enviar.
 */
export function toDisplayFormat(phone: string): string {
  let digits = toWhatsAppFormat(phone);
  if (!digits || digits.length < 12) return phone?.trim() || '';
  if (digits.startsWith('549') && digits.length === 13) {
    digits = '54' + digits.slice(3);
  }
  if (digits.length === 14 && digits.startsWith('545')) {
    digits = '54' + digits.slice(3);
  }
  if (digits.length === 12) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 8)}-${digits.slice(8)}`;
  }
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)}-${digits.slice(8)}`;
}

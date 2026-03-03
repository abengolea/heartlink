/**
 * Formatea números de teléfono para Argentina (WhatsApp).
 * Asegura formato +54 9 XXX XXX XXXX para evitar errores.
 */

/** Solo dígitos */
export function toDigits(phone: string): string {
  return (phone ?? '').replace(/\D/g, '');
}

/**
 * Normaliza a formato WhatsApp Argentina: 549XXXXXXXXX
 * Si el número no tiene código de país, asume Argentina (+54)
 * Asegura el 9 después de 54 para celulares (requerido por WhatsApp).
 */
export function toWhatsAppFormat(phone: string): string {
  let digits = toDigits(phone);
  if (!digits || digits.length < 10) return digits;
  // Argentina: si empieza con 9 (celular) o 11/351/336 (código área), agregar 54
  if (digits.startsWith('54')) {
    // Celulares deben ser 54 9 XXX... Si viene 54XXX sin 9, insertar 9 (ej: 543364259444 → 5493364259444)
    if (digits.length >= 12 && digits[2] !== '9') {
      return '549' + digits.slice(2);
    }
    return digits;
  }
  if (digits.startsWith('9') && digits.length >= 10) return '54' + digits;
  if (digits.startsWith('11') || digits.startsWith('351') || digits.startsWith('3364') || digits.startsWith('336')) {
    return '549' + digits;
  }
  return '54' + digits;
}

/**
 * Formato para mostrar en UI: +54 9 XXX XXX XXXX (Argentina)
 */
export function toDisplayFormat(phone: string): string {
  const digits = toWhatsAppFormat(phone);
  if (!digits || digits.length < 12) return phone?.trim() || '';
  // +54 9 XXX XXX XXXX (12+ dígitos: 54 + 9 + 9 dígitos)
  return `+${digits.slice(0, 2)} ${digits.slice(2, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}-${digits.slice(9)}`;
}

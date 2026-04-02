/**
 * Normaliza valores de env pegados con CRLF Windows, BOM o espacios
 * (p. ej. Secret Manager / .env) para que no rompan URLs ni el SDK de Firebase.
 */
export function sanitizeFirebaseEnvString(value: string | undefined): string | undefined {
  if (value == null) return undefined;
  const s = value.replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
  return s === '' ? undefined : s;
}

// Constantes compartidas para validación de uploads
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm', 
  'video/avi',
  'video/mov',
  'video/quicktime',
  'video/x-msvideo'
];

export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (aumentado de 50MB)

export const UPLOAD_CONFIG = {
  SIGNED_URL_EXPIRY: 15 * 60 * 1000, // 15 minutos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // 1 segundo base
};

export const getUploadErrorMessage = (status: number, error: string) => {
  switch (status) {
    case 403: 
      return "Sin permisos para subir archivos. Contacta al administrador.";
    case 413: 
      return "El archivo es demasiado grande. Máximo permitido: 100MB.";
    case 415: 
      return "Tipo de archivo no soportado. Solo se permiten videos MP4, WEBM, AVI, MOV.";
    case 422:
      return "El archivo está corrupto o no es válido.";
    case 429:
      return "Demasiadas solicitudes. Espera un momento e intenta de nuevo.";
    case 500:
      return "Error del servidor. Intenta de nuevo en unos minutos.";
    case 503:
      return "Servicio temporalmente no disponible. Intenta más tarde.";
    default: 
      return `Error de subida (${status}): ${error}`;
  }
};
/**
 * Solo para uso en el navegador (componentes cliente).
 * Obtiene la duración en segundos a partir del archivo de video.
 */
export function probeVideoDurationSeconds(
  file: File,
  timeoutMs = 25000
): Promise<number> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('probeVideoDurationSeconds requires a browser'));
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, timeoutMs);

    const finish = (fn: () => void) => {
      window.clearTimeout(timer);
      fn();
    };

    video.onloadedmetadata = () => {
      finish(() => {
        const d = video.duration;
        cleanup();
        if (!Number.isFinite(d) || d <= 0) {
          reject(new Error('invalid duration'));
          return;
        }
        resolve(d);
      });
    };

    video.onerror = () => {
      finish(() => {
        cleanup();
        reject(new Error('video load error'));
      });
    };

    video.src = url;
  });
}

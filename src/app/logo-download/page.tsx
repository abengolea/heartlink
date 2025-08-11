'use client';

import { useEffect, useRef, useState } from 'react';

export default function LogoDownloadPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');

  useEffect(() => {
    const generateLogo = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Configurar canvas 512x512
      canvas.width = 512;
      canvas.height = 512;

      // Fondo blanco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);

      // Configurar estilos
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Dibujar el corazón (HeartPulse icon simulado)
      const centerX = 256;
      const centerY = 200;
      
      // Corazón rojo
      ctx.fillStyle = '#ef4444'; // Color rojo
      ctx.font = 'bold 120px Arial';
      ctx.fillText('♥', centerX, centerY);

      // Agregar línea de pulso (simulando HeartPulse)
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(180, centerY + 20);
      ctx.lineTo(200, centerY + 20);
      ctx.lineTo(210, centerY - 10);
      ctx.lineTo(220, centerY + 40);
      ctx.lineTo(230, centerY - 20);
      ctx.lineTo(240, centerY + 20);
      ctx.lineTo(260, centerY + 20);
      ctx.moveTo(280, centerY + 20);
      ctx.lineTo(300, centerY + 20);
      ctx.lineTo(310, centerY - 10);
      ctx.lineTo(320, centerY + 30);
      ctx.lineTo(330, centerY + 20);
      ctx.stroke();

      // Texto "HeartLink"
      ctx.fillStyle = '#1f2937'; // Color gris oscuro
      ctx.font = 'bold 48px Arial';
      ctx.fillText('HeartLink', centerX, centerY + 120);

      // Subtítulo
      ctx.fillStyle = '#6b7280'; // Color gris más claro
      ctx.font = '24px Arial';
      ctx.fillText('Sistema de Estudios Médicos', centerX, centerY + 170);

      // Convertir a data URL
      const dataUrl = canvas.toDataURL('image/png');
      setLogoDataUrl(dataUrl);
    };

    generateLogo();
  }, []);

  const downloadLogo = () => {
    if (!logoDataUrl) return;

    const link = document.createElement('a');
    link.download = 'heartlink-logo-512x512.png';
    link.href = logoDataUrl;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🏥 Logo HeartLink - Descarga 512x512
        </h1>
        
        <div className="mb-8">
          <canvas
            ref={canvasRef}
            className="border border-gray-300 rounded-lg mx-auto"
            style={{ maxWidth: '300px', maxHeight: '300px' }}
          />
        </div>

        {logoDataUrl && (
          <div className="space-y-4">
            <button
              onClick={downloadLogo}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              📥 Descargar Logo 512x512 PNG
            </button>
            
            <p className="text-gray-600 text-sm">
              Logo oficial de HeartLink en formato PNG 512x512px
            </p>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Especificaciones:</h3>
          <ul className="text-sm text-gray-600 text-left">
            <li>• Tamaño: 512x512 píxeles</li>
            <li>• Formato: PNG con fondo transparente</li>
            <li>• Colores: Corazón rojo (#ef4444) + texto gris</li>
            <li>• Ideal para: Iconos de aplicación, Meta Developer Console</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
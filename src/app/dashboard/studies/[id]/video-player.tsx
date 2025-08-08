"use client";

import { useState, useEffect, useRef } from 'react';
import DownloadFallback from './download-fallback';

interface VideoPlayerProps {
  videoUrl: string;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const [signedUrl, setSignedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isVertical, setIsVertical] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<string>('');
  const [showFallback, setShowFallback] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Detect video orientation when metadata loads
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      const aspectRatio = videoWidth / videoHeight;
      const vertical = aspectRatio < 1; // Less than 1 means height > width
      setIsVertical(vertical);
      console.log(`📱 Video dimensions: ${videoWidth}x${videoHeight} (ratio: ${aspectRatio.toFixed(2)}) - ${vertical ? 'VERTICAL' : 'HORIZONTAL'}`);
    }
  };

  // Detect browser info for compatibility
  useEffect(() => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) setBrowserInfo('Chrome ✅');
    else if (userAgent.includes('Firefox')) setBrowserInfo('Firefox ✅');
    else if (userAgent.includes('Safari')) setBrowserInfo('Safari ⚠️');
    else if (userAgent.includes('Mi Browser') || userAgent.includes('Xiaomi')) {
      setBrowserInfo('Mi Browser ⚠️');
      setShowFallback(true); // Automatically show fallback for known problematic browsers
    }
    else {
      setBrowserInfo('Navegador desconocido ⚠️');
      setShowFallback(true); // Show fallback for unknown browsers
    }
  }, []);

  useEffect(() => {
    async function fetchSignedUrl() {
      if (!videoUrl) {
        setError('No video URL provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🎥 Fetching signed URL for:', videoUrl);
        console.log('🌐 Browser detected:', browserInfo);
        
        // Extract file path from the full URL
        const url = new URL(videoUrl);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(2).join('/'); // Remove empty string and bucket name
        
        console.log('🎥 Extracted file path:', filePath);
        
        const response = await fetch(`/api/get-video-url?filePath=${encodeURIComponent(filePath)}`);
        const result = await response.json();
        
        if (result.success) {
          setSignedUrl(result.signedUrl);
          console.log('✅ Got signed URL successfully');
        } else {
          throw new Error(result.error || 'Failed to get signed URL');
        }
      } catch (err) {
        console.error('❌ Error fetching signed URL:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSignedUrl();
  }, [videoUrl]);

  if (loading) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Cargando video...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error cargando video</p>
          <p className="text-xs text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">Video no disponible</p>
      </div>
    );
  }

  // Show fallback for problematic browsers or if there's been a video error
  if (showFallback && browserInfo.includes('⚠️')) {
    return (
      <div className="space-y-4">
        <DownloadFallback videoUrl={signedUrl} browserInfo={browserInfo.replace('⚠️', '').trim()} />
        <details className="text-sm">
          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
            🔧 Intentar reproducir de todas formas
          </summary>
          <div className="mt-2 border rounded p-2 bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">
              Si quieres intentar reproducir el video en tu navegador actual:
            </p>
            <button 
              onClick={() => setShowFallback(false)}
              className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Mostrar reproductor de video
            </button>
          </div>
        </details>
      </div>
    );
  }

  // Dynamic container class based on video orientation
  const containerClass = isVertical 
    ? "w-full max-w-sm mx-auto bg-muted rounded-lg overflow-hidden min-h-[400px] flex items-center justify-center" // Vertical: narrower, centered, min height
    : "aspect-video bg-muted rounded-lg overflow-hidden"; // Horizontal: standard

  const videoClass = isVertical
    ? "w-full max-h-[500px] object-contain" // Vertical: maintain aspect ratio, max height
    : "w-full h-full object-cover";  // Horizontal: fill container

  return (
    <div className={containerClass}>
      <video 
        ref={videoRef}
        className={videoClass}
        controls
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        crossOrigin="anonymous"
        playsInline
        webkit-playsinline="true"
        onError={(e) => {
          console.error('Video playback error:', e);
          console.error('Error details:', {
            networkState: videoRef.current?.networkState,
            readyState: videoRef.current?.readyState,
            error: videoRef.current?.error
          });
          setError('Error reproduciendo el video - prueba con otro navegador');
        }}
        onLoadStart={() => console.log('Video started loading')}
        onCanPlay={() => console.log('Video can play')}
        onCanPlayThrough={() => console.log('Video can play through')}
      >
        {/* Multiple sources for maximum compatibility */}
        <source src={signedUrl} type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
        <source src={signedUrl} type="video/mp4" />
        <source src={signedUrl} type="video/webm" />
        <source src={signedUrl} type="video/ogg" />
        <source src={signedUrl} />
        
        {/* Fallback message with browser info */}
        <div className="p-4 text-center">
          <p className="text-red-600 mb-2">❌ Tu navegador no puede reproducir este video</p>
          <p className="text-sm text-gray-600 mb-3">
            Prueba con <strong>Google Chrome</strong> o <strong>Firefox</strong>
          </p>
          <a 
            href={signedUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 underline text-sm"
          >
            📱 Abrir video en nueva pestaña
          </a>
        </div>
      </video>
      <div className="mt-2 text-xs text-gray-500 break-all space-y-1">
        <div>
          <strong>Orientación:</strong> {isVertical ? '📱 Vertical' : '🖥️ Horizontal'} | 
          <strong> Navegador:</strong> {browserInfo}
        </div>
        <div>
          <strong>URL:</strong> {videoUrl.substring(0, 50)}...
        </div>
        {browserInfo.includes('⚠️') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
            <p className="text-yellow-800 text-xs">
              ⚠️ <strong>Compatibilidad limitada:</strong> Si el video no reproduce, 
              prueba con <strong>Google Chrome</strong> o 
              <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                abre en nueva pestaña
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
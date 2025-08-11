'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

interface VideoThumbnailProps {
  videoUrl: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  timePosition?: number; // En segundos, default 1
}

// Cache simple para thumbnails generados
const thumbnailCache = new Map<string, string>();

export function VideoThumbnail({ 
  videoUrl, 
  alt, 
  className = '', 
  width = 600, 
  height = 400,
  timePosition = 1 
}: VideoThumbnailProps) {
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!videoUrl) {
      setIsLoading(false);
      setError('No video URL provided');
      return;
    }

    // Verificar cache primero
    const cacheKey = `${videoUrl}-${width}x${height}-${timePosition}`;
    const cached = thumbnailCache.get(cacheKey);
    if (cached) {
      console.log('📦 [VideoThumbnail] Using cached thumbnail for:', videoUrl);
      setThumbnailDataUrl(cached);
      setIsLoading(false);
      return;
    }

    console.log('🎬 [VideoThumbnail] Generating thumbnail for:', videoUrl);

    // Timeout de 15 segundos
    timeoutRef.current = setTimeout(() => {
      console.error('⏰ [VideoThumbnail] Timeout loading video:', videoUrl);
      setError('Timeout loading video');
      setIsLoading(false);
    }, 15000);

    const generateThumbnail = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) {
        console.error('❌ [VideoThumbnail] Missing video or canvas element');
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        console.error('❌ [VideoThumbnail] Cannot get canvas context');
        return;
      }

      try {
        // Verificar que el video tenga dimensiones válidas
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          console.error('❌ [VideoThumbnail] Video has invalid dimensions:', video.videoWidth, 'x', video.videoHeight);
          setError('Invalid video dimensions');
          setIsLoading(false);
          return;
        }

        console.log('📐 [VideoThumbnail] Video dimensions:', video.videoWidth, 'x', video.videoHeight);

        // Configurar el canvas con las dimensiones del thumbnail
        canvas.width = width;
        canvas.height = height;

        // Calcular dimensiones para mantener aspect ratio
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = width / height;

        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (videoAspect > canvasAspect) {
          // Video es más ancho, ajustar por altura
          drawHeight = height;
          drawWidth = height * videoAspect;
          offsetX = (width - drawWidth) / 2;
        } else {
          // Video es más alto, ajustar por ancho
          drawWidth = width;
          drawHeight = width / videoAspect;
          offsetY = (height - drawHeight) / 2;
        }

        // Limpiar canvas con fondo negro
        context.fillStyle = '#000000';
        context.fillRect(0, 0, width, height);

        // Dibujar el frame del video
        context.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);

        // Convertir a data URL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        
        // Guardar en cache
        thumbnailCache.set(cacheKey, dataUrl);
        
        setThumbnailDataUrl(dataUrl);
        setIsLoading(false);
        
        // Limpiar timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        console.log('✅ [VideoThumbnail] Thumbnail generated successfully for:', videoUrl);
      } catch (err) {
        console.error('❌ [VideoThumbnail] Error drawing to canvas:', err);
        setError('Error generating thumbnail');
        setIsLoading(false);
      }
    };

    const handleVideoLoad = () => {
      const video = videoRef.current;
      if (!video) return;

      console.log('🎬 [VideoThumbnail] Video loaded, duration:', video.duration);
      console.log('📐 [VideoThumbnail] Video ready state:', video.readyState);
      
      if (video.duration && video.duration > 0) {
        // Buscar a la posición específica del video
        const targetTime = Math.min(timePosition, video.duration);
        video.currentTime = targetTime;
        console.log('🕐 [VideoThumbnail] Seeking to time:', targetTime);
      } else {
        console.log('⚠️ [VideoThumbnail] Video duration is 0 or invalid, trying to generate thumbnail anyway');
        setTimeout(generateThumbnail, 500);
      }
    };

    const handleSeeked = () => {
      console.log('🎯 [VideoThumbnail] Video seeked, generating thumbnail...');
      // Dar un pequeño delay para asegurar que el frame esté listo
      setTimeout(generateThumbnail, 300);
    };

    const handleCanPlay = () => {
      console.log('▶️ [VideoThumbnail] Video can play, ready state:', videoRef.current?.readyState);
    };

    const handleLoadedData = () => {
      console.log('📊 [VideoThumbnail] Video data loaded');
    };

    const handleError = (e: any) => {
      console.error('❌ [VideoThumbnail] Video error:', e);
      console.error('❌ [VideoThumbnail] Video element error:', videoRef.current?.error);
      setError('Error loading video');
      setIsLoading(false);
      
      // Limpiar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', handleVideoLoad);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);
      video.addEventListener('canplay', handleCanPlay);

      // Configurar atributos del video
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      
      // Cargar el video
      console.log('🔄 [VideoThumbnail] Loading video:', videoUrl);
      video.src = videoUrl;

      return () => {
        video.removeEventListener('loadedmetadata', handleVideoLoad);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
        video.removeEventListener('canplay', handleCanPlay);
        
        // Limpiar timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };
    }
  }, [videoUrl, width, height, timePosition]);

  if (error) {
    return (
      <div 
        className={`bg-red-100 border border-red-300 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-red-600">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm px-2">{error}</div>
        </div>
      </div>
    );
  }

  if (isLoading || !thumbnailDataUrl) {
    return (
      <div 
        className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center animate-pulse ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-400">
          <div className="text-2xl mb-2 animate-bounce">🎬</div>
          <div className="text-sm">Generando thumbnail...</div>
          <div className="text-xs mt-1 opacity-60">Procesando video</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden video and canvas for thumbnail generation */}
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        muted
        playsInline
        crossOrigin="anonymous"
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      
      {/* Actual thumbnail image */}
      <Image
        src={thumbnailDataUrl}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority
        unoptimized // Para data URLs
      />
    </>
  );
}
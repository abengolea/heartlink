"use client";

import { useState, useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const [signedUrl, setSignedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isVertical, setIsVertical] = useState(false);
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

  useEffect(() => {
    async function fetchSignedUrl() {
      if (!videoUrl) {
        setError('No video URL provided');
        setLoading(false);
        return;
      }

      try {
        console.log('🎥 Fetching signed URL for:', videoUrl);
        
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
        onError={(e) => {
          console.error('Video playback error:', e);
          setError('Error reproduciendo el video');
        }}
        onLoadStart={() => console.log('Video started loading')}
      >
        <source src={signedUrl} type="video/mp4" />
        <source src={signedUrl} type="video/webm" />
        Tu navegador no soporta el elemento video.
      </video>
      <div className="mt-2 text-xs text-gray-500 break-all">
        <strong>Orientación:</strong> {isVertical ? '📱 Vertical' : '🖥️ Horizontal'} | 
        <strong> URL:</strong> {videoUrl.substring(0, 50)}...
      </div>
    </div>
  );
}
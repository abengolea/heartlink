"use client";

import { useState, useEffect } from 'react';

interface VideoPlayerProps {
  videoUrl: string;
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const [signedUrl, setSignedUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

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

  return (
    <div className="aspect-video bg-muted rounded-lg overflow-hidden">
      <video 
        className="w-full h-full object-cover"
        controls
        preload="metadata"
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
        <strong>Original URL:</strong> {videoUrl}
      </div>
    </div>
  );
}
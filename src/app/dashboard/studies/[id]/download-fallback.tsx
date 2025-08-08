"use client";

import { Download, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DownloadFallbackProps {
  videoUrl: string;
  browserInfo: string;
}

export default function DownloadFallback({ videoUrl, browserInfo }: DownloadFallbackProps) {
  const handleDownload = () => {
    // Create a download link
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = 'video_estudio.mp4';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(videoUrl, '_blank');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mb-2">
          <AlertCircle className="h-6 w-6 text-yellow-600" />
        </div>
        <CardTitle className="text-lg">Video no compatible</CardTitle>
        <CardDescription>
          Tu navegador ({browserInfo}) no puede reproducir este video directamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 text-sm mb-2">📱 Soluciones recomendadas:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Usar <strong>Google Chrome</strong> o <strong>Firefox</strong></li>
            <li>• Descargar el video para verlo localmente</li>
            <li>• Abrir en una nueva pestaña</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleDownload} className="w-full" variant="default">
            <Download className="mr-2 h-4 w-4" />
            Descargar Video
          </Button>
          
          <Button onClick={handleOpenNewTab} className="w-full" variant="outline">
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir en Nueva Pestaña
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          <p>💡 <strong>Tip:</strong> En Chrome o Firefox el video se reproducirá directamente en esta página</p>
        </div>
      </CardContent>
    </Card>
  );
}
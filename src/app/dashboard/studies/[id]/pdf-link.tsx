"use client";

import { useState, useEffect } from "react";
import { FileText, Loader2 } from "lucide-react";

interface PdfLinkProps {
  reportUrl: string;
}

export default function PdfLink({ reportUrl }: PdfLinkProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchSignedUrl() {
      if (!reportUrl) {
        setLoading(false);
        return;
      }
      try {
        const url = new URL(reportUrl);
        const pathParts = url.pathname.split("/");
        const filePath = pathParts.slice(2).join("/");
        const response = await fetch(`/api/get-video-url?filePath=${encodeURIComponent(filePath)}`);
        const result = await response.json();
        if (result.success) {
          setSignedUrl(result.signedUrl);
        } else {
          throw new Error(result.error || "Error al obtener enlace");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setLoading(false);
      }
    }
    fetchSignedUrl();
  }, [reportUrl]);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando enlace...
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className="text-sm text-destructive">
        {error || "No se pudo cargar el PDF"}
      </div>
    );
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
    >
      <FileText className="h-4 w-4" />
      Ver o descargar PDF
    </a>
  );
}

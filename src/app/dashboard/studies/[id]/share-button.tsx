"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { LinkIcon, Check, Copy, Loader2 } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface ShareButtonProps {
  studyId: string;
}

export default function ShareButton({ studyId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [publicLink, setPublicLink] = useState('');
  const [loading, setLoading] = useState(false);

  const generateAndCopyLink = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(`/api/studies/${studyId}/share-token`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al generar el enlace');
      }
      
      const link = data.publicUrl;
      setPublicLink(link);
      
      await navigator.clipboard.writeText(link);
      
      setCopied(true);
      setShowLink(true);
      
      setTimeout(() => setCopied(false), 3000);
      console.log('✅ Link copied to clipboard:', link);
    } catch (error) {
      console.error('❌ Error generating/copying link:', error);
      setShowLink(true);
      setPublicLink(`${window.location.origin}/public/study/${studyId}?token=ERROR`);
    } finally {
      setLoading(false);
    }
  };

  const displayLink = publicLink || `${typeof window !== 'undefined' ? window.location.origin : ''}/public/study/${studyId}`;

  return (
    <div className="space-y-3">
      <Button 
        onClick={generateAndCopyLink}
        className="w-full"
        variant={copied ? "default" : "default"}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generando...
          </>
        ) : copied ? (
          <>
            <Check className="mr-2 h-4 w-4 text-green-600" />
            ¡Copiado!
          </>
        ) : (
          <>
            <LinkIcon className="mr-2 h-4 w-4"/>
            Generar Link Público
          </>
        )}
      </Button>
      
      {showLink && (
        <div className="bg-gray-50 border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-600">Link Público:</span>
            <button
              onClick={() => navigator.clipboard.writeText(displayLink)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Copiar
            </button>
          </div>
          <div className="text-xs text-gray-700 break-all font-mono bg-white p-2 rounded border">
            {displayLink}
          </div>
        </div>
      )}
    </div>
  );
}
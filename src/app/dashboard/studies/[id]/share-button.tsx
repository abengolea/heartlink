"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { LinkIcon, Check, Copy } from "lucide-react";

interface ShareButtonProps {
  studyId: string;
}

export default function ShareButton({ studyId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);

  const generateAndCopyLink = async () => {
    try {
      const link = `${window.location.origin}/public/study/${studyId}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(link);
      
      setCopied(true);
      setShowLink(true);
      
      // Reset after 3 seconds
      setTimeout(() => {
        setCopied(false);
      }, 3000);
      
      console.log('✅ Link copied to clipboard:', link);
    } catch (error) {
      console.error('❌ Error copying to clipboard:', error);
      // Fallback: just show the link
      setShowLink(true);
    }
  };

  const publicLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/study/${studyId}`;

  return (
    <div className="space-y-3">
      <Button 
        onClick={generateAndCopyLink}
        className="w-full"
        variant={copied ? "default" : "default"}
      >
        {copied ? (
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
              onClick={() => navigator.clipboard.writeText(publicLink)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Copiar
            </button>
          </div>
          <div className="text-xs text-gray-700 break-all font-mono bg-white p-2 rounded border">
            {publicLink}
          </div>
        </div>
      )}
    </div>
  );
}
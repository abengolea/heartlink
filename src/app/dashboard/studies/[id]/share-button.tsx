"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LinkIcon, Check, Copy, Loader2, MessageCircle } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { toDisplayFormat, toWhatsAppFormat } from "@/lib/phone-format";

interface ShareButtonProps {
  studyId: string;
  /** Teléfono del médico solicitante (Argentina). Se pre-llena para enviar el estudio. */
  requesterPhone?: string | null;
  /** Nombre del médico solicitante. Se muestra como destinatario. */
  requesterName?: string | null;
}

export default function ShareButton({ studyId, requesterPhone, requesterName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [publicLink, setPublicLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');

  // Pre-llenar con teléfono del médico solicitante (Argentina) al abrir el diálogo
  useEffect(() => {
    if (whatsappOpen && requesterPhone) {
      setWhatsappPhone(toDisplayFormat(requesterPhone));
    }
  }, [whatsappOpen, requesterPhone]);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappSuccess, setWhatsappSuccess] = useState(false);
  const [whatsappError, setWhatsappError] = useState('');

  const sendWhatsApp = async () => {
    if (!whatsappPhone.trim()) return;
    setWhatsappLoading(true);
    setWhatsappError('');
    setWhatsappSuccess(false);
    try {
      const res = await fetchWithAuth(`/api/studies/${studyId}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: whatsappPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar');
      setWhatsappSuccess(true);
      setTimeout(() => {
        setWhatsappOpen(false);
        setWhatsappSuccess(false);
        setWhatsappPhone('');
      }, 2000);
    } catch (err) {
      setWhatsappError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setWhatsappLoading(false);
    }
  };

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

      <Dialog open={whatsappOpen} onOpenChange={setWhatsappOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <MessageCircle className="mr-2 h-4 w-4" />
            Enviar por WhatsApp
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar estudio por WhatsApp</DialogTitle>
            <DialogDescription>
              {requesterName
                ? `Se enviará al médico solicitante. El destinatario recibirá el enlace al estudio.`
                : 'Ingresa el número con código de país Argentina (ej: +54 9 336 451-3355). El destinatario recibirá el enlace al estudio.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {(requesterName || requesterPhone) && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm font-medium text-muted-foreground">Enviar a</p>
                {requesterName && <p className="text-base font-semibold">{requesterName}</p>}
                {requesterPhone && (
                  <p className="text-sm font-mono text-muted-foreground mt-1">
                    {toDisplayFormat(requesterPhone)}
                  </p>
                )}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="whatsapp-phone">
                Número de WhatsApp {requesterName && '(puedes editarlo)'}
              </Label>
              <Input
                id="whatsapp-phone"
                placeholder="+54 9 336 451-3355"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                disabled={whatsappLoading}
              />
            </div>
            {whatsappError && (
              <p className="text-sm text-destructive">{whatsappError}</p>
            )}
            {whatsappSuccess && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" /> Mensaje enviado correctamente
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={sendWhatsApp}
              disabled={whatsappLoading || !whatsappPhone.trim()}
            >
              {whatsappLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
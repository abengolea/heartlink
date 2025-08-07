"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Wand2, Save, Edit3, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranscriptionPanelProps {
  studyId: string;
  videoUrl: string;
  initialTranscription?: string;
}

export default function TranscriptionPanel({ studyId, videoUrl, initialTranscription = '' }: TranscriptionPanelProps) {
  const [transcription, setTranscription] = useState(initialTranscription);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState(initialTranscription);
  const { toast } = useToast();

  const handleTranscribe = async () => {
    if (!videoUrl) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay video disponible para transcribir.'
      });
      return;
    }

    setIsTranscribing(true);
    try {
      console.log('🎤 Starting transcription for video:', videoUrl);
      
      const response = await fetch('/api/transcribe-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.transcription) {
        setTranscription(result.transcription);
        setEditableText(result.transcription);
        toast({
          title: 'Transcripción Completa',
          description: 'El audio del video ha sido transcrito exitosamente.'
        });
      } else {
        throw new Error(result.error || 'Error en la transcripción');
      }
    } catch (error) {
      console.error('❌ Transcription error:', error);
      toast({
        variant: 'destructive',
        title: 'Error de Transcripción',
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleImproveText = async () => {
    if (!transcription) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No hay transcripción para mejorar.'
      });
      return;
    }

    setIsImproving(true);
    try {
      console.log('🤖 Improving transcription with AI...');
      
      const response = await fetch('/api/improve-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcription: transcription,
          context: 'medical_study' 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.improvedText) {
        setTranscription(result.improvedText);
        setEditableText(result.improvedText);
        toast({
          title: 'Texto Mejorado',
          description: 'La IA ha mejorado la claridad y redacción de la transcripción.'
        });
      } else {
        throw new Error(result.error || 'Error mejorando el texto');
      }
    } catch (error) {
      console.error('❌ Text improvement error:', error);
      toast({
        variant: 'destructive',
        title: 'Error de Mejora',
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsImproving(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      console.log('💾 Saving transcription...');
      
      const response = await fetch('/api/save-transcription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          studyId: studyId,
          transcription: editableText 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setTranscription(editableText);
        setIsEditing(false);
        toast({
          title: 'Guardado Exitoso',
          description: 'La transcripción ha sido guardada correctamente.'
        });
      } else {
        throw new Error(result.error || 'Error guardando la transcripción');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Guardar',
        description: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Transcripción de Audio
        </CardTitle>
        <CardDescription>
          Transcripción automática del audio del video con IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleTranscribe}
            disabled={isTranscribing}
            variant="outline"
            size="sm"
          >
            {isTranscribing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mic className="mr-2 h-4 w-4" />
            )}
            {isTranscribing ? 'Transcribiendo...' : 'Transcribir Audio'}
          </Button>
          
          {transcription && (
            <>
              <Button 
                onClick={handleImproveText}
                disabled={isImproving}
                variant="outline"
                size="sm"
              >
                {isImproving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                {isImproving ? 'Mejorando...' : 'Mejorar con IA'}
              </Button>
              
              <Button 
                onClick={() => {
                  setIsEditing(!isEditing);
                  if (!isEditing) setEditableText(transcription);
                }}
                variant="outline"
                size="sm"
              >
                <Edit3 className="mr-2 h-4 w-4" />
                {isEditing ? 'Cancelar' : 'Editar'}
              </Button>
            </>
          )}
        </div>

        {/* Transcription Display/Edit */}
        {transcription && (
          <div className="space-y-3">
            {isEditing ? (
              <>
                <Textarea
                  value={editableText}
                  onChange={(e) => setEditableText(e.target.value)}
                  placeholder="Edita la transcripción aquí..."
                  className="min-h-[200px]"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                    size="sm"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Transcripción:</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                  {transcription}
                </p>
              </div>
            )}
          </div>
        )}

        {!transcription && !isTranscribing && (
          <div className="text-center py-8 text-gray-500">
            <Mic className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">
              Haz clic en "Transcribir Audio" para generar la transcripción automática del video
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
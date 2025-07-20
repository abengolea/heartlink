
"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Trash2, Send, Loader2, Wand2 } from 'lucide-react';
import { transcribeAudioAction } from '@/actions/transcribe-audio';

interface AudioTranscriberProps {
  onTranscription: (text: string) => void;
}

export function AudioTranscriber({ onTranscription }: AudioTranscriberProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        audioChunksRef.current = [];
        // Stop all tracks to turn off the mic indicator
        stream.getTracks().forEach(track => track.stop());
      };
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioBlob(null);
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      // TODO: Mostrar un toast o alerta al usuario
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const result = await transcribeAudioAction(base64Audio);
        if (result.status === 'success' && result.transcription) {
          onTranscription(result.transcription);
        } else {
          console.error("Error de transcripción:", result.message);
          // TODO: Mostrar un toast de error
        }
        setAudioBlob(null);
        setIsTranscribing(false);
      };
    } catch (error) {
      console.error("Error al transcribir:", error);
      setIsTranscribing(false);
      // TODO: Mostrar un toast de error
    }
  };
  
  const resetRecording = () => {
      setAudioBlob(null);
      setIsRecording(false);
  }

  return (
    <div className="flex items-center gap-2">
      {!isRecording && !audioBlob && (
        <Button type="button" variant="outline" onClick={startRecording}>
          <Mic className="mr-2" />
          Grabar audio
        </Button>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 w-full">
            <Button type="button" variant="destructive" onClick={stopRecording} className="flex-1">
                <StopCircle className="mr-2" />
                Detener grabación
            </Button>
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                <span>Grabando...</span>
            </div>
        </div>
      )}

      {audioBlob && (
          <div className="flex items-center gap-2">
            <audio src={URL.createObjectURL(audioBlob)} controls className="h-10"/>
            <Button type="button" variant="outline" size="icon" onClick={resetRecording} title="Descartar grabación">
                <Trash2 />
            </Button>
             <Button type="button" onClick={handleTranscribe} disabled={isTranscribing}>
              {isTranscribing ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
              {isTranscribing ? 'Transcribiendo...' : 'Transcribir'}
            </Button>
          </div>
      )}
    </div>
  );
}

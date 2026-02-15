'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/auth-context';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { toast } from 'sonner';
import type { StudyComment } from '@/lib/types';

interface CommentsPanelProps {
  studyId: string;
  initialComments: StudyComment[];
}

function normalizeComment(c: unknown): StudyComment | null {
  if (!c || typeof c !== 'object') return null;
  const o = c as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.text !== 'string' || typeof o.userName !== 'string') return null;
  return {
    id: o.id as string,
    userId: (o.userId as string) ?? '',
    userName: o.userName as string,
    role: (o.role as string) ?? 'solicitante',
    text: o.text as string,
    timestamp: (o.timestamp as string) ?? new Date().toISOString(),
  };
}

export default function CommentsPanel({ studyId, initialComments }: CommentsPanelProps) {
  const router = useRouter();
  const { dbUser } = useAuth();
  const normalized = (initialComments ?? [])
    .map(normalizeComment)
    .filter((c): c is StudyComment => c !== null);
  const [comments, setComments] = useState<StudyComment[]>(normalized);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !dbUser) return;

    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth(`/api/studies/${studyId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newComment.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        const addedComment: StudyComment = {
          id: `c${Date.now()}`,
          userId: dbUser.id,
          userName: dbUser.name,
          role: dbUser.role,
          text: newComment.trim(),
          timestamp: new Date().toISOString(),
        };
        setComments((prev) => [...prev, addedComment]);
        setNewComment('');
        toast.success('Comentario agregado');
        router.refresh();
      } else {
        toast.error(data.error || 'Error al agregar comentario');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar el comentario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeComments = comments ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Notas Internas
        </CardTitle>
        <CardDescription>
          Comentarios entre el médico operador y el solicitante.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
          {safeComments.length > 0 ? (
            safeComments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Avatar>
                        <AvatarFallback>{comment.userName?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{comment.userName}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">
                      {comment.userName}{' '}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        {(comment.role === 'operator' || comment.role === 'medico_operador')
                          ? 'Operador'
                          : 'Solicitante'}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(comment.timestamp), 'p, PPP', { locale: es })}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg mt-1">
                    <p className="text-sm">{comment.text}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay comentarios en este estudio.
            </p>
          )}
        </div>

        {dbUser && (
          <form onSubmit={handleSubmit} className="flex items-start gap-3 pt-4 border-t">
            <Avatar>
              <AvatarFallback>{dbUser.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 grid gap-2">
              <Textarea
                placeholder="Escribe un comentario..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSubmitting}
                rows={3}
              />
              <Button
                type="submit"
                size="sm"
                className="ml-auto w-fit"
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

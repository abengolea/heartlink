'use client';

import { useState, useEffect } from 'react';
import { Link2, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { toast } from "sonner";

interface SharedStudy {
  id: string;
  patientName?: string;
  studyType?: string;
  shareToken?: string;
  createdAt?: string;
}

export default function AdminLinksPublicosPage() {
  const [studies, setStudies] = useState<SharedStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchWithAuth('/api/admin/studies-shared');
        if (!res.ok) {
          setStudies([]);
          return;
        }
        const data = await res.json();
        setStudies(data.studies ?? []);
      } catch {
        setStudies([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}/public/study` : '';

  const copyLink = (id: string, token?: string) => {
    const url = token ? `${baseUrl}/${id}?token=${token}` : `${baseUrl}/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Enlace copiado');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-semibold text-lg md:text-2xl">
          Links Públicos
        </h1>
        <p className="text-muted-foreground text-sm">
          Estudios compartidos con enlace público. Solo se muestran los que tienen shareToken.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Estudios compartidos
          </CardTitle>
          <CardDescription>
            Listado de estudios con enlace público activo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Cargando…</p>
          ) : studies.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">
              No hay estudios con enlace público o la API no está disponible.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studies.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.patientName ?? '-'}</TableCell>
                    <TableCell>{s.studyType ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {s.shareToken ? `${s.shareToken.slice(0, 8)}…` : '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyLink(s.id, s.shareToken)}
                        >
                          {copiedId === s.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                        >
                          <a
                            href={s.shareToken ? `${baseUrl}/${s.id}?token=${s.shareToken}` : `${baseUrl}/${s.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Layout para rutas públicas. No define metadata para que
 * cada página (ej. estudio compartido) controle su propia metadata.
 */
export const dynamic = 'force-dynamic';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

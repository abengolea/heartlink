'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2, User } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: string[];
}

export default function AuthGuard({ 
  children, 
  requireAuth = true, 
  allowedRoles = [] 
}: AuthGuardProps) {
  const { firebaseUser, dbUser, loading, error } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && requireAuth && !firebaseUser) {
      console.log('🔒 [AuthGuard] User not authenticated, redirecting to login');
      router.push('/');
    }
  }, [firebaseUser, loading, requireAuth, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <CardTitle>Verificando autenticación</CardTitle>
            <CardDescription>
              Por favor espera mientras verificamos tu sesión...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Authentication error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <CardTitle>Error de autenticación</CardTitle>
            <CardDescription>
              Ocurrió un error al verificar tu autenticación: {error.message}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
            >
              Ir al login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not authenticated
  if (requireAuth && !firebaseUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <User className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <CardTitle>Acceso restringido</CardTitle>
            <CardDescription>
              Necesitas iniciar sesión para acceder a esta página
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
            >
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User not found in database
  if (requireAuth && firebaseUser && !dbUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <CardTitle>Usuario no registrado</CardTitle>
            <CardDescription>
              Tu cuenta de Firebase está autenticada, pero no tienes un perfil en nuestra base de datos.
              Contacta al administrador para activar tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <strong>Email:</strong> {firebaseUser.email}
            </div>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full"
              variant="outline"
            >
              Cerrar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Role-based access control
  if (requireAuth && dbUser && allowedRoles.length > 0 && !allowedRoles.includes(dbUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <CardTitle>Acceso denegado</CardTitle>
            <CardDescription>
              No tienes permisos para acceder a esta sección.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              <strong>Tu rol:</strong> {dbUser.role}
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Roles permitidos:</strong> {allowedRoles.join(', ')}
            </div>
            <Button 
              onClick={() => router.push('/dashboard')} 
              className="w-full"
            >
              Ir al dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All checks passed, render children
  return <>{children}</>;
}
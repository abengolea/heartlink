
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/logo";
import { loginWithEmail } from "@/lib/firebase-client";
import { toast } from "sonner";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔐 [Login] Attempting login for:', email);
      
      const result = await loginWithEmail(email, password);
      
      if (result.success) {
        console.log('✅ [Login] Login successful:', result.user?.email);
        toast.success("¡Bienvenido de nuevo!");
        router.push("/dashboard");
      } else {
        console.error('❌ [Login] Login failed:', result.error);
        
        // Friendly error messages
        let errorMessage = "Error al iniciar sesión";
        if (result.error?.includes("user-not-found")) {
          errorMessage = "No existe una cuenta con este email";
        } else if (result.error?.includes("wrong-password")) {
          errorMessage = "Contraseña incorrecta";
        } else if (result.error?.includes("invalid-email")) {
          errorMessage = "Email inválido";
        } else if (result.error?.includes("too-many-requests")) {
          errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('❌ [Login] Unexpected error:', error);
      toast.error("Error inesperado. Intenta nuevamente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="hidden bg-muted lg:block">
        <div className="flex flex-col h-full justify-between p-8">
            <Logo />
            <Image
                src="https://placehold.co/800x600.png"
                alt="Image"
                width="800"
                height="600"
                className="mx-auto rounded-lg object-cover"
                data-ai-hint="medical technology cardiology"
            />
            <div className="text-center">
                <p className="text-lg font-semibold text-foreground">La plataforma líder para la gestión de estudios cardiológicos.</p>
                <p className="text-sm text-muted-foreground">Colaboración eficiente entre médicos operadores y solicitantes.</p>
            </div>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4">
        <Card className="mx-auto w-full max-w-sm border-0 lg:border">
          <CardHeader className="text-center">
            <div className="lg:hidden mb-4 flex justify-center">
                <Logo />
            </div>
            <CardTitle className="text-2xl font-bold">
              Bienvenido de nuevo
            </CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    href="#"
                    className="ml-auto inline-block text-sm underline"
                    prefetch={false}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                   <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3 py-2 text-muted-foreground"
                    onClick={togglePasswordVisibility}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
              <Button variant="outline" className="w-full" disabled={loading}>
                Registrarse
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

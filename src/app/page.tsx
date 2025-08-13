
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Key, UserPlus } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Logo from "@/components/logo";
import { loginWithEmail, resetPassword } from "@/lib/firebase-client";
import { toast } from "sonner";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  });
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
          errorMessage = "No existe una cuenta con este email. ¿Necesitas registrarte?";
        } else if (result.error?.includes("wrong-password")) {
          errorMessage = "Contraseña incorrecta";
        } else if (result.error?.includes("invalid-email")) {
          errorMessage = "Email inválido";
        } else if (result.error?.includes("too-many-requests")) {
          errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
        } else if (result.error?.includes("invalid-credential")) {
          errorMessage = "Email o contraseña incorrectos";
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

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Por favor ingresa tu email");
      return;
    }

    setResetLoading(true);
    
    try {
      console.log('🔑 [Reset] Sending password reset for:', resetEmail);
      
      const result = await resetPassword(resetEmail);
      
      if (result.success) {
        console.log('✅ [Reset] Password reset email sent');
        toast.success("Se ha enviado un enlace de recuperación a tu email");
        setShowForgotPassword(false);
        setResetEmail("");
      } else {
        console.error('❌ [Reset] Password reset failed:', result.error);
        toast.error("Error al enviar el enlace de recuperación");
      }
    } catch (error) {
      console.error('❌ [Reset] Unexpected error:', error);
      toast.error("Error inesperado. Intenta nuevamente");
    } finally {
      setResetLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerData.email || !registerData.password || !registerData.name) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setRegisterLoading(true);
    
    try {
      console.log('👤 [Register] Creating account for:', registerData.email);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registerData.email,
          password: registerData.password,
          name: registerData.name
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ [Register] Account created successfully');
        toast.success("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión");
        setShowRegister(false);
        setRegisterData({ email: "", password: "", confirmPassword: "", name: "" });
        setEmail(registerData.email); // Pre-fill login email
      } else {
        console.error('❌ [Register] Registration failed:', result.error);
        
        let errorMessage = result.error;
        if (result.error?.includes('not found in database')) {
          errorMessage = "Tu email no está autorizado. Contacta al administrador para que cree tu perfil primero.";
        } else if (result.error?.includes('already exists')) {
          errorMessage = "Ya existe una cuenta con este email. ¿Intentas iniciar sesión?";
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('❌ [Register] Unexpected error:', error);
      toast.error("Error inesperado. Intenta nuevamente");
    } finally {
      setRegisterLoading(false);
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
                  <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
                    <DialogTrigger asChild>
                      <Button
                        variant="link"
                        className="ml-auto text-sm p-0 h-auto"
                        type="button"
                      >
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Key className="h-5 w-5" />
                          Recuperar contraseña
                        </DialogTitle>
                        <DialogDescription>
                          Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            placeholder="tu@email.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            disabled={resetLoading}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowForgotPassword(false)}
                          disabled={resetLoading}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleForgotPassword} disabled={resetLoading}>
                          {resetLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Key className="h-4 w-4 mr-2" />
                              Enviar enlace
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
              
              <Dialog open={showRegister} onOpenChange={setShowRegister}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={loading}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear cuenta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      Crear cuenta
                    </DialogTitle>
                    <DialogDescription>
                      Tu email debe estar autorizado por el administrador antes de crear la cuenta.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="register-name">Nombre completo</Label>
                      <Input
                        id="register-name"
                        placeholder="Dr. Juan Pérez"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        disabled={registerLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="doctor@ejemplo.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        disabled={registerLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="register-password">Contraseña</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                        disabled={registerLoading}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="register-confirm-password">Confirmar contraseña</Label>
                      <Input
                        id="register-confirm-password"
                        type="password"
                        placeholder="Repite la contraseña"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                        disabled={registerLoading}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setShowRegister(false)}
                      disabled={registerLoading}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={handleRegister} disabled={registerLoading}>
                      {registerLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creando cuenta...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Crear cuenta
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

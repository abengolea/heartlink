
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Key, UserPlus, Copy } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Logo from "@/components/logo";
import { loginWithEmail, loginWithEmailViaBackend, resetPassword, resetPasswordViaBackend } from "@/lib/firebase-client";
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
  const [resetLinkResult, setResetLinkResult] = useState<string | null>(null);
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    operatorId: "" as string
  });
  const [operators, setOperators] = useState<{ id: string; name: string; specialty?: string }[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (showRegister) {
      fetch("/api/operators")
        .then((r) => (r.ok ? r.json() : []))
        .then(setOperators)
        .catch(() => setOperators([]));
    }
  }, [showRegister]);

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
      
      let result = await loginWithEmail(email, password);
      
      // Si falla por network-request-failed, intentar vía backend (evita bloqueos de red)
      if (!result.success && result.error?.includes("network-request-failed")) {
        console.log('🔄 [Login] Retrying via backend...');
        result = await loginWithEmailViaBackend(email, password);
      }
      
      if (result.success) {
        console.log('✅ [Login] Login successful:', result.user?.email);
        toast.success("¡Bienvenido de nuevo!");
        router.push("/dashboard");
      } else {
        console.error('❌ [Login] Login failed:', result.error);
        
        // Friendly error messages
        let errorMessage = "Error al iniciar sesión";
        if (result.error?.includes("user-not-found") || result.error?.includes("EMAIL_NOT_FOUND")) {
          errorMessage = "No existe una cuenta con este email. ¿Necesitas registrarte?";
        } else if (result.error?.includes("wrong-password") || result.error?.includes("INVALID_PASSWORD")) {
          errorMessage = "Contraseña incorrecta";
        } else if (result.error?.includes("invalid-email") || result.error?.includes("INVALID_EMAIL")) {
          errorMessage = "Email inválido";
        } else if (result.error?.includes("too-many-requests") || result.error?.includes("TOO_MANY_ATTEMPTS")) {
          errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
        } else if (result.error?.includes("invalid-credential") || result.error?.includes("INVALID_LOGIN_CREDENTIALS")) {
          errorMessage = "Email o contraseña incorrectos";
        } else if (result.error?.includes("unauthorized-domain") || result.error?.includes("operation-not-allowed")) {
          errorMessage = "Este dominio no está autorizado. Contacta al administrador.";
        } else if (result.error?.includes("network-request-failed")) {
          errorMessage = "Error de conexión. Revisa tu internet, desactiva VPN o bloqueadores de anuncios y vuelve a intentar.";
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
    setResetLinkResult(null);
    
    try {
      console.log('🔑 [Reset] Sending password reset for:', resetEmail);
      
      let result = await resetPassword(resetEmail);
      
      // Si falla (dominio no autorizado, red bloqueada, etc.), intentar vía backend
      if (!result.success) {
        console.log('🔄 [Reset] Retrying via backend...');
        result = await resetPasswordViaBackend(resetEmail);
      }
      
      if (result.success) {
        const backendResult = result as { success: true; resetLink?: string };
        if (backendResult.resetLink) {
          // Backend devolvió el enlace: mostrarlo para que el usuario lo copie
          setResetLinkResult(backendResult.resetLink);
          toast.success("Enlace generado. Cópialo y ábrelo en tu navegador.");
        } else {
          console.log('✅ [Reset] Password reset email sent');
          toast.success("Se ha enviado un enlace de recuperación a tu email");
          setShowForgotPassword(false);
          setResetEmail("");
          setResetLinkResult(null);
        }
      } else {
        console.error('❌ [Reset] Reset failed:', result.error);
        toast.error("Error al enviar el enlace de recuperación");
      }
    } catch (error) {
      console.error('❌ [Reset] Unexpected error:', error);
      toast.error("Error inesperado. Intenta nuevamente");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseForgotPassword = (open: boolean) => {
    if (!open) setResetLinkResult(null);
    setShowForgotPassword(open);
  };

  const copyResetLink = () => {
    if (resetLinkResult) {
      navigator.clipboard.writeText(resetLinkResult);
      toast.success("Enlace copiado al portapapeles");
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
          name: registerData.name,
          operatorId: registerData.operatorId || undefined
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ [Register] Account created successfully');
        toast.success("¡Cuenta creada! Un administrador debe autorizar tu acceso. Te notificaremos cuando esté activa.");
        setShowRegister(false);
        setRegisterData({ email: "", password: "", confirmPassword: "", name: "", operatorId: "" });
        setEmail(registerData.email); // Pre-fill login email
      } else {
        console.error('❌ [Register] Registration failed:', result.error);
        
        let errorMessage = result.error;
        if (result.error?.includes('already exists')) {
          errorMessage = "Ya existe una cuenta con este email. ¿Intentas iniciar sesión?";
        } else if (result.error?.includes('Error checking') || result.error?.includes('verificar si el usuario')) {
          errorMessage = "Error al verificar si el usuario ya existe. Por favor, intenta nuevamente.";
        }
        
        toast.error(errorMessage, {
          duration: 6000,
          style: { fontSize: '16px', minWidth: '320px', padding: '16px 20px' },
        });
      }
    } catch (error) {
      console.error('❌ [Register] Unexpected error:', error);
      toast.error("Error inesperado. Intenta nuevamente", {
        duration: 6000,
        style: { fontSize: '16px', minWidth: '320px', padding: '16px 20px' },
      });
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
                src="/corazon.jpg"
                alt="Imagen de portada - Cardiología"
                width="800"
                height="600"
                className="mx-auto rounded-lg object-cover"
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
                  <Dialog open={showForgotPassword} onOpenChange={handleCloseForgotPassword}>
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
                          {resetLinkResult
                            ? "Copia el enlace y ábrelo en tu navegador para restablecer tu contraseña."
                            : "Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña."}
                        </DialogDescription>
                      </DialogHeader>
                      {resetLinkResult ? (
                        <div className="grid gap-4 py-4">
                          <div className="flex gap-2">
                            <Input
                              readOnly
                              value={resetLinkResult}
                              className="font-mono text-xs"
                            />
                            <Button variant="outline" size="icon" onClick={copyResetLink} title="Copiar enlace">
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            El enlace expira en aproximadamente 1 hora.
                          </p>
                        </div>
                      ) : (
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
                      )}
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => handleCloseForgotPassword(false)}
                          disabled={resetLoading}
                        >
                          {resetLinkResult ? "Cerrar" : "Cancelar"}
                        </Button>
                        {!resetLinkResult && (
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
                        )}
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
                      Regístrate con tu email. Un administrador autorizará tu acceso a la plataforma.
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
                    <div className="grid gap-2">
                      <Label htmlFor="register-operator">¿Con qué operador trabajas?</Label>
                      <Select
                        value={registerData.operatorId}
                        onValueChange={(v) => setRegisterData({...registerData, operatorId: v})}
                        disabled={registerLoading}
                      >
                        <SelectTrigger id="register-operator">
                          <SelectValue placeholder="Seleccionar operador (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {operators.map((op) => (
                            <SelectItem key={op.id} value={op.id}>
                              {op.name}{op.specialty ? ` - ${op.specialty}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Si trabajas con un médico operador, selecciónalo para que pueda verte en su lista.
                      </p>
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

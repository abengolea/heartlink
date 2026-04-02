
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Logo from "@/components/logo";
import { toast } from "sonner";

// Import dinámico para evitar auth/invalid-api-key durante el build/SSR
async function getFirebaseAuth() {
  const mod = await import("@/lib/firebase-client");
  return {
    loginWithEmail: mod.loginWithEmail,
    loginWithEmailViaBackend: mod.loginWithEmailViaBackend,
    loginWithGoogle: mod.loginWithGoogle,
    resetPasswordViaBackend: mod.resetPasswordViaBackend,
  };
}

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
      const { loginWithEmail, loginWithEmailViaBackend } = await getFirebaseAuth();

      let result = await loginWithEmail(email, password);

      // Si falla (dominio no autorizado, red bloqueada, etc.), intentar vía backend
      // El backend no tiene restricciones de dominio y puede alcanzar Firebase
      if (!result.success) {
        console.log('🔄 [Login] Client failed, retrying via backend...');
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
    
    try {
      console.log('🔑 [Reset] Requesting password reset for:', resetEmail);
      const { resetPasswordViaBackend } = await getFirebaseAuth();
      const result = await resetPasswordViaBackend(resetEmail);
      
      if (result.success) {
        console.log('✅ [Reset] Password reset email sent');
        toast.success("Se ha enviado tu nueva contraseña a tu correo. Revisa la bandeja de entrada y spam.");
        setShowForgotPassword(false);
        setResetEmail("");
      } else {
        console.error('❌ [Reset] Reset failed:', result.error);
        toast.error(result.error || "Error al procesar la solicitud");
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
              Accede con Google o con tu email y contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const { loginWithGoogle } = await getFirebaseAuth();
                  const result = await loginWithGoogle();
                  if (result.success) {
                    toast.success("¡Bienvenido!");
                    router.push("/dashboard");
                  } else {
                    if (result.error?.includes("popup-closed")) {
                      toast.info("Inicio de sesión cancelado");
                    } else if (result.error?.includes("network-request-failed")) {
                      toast.error(
                        "Error de conexión. Revisa tu internet, desactiva VPN o bloqueadores de anuncios y vuelve a intentar."
                      );
                    } else {
                      toast.error(result.error || "Error al iniciar con Google");
                    }
                  }
                } catch (e) {
                  toast.error("Error inesperado");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar con Google
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">o</span>
              </div>
            </div>
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
                          Ingresa tu email y te enviaremos tu nueva contraseña por correo.
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
                                Enviar nueva contraseña
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Settings, Database, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";

export default function LoginGestor() {
  const [, setLocation] = useLocation();
  const { signIn } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({
    email: "",
    senha: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.senha) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      await signIn(loginData.email, loginData.senha);
      toast.success("Login realizado com sucesso!");
      setLocation("/gestor");
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      
      // Mensagens de erro amigáveis
      if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password") {
        toast.error("Email ou senha incorretos");
      } else if (error.code === "auth/user-not-found") {
        toast.error("Usuário não encontrado");
      } else if (error.code === "auth/too-many-requests") {
        toast.error("Muitas tentativas. Tente novamente mais tarde");
      } else {
        toast.error("Erro ao fazer login. Tente novamente");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Informações */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <Shield className="h-10 w-10" />
            <h1 className="text-3xl font-bold">Mentoria Mário Machado</h1>
          </div>
          <h2 className="text-4xl font-bold mb-6">
            Painel de Gestão Completo
          </h2>
          <p className="text-lg text-slate-300 mb-12">
            Gerencie toda a plataforma, configure mentores e acompanhe o crescimento da rede de estudantes.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="bg-white/10 p-3 rounded-lg">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Configuração White-label</h3>
              <p className="text-slate-300">Personalize plataformas para cada mentor</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-white/10 p-3 rounded-lg">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Gestão Centralizada</h3>
              <p className="text-slate-300">Controle total sobre mentores e alunos</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-white/10 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Analytics Avançado</h3>
              <p className="text-slate-300">Métricas e relatórios de toda a plataforma</p>
            </div>
          </div>
        </div>

        <div className="text-sm text-slate-400">
          © 2024 Mentoria Mário Machado. Todos os direitos reservados.
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardHeader className="space-y-1 bg-gradient-to-r from-slate-50 to-gray-50">
            <div className="flex justify-center mb-4">
              <div className="bg-slate-900 p-3 rounded-full">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Área do Gestor</CardTitle>
            <CardDescription className="text-center">
              Acesso restrito para administradores
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="gestor@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  className="border-slate-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.senha}
                  onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                  required
                  className="border-slate-300"
                />
              </div>
              <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
                {loading ? "Entrando..." : "Acessar Painel"}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Outros acessos</span>
                </div>
              </div>

              <div className="text-center text-sm space-y-2">
                <p className="text-muted-foreground">
                  Aluno?{" "}
                  <a href="/login/aluno" className="text-primary hover:underline">
                    Acesse aqui
                  </a>
                </p>
                <p className="text-muted-foreground">
                  Mentor?{" "}
                  <a href="/login/mentor" className="text-primary hover:underline">
                    Acesse aqui
                  </a>
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                <p className="font-medium mb-1">🔒 Acesso Restrito</p>
                <p>
                  Esta área é exclusiva para gestores da Mentoria Mário Machado. Acesso não autorizado é proibido.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

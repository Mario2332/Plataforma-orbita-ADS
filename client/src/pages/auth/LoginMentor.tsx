import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, BarChart3, Users, MessageSquare, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";

export default function LoginMentor() {
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
      setLocation("/mentor");
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos flutuantes */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-none animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400/20 rounded-full blur-none animate-float-delayed" />

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Lado Esquerdo - Informações Premium */}
        <div className="text-center md:text-left space-y-6 animate-fade-in">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full blur-none opacity-50" />
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full relative z-10 shadow-sm">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Plataforma Órbita
            </h1>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2 justify-center md:justify-start">
            <Sparkles className="w-8 h-8 text-emerald-500" />
            Área do Professor
          </h2>
          
          <p className="text-gray-600 text-lg font-semibold">
            Gerencie seus alunos e acompanhe o progresso de cada um com nossa plataforma completa de gestão de mentoria.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3 bg-gradient-to-br from-white to-emerald-50 p-5 rounded-xl border-2 border-emerald-200 hover:shadow-sm transition-all hover:scale-[1.01]">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Gestão de Alunos</h3>
                <p className="text-sm text-gray-600 font-semibold">Adicione e gerencie todos os seus alunos em um só lugar</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gradient-to-br from-white to-teal-50 p-5 rounded-xl border-2 border-teal-200 hover:shadow-sm transition-all hover:scale-[1.01]">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg shadow">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Relatórios Detalhados</h3>
                <p className="text-sm text-gray-600 font-semibold">Visualize métricas e progresso de cada aluno</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gradient-to-br from-white to-emerald-50 p-5 rounded-xl border-2 border-emerald-200 hover:shadow-sm transition-all hover:scale-[1.01]">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-indigo-500 rounded-lg shadow">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Comunicação Direta</h3>
                <p className="text-sm text-gray-600 font-semibold">Mantenha contato direto com seus alunos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulário Premium */}
        <Card className="w-full shadow-sm border-2 border-emerald-200 bg-white/95 backdrop-blur-sm animate-slide-up">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
            <CardTitle className="text-3xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
              <Zap className="w-8 h-8 text-emerald-500" />
              Login Professor
            </CardTitle>
            <CardDescription className="text-base font-semibold text-gray-600">
              Entre com suas credenciais para acessar o painel
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-base">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  disabled={loading}
                  required
                  className="border-2 h-12 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha" className="font-bold text-base">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.senha}
                  onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                  disabled={loading}
                  required
                  className="border-2 h-12 font-semibold"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold text-lg shadow hover:shadow-sm transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600 font-semibold">
              <p>Apenas professores autorizados podem acessar esta área.</p>
              <p className="mt-1">Entre em contato com o gestor para obter acesso.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-sky-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos flutuantes */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-400/10 rounded-full blur-3xl" />

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center relative z-10">
        {/* Lado Esquerdo - Informações Premium */}
        <div className="text-center md:text-left space-y-6 animate-fade-in">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-xl opacity-50" />
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full relative z-10 shadow-2xl">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent">
              Mentoria Mário Machado
            </h1>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2 justify-center md:justify-start">
            <Sparkles className="w-8 h-8 text-blue-500" />
            Área do Professor
          </h2>
          
          <p className="text-gray-600 text-lg font-semibold">
            Gerencie seus alunos e acompanhe o progresso de cada um com nossa plataforma completa de gestão de mentoria.
          </p>

          <div className="space-y-4 pt-4">
            <div className="flex items-start gap-3 bg-gradient-to-br from-white to-blue-50 p-5 rounded-xl border-2 border-blue-200 hover:shadow-xl transition-all hover:scale-105">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Gestão de Alunos</h3>
                <p className="text-sm text-gray-600 font-semibold">Adicione e gerencie todos os seus alunos em um só lugar</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gradient-to-br from-white to-cyan-50 p-5 rounded-xl border-2 border-cyan-200 hover:shadow-xl transition-all hover:scale-105">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-sky-500 rounded-lg shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Relatórios Detalhados</h3>
                <p className="text-sm text-gray-600 font-semibold">Visualize métricas e progresso de cada aluno</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gradient-to-br from-white to-sky-50 p-5 rounded-xl border-2 border-sky-200 hover:shadow-xl transition-all hover:scale-105">
              <div className="p-2 bg-gradient-to-br from-sky-500 to-indigo-500 rounded-lg shadow-lg">
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
        <Card className="w-full shadow-2xl border-2 border-blue-200 bg-white/95 backdrop-blur-sm animate-slide-up">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
            <CardTitle className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
              <Zap className="w-8 h-8 text-blue-500" />
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
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 font-bold text-lg shadow-lg hover:shadow-xl transition-all" 
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

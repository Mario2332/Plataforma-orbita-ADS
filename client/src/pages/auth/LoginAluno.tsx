import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, GraduationCap, Target, TrendingUp, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

export default function LoginAluno() {
  const [, setLocation] = useLocation();
  const { signIn, signUp } = useAuthContext();
  const [loading, setLoading] = useState(false);

  // Estado para Login
  const [loginData, setLoginData] = useState({
    email: "",
    senha: "",
  });

  // Estado para Cadastro
  const [cadastroData, setCadastroData] = useState({
    nome: "",
    email: "",
    celular: "",
    senha: "",
    confirmarSenha: "",
    mentorId: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.senha) {
      toast.error("Preencha todos os campos");
      return;
    }

    setLoading(true);
    console.log('[LoginAluno] Iniciando login...');

    try {
      console.log('[LoginAluno] Chamando signIn...');
      await signIn(loginData.email, loginData.senha);
      console.log('[LoginAluno] signIn retornou com sucesso');
      toast.success("Login realizado com sucesso!");
      console.log('[LoginAluno] Navegando para /aluno');
      setLocation("/aluno");
      console.log('[LoginAluno] setLocation executado');
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

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cadastroData.senha !== cadastroData.confirmarSenha) {
      toast.error("As senhas não coincidem!");
      return;
    }

    if (cadastroData.senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres!");
      return;
    }

    if (!cadastroData.nome || !cadastroData.email || !cadastroData.senha) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const mentorId = cadastroData.mentorId || null;
    setLoading(true);

    try {
      await signUp(cadastroData.email, cadastroData.senha, cadastroData.nome, mentorId);
      toast.success("Cadastro realizado com sucesso!");
      setLocation("/aluno");
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      
      if (error.code === "auth/email-already-in-use") {
        toast.error("Este email já está cadastrado");
      } else if (error.code === "auth/invalid-email") {
        toast.error("Email inválido");
      } else if (error.code === "auth/weak-password") {
        toast.error("Senha muito fraca");
      } else {
        toast.error("Erro ao criar conta. Tente novamente");
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
              <img 
                src="https://firebasestorage.googleapis.com/v0/b/plataforma-mentoria-mario.firebasestorage.app/o/Logo%2FLogo%20mentoria%20sem%20texto.png?alt=media&token=452fed10-1481-41ad-a4c1-ddd61b039409" 
                alt="Logo Plataforma Órbita" 
                className="w-16 h-16 object-contain relative z-10 drop-shadow-sm"
              />
            </div>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Plataforma Órbita
            </h1>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2 justify-center md:justify-start">
            <Sparkles className="w-8 h-8 text-emerald-500" />
            Sua jornada rumo ao ENEM começa aqui!
          </h2>
          
          <p className="text-gray-600 text-lg font-semibold">
            Organize seus estudos, acompanhe seu progresso e alcance seus objetivos com nossa plataforma completa de gestão de estudos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-start gap-3 bg-gradient-to-br from-white to-emerald-50 p-5 rounded-xl border-2 border-emerald-200 hover:shadow-sm transition-all hover:scale-[1.01]">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Registro de Estudos</h3>
                <p className="text-sm text-gray-600 font-semibold">Acompanhe cada sessão de estudo</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gradient-to-br from-white to-teal-50 p-5 rounded-xl border-2 border-teal-200 hover:shadow-sm transition-all hover:scale-[1.01]">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-lg shadow">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Simulados</h3>
                <p className="text-sm text-gray-600 font-semibold">Registre e analise seus simulados</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gradient-to-br from-white to-emerald-50 p-5 rounded-xl border-2 border-emerald-200 hover:shadow-sm transition-all hover:scale-[1.01]">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-indigo-500 rounded-lg shadow">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Métricas</h3>
                <p className="text-sm text-gray-600 font-semibold">Visualize seu progresso em tempo real</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gradient-to-br from-white to-indigo-50 p-5 rounded-xl border-2 border-indigo-200 hover:shadow-sm transition-all hover:scale-[1.01]">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-lg shadow">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">Cronograma</h3>
                <p className="text-sm text-gray-600 font-semibold">Organize sua rotina de estudos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulário Premium */}
        <Card className="w-full shadow-sm border-2 border-emerald-200 bg-white/95 backdrop-blur-sm animate-slide-up">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
            <CardTitle className="text-3xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
              <Zap className="w-8 h-8 text-emerald-500" />
              Área do Aluno
            </CardTitle>
            <CardDescription className="text-base font-semibold text-gray-600">
              Entre ou crie sua conta para começar
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-emerald-100 to-teal-100 p-1 h-12">
                <TabsTrigger 
                  value="login" 
                  className="font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger 
                  value="cadastro"
                  className="font-bold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow"
                >
                  Criar Conta
                </TabsTrigger>
              </TabsList>

              {/* Tab de Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="font-bold text-base">Email</Label>
                    <Input
                      id="login-email"
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
                    <Label htmlFor="login-senha" className="font-bold text-base">Senha</Label>
                    <Input
                      id="login-senha"
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
              </TabsContent>

              {/* Tab de Cadastro */}
              <TabsContent value="cadastro">
                <form onSubmit={handleCadastro} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cadastro-nome" className="font-bold text-base">Nome Completo *</Label>
                    <Input
                      id="cadastro-nome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={cadastroData.nome}
                      onChange={(e) => setCadastroData({ ...cadastroData, nome: e.target.value })}
                      disabled={loading}
                      required
                      className="border-2 h-12 font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cadastro-email" className="font-bold text-base">Email *</Label>
                    <Input
                      id="cadastro-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={cadastroData.email}
                      onChange={(e) => setCadastroData({ ...cadastroData, email: e.target.value })}
                      disabled={loading}
                      required
                      className="border-2 h-12 font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cadastro-celular" className="font-bold text-base">Celular (opcional)</Label>
                    <Input
                      id="cadastro-celular"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={cadastroData.celular}
                      onChange={(e) => setCadastroData({ ...cadastroData, celular: e.target.value })}
                      disabled={loading}
                      className="border-2 h-12 font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cadastro-senha" className="font-bold text-base">Senha *</Label>
                    <Input
                      id="cadastro-senha"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={cadastroData.senha}
                      onChange={(e) => setCadastroData({ ...cadastroData, senha: e.target.value })}
                      disabled={loading}
                      required
                      className="border-2 h-12 font-semibold"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cadastro-confirmar" className="font-bold text-base">Confirmar Senha *</Label>
                    <Input
                      id="cadastro-confirmar"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={cadastroData.confirmarSenha}
                      onChange={(e) => setCadastroData({ ...cadastroData, confirmarSenha: e.target.value })}
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
                        Criando conta...
                      </div>
                    ) : (
                      "Criar Conta"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

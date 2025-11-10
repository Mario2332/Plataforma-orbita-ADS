import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, GraduationCap, Target, TrendingUp } from "lucide-react";
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
    mentorId: "", // ID do mentor (pode ser obtido de query params ou configuração)
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
      setLocation("/aluno");
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

    // TODO: Obter mentorId de forma dinâmica (query params, subdomínio, etc.)
    const mentorId = cadastroData.mentorId || "DEFAULT_MENTOR_ID";

    setLoading(true);

    try {
      await signUp(cadastroData.email, cadastroData.senha, cadastroData.nome, mentorId);
      toast.success("Cadastro realizado com sucesso!");
      setLocation("/aluno");
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      
      // Mensagens de erro amigáveis
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Lado Esquerdo - Informações */}
        <div className="text-center md:text-left space-y-6">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <GraduationCap className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Mentoria Mário Machado</h1>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800">
            Sua jornada rumo ao ENEM começa aqui
          </h2>
          
          <p className="text-gray-600 text-lg">
            Organize seus estudos, acompanhe seu progresso e alcance seus objetivos com nossa plataforma completa de gestão de estudos.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-start gap-3 bg-white/50 p-4 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Registro de Estudos</h3>
                <p className="text-sm text-gray-600">Acompanhe cada sessão de estudo</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/50 p-4 rounded-lg">
              <Target className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Simulados</h3>
                <p className="text-sm text-gray-600">Registre e analise seus simulados</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/50 p-4 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Métricas</h3>
                <p className="text-sm text-gray-600">Visualize seu progresso em tempo real</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/50 p-4 rounded-lg">
              <GraduationCap className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-800">Cronograma</h3>
                <p className="text-sm text-gray-600">Organize sua rotina de estudos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulário de Login/Cadastro */}
        <Card className="w-full shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Área do Aluno</CardTitle>
            <CardDescription>Entre ou crie sua conta para começar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="cadastro">Criar Conta</TabsTrigger>
              </TabsList>

              {/* Tab de Login */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-senha">Senha</Label>
                    <Input
                      id="login-senha"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.senha}
                      onChange={(e) => setLoginData({ ...loginData, senha: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              {/* Tab de Cadastro */}
              <TabsContent value="cadastro">
                <form onSubmit={handleCadastro} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cadastro-nome">Nome Completo *</Label>
                    <Input
                      id="cadastro-nome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={cadastroData.nome}
                      onChange={(e) => setCadastroData({ ...cadastroData, nome: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cadastro-email">Email *</Label>
                    <Input
                      id="cadastro-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={cadastroData.email}
                      onChange={(e) => setCadastroData({ ...cadastroData, email: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cadastro-celular">Celular (opcional)</Label>
                    <Input
                      id="cadastro-celular"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={cadastroData.celular}
                      onChange={(e) => setCadastroData({ ...cadastroData, celular: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cadastro-senha">Senha *</Label>
                    <Input
                      id="cadastro-senha"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={cadastroData.senha}
                      onChange={(e) => setCadastroData({ ...cadastroData, senha: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cadastro-confirmar">Confirmar Senha *</Label>
                    <Input
                      id="cadastro-confirmar"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={cadastroData.confirmarSenha}
                      onChange={(e) => setCadastroData({ ...cadastroData, confirmarSenha: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Criando conta..." : "Criar Conta"}
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

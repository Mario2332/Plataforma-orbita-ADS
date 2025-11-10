import { useState } from "react";
// import { trpc } from "@/lib/trpc"; // TODO: Implementar com alunoApi
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, User, Lock, Loader2 } from "lucide-react";
// Firebase removido - usando autenticação própria

export default function AlunoConfiguracoes() {
  const { data: aluno, refetch } = trpc.aluno.me.useQuery();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    nome: "",
    email: "",
    celular: "",
  });

  const [passwordData, setPasswordData] = useState({
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });

  const updateAluno = trpc.aluno.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      refetch();
      setLoadingProfile(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar perfil");
      setLoadingProfile(false);
    },
  });

  // Preencher dados quando aluno carregar
  useState(() => {
    if (aluno) {
      setProfileData({
        nome: aluno.nome || "",
        email: aluno.email || "",
        celular: aluno.celular || "",
      });
    }
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);

    if (!profileData.nome || !profileData.email) {
      toast.error("Nome e email são obrigatórios");
      setLoadingProfile(false);
      return;
    }

    try {
      // Atualizar email no Firebase se mudou
      if (auth.currentUser && profileData.email !== aluno?.email) {
        await updateEmail(auth.currentUser, profileData.email);
      }

      // Atualizar no banco de dados
      updateAluno.mutate(profileData);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar email");
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPassword(true);

    if (!passwordData.senhaAtual || !passwordData.novaSenha || !passwordData.confirmarSenha) {
      toast.error("Preencha todos os campos de senha");
      setLoadingPassword(false);
      return;
    }

    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      toast.error("As senhas não coincidem");
      setLoadingPassword(false);
      return;
    }

    if (passwordData.novaSenha.length < 6) {
      toast.error("A nova senha deve ter no mínimo 6 caracteres");
      setLoadingPassword(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        toast.error("Usuário não autenticado");
        setLoadingPassword(false);
        return;
      }

      // Reautenticar com senha atual
      const credential = EmailAuthProvider.credential(user.email, passwordData.senhaAtual);
      await reauthenticateWithCredential(user, credential);

      // Atualizar senha
      await updatePassword(user, passwordData.novaSenha);

      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        senhaAtual: "",
        novaSenha: "",
        confirmarSenha: "",
      });
      setLoadingPassword(false);
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        toast.error("Senha atual incorreta");
      } else {
        toast.error(error.message || "Erro ao alterar senha");
      }
      setLoadingPassword(false);
    }
  };

  if (!aluno) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais e preferências de conta
        </p>
      </div>

      {/* Edição de Perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Informações do Perfil</CardTitle>
          </div>
          <CardDescription>
            Atualize suas informações pessoais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={profileData.nome}
                onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="seu@email.com"
              />
              <p className="text-xs text-muted-foreground">
                Alterar o email requer reautenticação
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular">Celular</Label>
              <Input
                id="celular"
                value={profileData.celular}
                onChange={(e) => setProfileData({ ...profileData, celular: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <Button type="submit" disabled={loadingProfile}>
              {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loadingProfile ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Alteração de Senha */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Alterar Senha</CardTitle>
          </div>
          <CardDescription>
            Atualize sua senha de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual">Senha Atual *</Label>
              <Input
                id="senhaAtual"
                type="password"
                value={passwordData.senhaAtual}
                onChange={(e) => setPasswordData({ ...passwordData, senhaAtual: e.target.value })}
                placeholder="Digite sua senha atual"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha *</Label>
              <Input
                id="novaSenha"
                type="password"
                value={passwordData.novaSenha}
                onChange={(e) => setPasswordData({ ...passwordData, novaSenha: e.target.value })}
                placeholder="Digite sua nova senha"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={passwordData.confirmarSenha}
                onChange={(e) => setPasswordData({ ...passwordData, confirmarSenha: e.target.value })}
                placeholder="Confirme sua nova senha"
              />
            </div>

            <Button type="submit" variant="secondary" disabled={loadingPassword}>
              {loadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loadingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

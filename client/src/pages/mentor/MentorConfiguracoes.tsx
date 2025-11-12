import { useState, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { mentorApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Building, Palette, Image } from "lucide-react";

export default function MentorConfiguracoes() {
  const { user, userData, changePassword } = useAuthContext();
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  const [configData, setConfigData] = useState({
    nomePlataforma: "",
    logoUrl: "",
    corPrincipal: "#3b82f6",
  });

  const [passwordData, setPasswordData] = useState({
    novaSenha: "",
    confirmarSenha: "",
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoadingConfig(true);
      const config = await mentorApi.getConfig();
      setConfigData({
        nomePlataforma: config.nomePlataforma || "",
        logoUrl: config.logoUrl || "",
        corPrincipal: config.corPrincipal || "#3b82f6",
      });
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar configurações");
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!configData.nomePlataforma) {
      toast.error("Nome da plataforma é obrigatório");
      return;
    }

    try {
      setIsSavingConfig(true);
      await mentorApi.updateConfig(configData);
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordData.novaSenha || !passwordData.confirmarSenha) {
      toast.error("Preencha todos os campos de senha");
      return;
    }

    if (passwordData.novaSenha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (passwordData.novaSenha !== passwordData.confirmarSenha) {
      toast.error("As senhas não coincidem");
      return;
    }

    try {
      setIsSavingPassword(true);
      await changePassword(passwordData.novaSenha);
      toast.success("Senha alterada com sucesso!");
      setPasswordData({ novaSenha: "", confirmarSenha: "" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações e preferências
        </p>
      </div>

      <div className="space-y-6">
        {/* Informações do Perfil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Perfil
            </CardTitle>
            <CardDescription>
              Suas informações pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={userData?.name || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled />
            </div>
            <p className="text-xs text-muted-foreground">
              Entre em contato com o gestor para alterar essas informações
            </p>
          </CardContent>
        </Card>

        {/* Configurações da Plataforma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Configurações da Plataforma
            </CardTitle>
            <CardDescription>
              Personalize a aparência da plataforma para seus alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomePlataforma">Nome da Plataforma *</Label>
                <Input
                  id="nomePlataforma"
                  value={configData.nomePlataforma}
                  onChange={(e) =>
                    setConfigData({ ...configData, nomePlataforma: e.target.value })
                  }
                  placeholder="Mentoria ENEM Pro"
                  required
                  disabled={isLoadingConfig}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">
                  <span className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    URL do Logo
                  </span>
                </Label>
                <Input
                  id="logoUrl"
                  type="url"
                  value={configData.logoUrl}
                  onChange={(e) =>
                    setConfigData({ ...configData, logoUrl: e.target.value })
                  }
                  placeholder="https://exemplo.com/logo.png"
                  disabled={isLoadingConfig}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="corPrincipal">
                  <span className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cor Principal
                  </span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="corPrincipal"
                    type="color"
                    value={configData.corPrincipal}
                    onChange={(e) =>
                      setConfigData({ ...configData, corPrincipal: e.target.value })
                    }
                    className="w-20 h-10"
                    disabled={isLoadingConfig}
                  />
                  <Input
                    type="text"
                    value={configData.corPrincipal}
                    onChange={(e) =>
                      setConfigData({ ...configData, corPrincipal: e.target.value })
                    }
                    placeholder="#3b82f6"
                    className="flex-1 font-mono"
                    disabled={isLoadingConfig}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSavingConfig || isLoadingConfig}
              >
                {isSavingConfig ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Atualize sua senha de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <Input
                  id="novaSenha"
                  type="password"
                  value={passwordData.novaSenha}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, novaSenha: e.target.value })
                  }
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                <Input
                  id="confirmarSenha"
                  type="password"
                  value={passwordData.confirmarSenha}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmarSenha: e.target.value })
                  }
                  placeholder="Digite a senha novamente"
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                disabled={isSavingPassword}
              >
                {isSavingPassword ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

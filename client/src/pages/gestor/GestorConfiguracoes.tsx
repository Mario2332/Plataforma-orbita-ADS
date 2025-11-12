import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock } from "lucide-react";

export default function GestorConfiguracoes() {
  const { user, userData, changePassword } = useAuthContext();
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    novaSenha: "",
    confirmarSenha: "",
  });

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
            <div className="space-y-2">
              <Label>Função</Label>
              <Input value="Gestor" disabled />
            </div>
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

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { alunoApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, User, Lock, Loader2, Camera, Trash2, Upload } from "lucide-react";
import { getAuth, updateEmail, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export default function AlunoConfiguracoes() {
  const { refreshUserData, userData } = useAuthContext();
  const [aluno, setAluno] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const loadAluno = async () => {
    try {
      setIsLoading(true);
      const data = await alunoApi.getMe();
      setAluno(data);
      setProfileData({
        nome: data.nome || "",
        email: data.email || "",
        celular: data.celular || "",
      });
      setPhotoPreview(data.photoURL || userData?.photoURL || null);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar dados do aluno");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAluno();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);

    if (!profileData.nome || !profileData.email) {
      toast.error("Nome e email são obrigatórios");
      setLoadingProfile(false);
      return;
    }

    try {
      const auth = getAuth();
      // Atualizar email no Firebase se mudou
      if (auth.currentUser && profileData.email !== aluno?.email) {
        await updateEmail(auth.currentUser, profileData.email);
      }

      // Atualizar no banco de dados
      await alunoApi.updateProfile({ nome: profileData.nome, celular: profileData.celular });
      toast.success("Perfil atualizado com sucesso!");
      await loadAluno();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar perfil");
    } finally {
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
      const auth = getAuth();
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
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        toast.error("Senha atual incorreta");
      } else {
        toast.error(error.message || "Erro ao alterar senha");
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Tamanho máximo: 5MB");
      return;
    }

    // Ler arquivo e criar preview
    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setPhotoPreview(imageData);

      // Fazer upload
      await uploadPhoto(imageData);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (imageData: string) => {
    try {
      setLoadingPhoto(true);
      const uploadProfilePhoto = httpsCallable(functions, "uploadProfilePhoto");
      
      const result = await uploadProfilePhoto({ imageData });
      const data = result.data as any;

      if (data.success) {
        toast.success("Foto de perfil atualizada com sucesso!");
        await loadAluno(); // Recarregar dados do aluno primeiro
        await refreshUserData(); // Depois atualizar contexto
      }
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error(error.message || "Erro ao fazer upload da foto");
      setPhotoPreview(aluno?.photoURL || null);
    } finally {
      setLoadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirm("Tem certeza que deseja remover sua foto de perfil?")) {
      return;
    }

    try {
      setLoadingPhoto(true);
      const deleteProfilePhoto = httpsCallable(functions, "deleteProfilePhoto");
           const result = await deleteProfilePhoto();
      const data = result.data as any;

      if (data.success) {
        toast.success("Foto de perfil removida com sucesso!");
        await loadAluno(); // Recarregar dados do aluno primeiro
        await refreshUserData(); // Depois atualizar contexto
      }
    } catch (error: any) {
      console.error("Erro ao deletar foto:", error);
      toast.error(error.message || "Erro ao remover foto");
    } finally {
      setLoadingPhoto(false);
    }
  };

  if (isLoading) {
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

      {/* Foto de Perfil */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <CardTitle>Foto de Perfil</CardTitle>
          </div>
          <CardDescription>
            Adicione ou atualize sua foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Preview da foto */}
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              {loadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex flex-col gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingPhoto}
                variant="outline"
                className="w-full md:w-auto"
              >
                <Upload className="mr-2 h-4 w-4" />
                {photoPreview ? "Alterar Foto" : "Adicionar Foto"}
              </Button>

              {photoPreview && (
                <Button
                  onClick={handleDeletePhoto}
                  disabled={loadingPhoto}
                  variant="destructive"
                  className="w-full md:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover Foto
                </Button>
              )}

              <p className="text-xs text-muted-foreground">
                Formatos aceitos: JPG, PNG, WebP (máx. 5MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

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
                Alterar o email pode exigir reautenticação.
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

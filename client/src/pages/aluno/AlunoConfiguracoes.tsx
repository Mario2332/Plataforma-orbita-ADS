import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { alunoApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Settings, User, Lock, Loader2, Camera, Trash2, Upload, Zap, Sparkles } from "lucide-react";
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
    curso: "",
    faculdade: "",
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
        curso: data.curso || userData?.curso || "",
        faculdade: data.faculdade || userData?.faculdade || "",
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

  useEffect(() => {
    if (userData?.photoURL && !photoPreview) {
      setPhotoPreview(userData.photoURL);
    }
  }, [userData?.photoURL]);

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
      if (auth.currentUser && profileData.email !== aluno?.email) {
        await updateEmail(auth.currentUser, profileData.email);
      }

      await alunoApi.updateProfile({ 
        nome: profileData.nome, 
        celular: profileData.celular,
        curso: profileData.curso,
        faculdade: profileData.faculdade 
      });
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

      const credential = EmailAuthProvider.credential(user.email, passwordData.senhaAtual);
      await reauthenticateWithCredential(user, credential);
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

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Tamanho máximo: 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const imageData = event.target?.result as string;
      setPhotoPreview(imageData);
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
        await loadAluno();
        await refreshUserData();
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
        await loadAluno();
        await refreshUserData();
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
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-emerald-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Zap className="h-5 w-5 text-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-fade-in">

      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-500 p-4 text-white animate-slide-up">
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <Settings className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold mb-2">Configurações</h1>
            <p className="text-emerald-50 text-lg">Gerencie suas informações pessoais e preferências de conta</p>
          </div>
        </div>
      </div>

      <Card className="border-2 hover:shadow-sm transition-shadow rounded-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl shadow">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">Foto de Perfil</CardTitle>
              <CardDescription className="font-semibold">Adicione ou atualize sua foto de perfil</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative group">
              <div className="w-40 h-40 rounded-full overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 border-4 border-emerald-200 shadow-sm group-hover:scale-[1.01] transition-transform">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100">
                    <User className="w-20 h-20 text-emerald-400" />
                  </div>
                )}
              </div>
              {loadingPhoto && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <Zap className="h-4 w-4 text-white animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 flex-1">
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
                className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold shadow border-0"
              >
                <Upload className="mr-2 h-4 w-4" />
                {photoPreview ? "Alterar Foto" : "Adicionar Foto"}
              </Button>

              {photoPreview && (
                <Button
                  onClick={handleDeletePhoto}
                  disabled={loadingPhoto}
                  variant="destructive"
                  className="w-full md:w-auto font-bold shadow"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover Foto
                </Button>
              )}

              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border-2 border-emerald-200/50">
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Formatos aceitos: JPG, PNG, WebP (máx. 5MB)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <Card className="border-2 hover:shadow-sm transition-shadow rounded-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl shadow">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">Informações do Perfil</CardTitle>
              <CardDescription className="font-semibold">Atualize suas informações pessoais</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="nome" className="font-bold text-base">Nome Completo *</Label>
              <Input
                id="nome"
                value={profileData.nome}
                onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
                placeholder="Seu nome completo"
                className="border-2 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-base">Email *</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                placeholder="seu@email.com"
                className="border-2 font-semibold"
              />
              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Alterar o email pode exigir reautenticação.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="celular" className="font-bold text-base">Celular</Label>
              <Input
                id="celular"
                value={profileData.celular}
                onChange={(e) => setProfileData({ ...profileData, celular: e.target.value })}
                placeholder="(00) 00000-0000"
                className="border-2 font-semibold"
              />
            </div>

            <Separator className="my-4" />
            
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl border-2 border-purple-200/50">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2">
                🎯 Objetivo de Aprovação
              </h3>
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-4">
                Informe o curso e a faculdade em que você deseja ser aprovado. Essas informações aparecerão no seu perfil.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="curso" className="font-bold text-base">Curso Desejado</Label>
                  <Input
                    id="curso"
                    value={profileData.curso}
                    onChange={(e) => setProfileData({ ...profileData, curso: e.target.value })}
                    placeholder="Ex: Medicina, Direito, Engenharia..."
                    className="border-2 font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="faculdade" className="font-bold text-base">Faculdade/Universidade</Label>
                  <Input
                    id="faculdade"
                    value={profileData.faculdade}
                    onChange={(e) => setProfileData({ ...profileData, faculdade: e.target.value })}
                    placeholder="Ex: USP, UNICAMP, UFG..."
                    className="border-2 font-semibold"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loadingProfile}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold shadow border-0"
            >
              {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loadingProfile ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <Card className="border-2 hover:shadow-sm transition-shadow rounded-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl shadow">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">Alterar Senha</CardTitle>
              <CardDescription className="font-semibold">Atualize sua senha de acesso</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="senhaAtual" className="font-bold text-base">Senha Atual *</Label>
              <Input
                id="senhaAtual"
                type="password"
                value={passwordData.senhaAtual}
                onChange={(e) => setPasswordData({ ...passwordData, senhaAtual: e.target.value })}
                placeholder="Digite sua senha atual"
                className="border-2 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novaSenha" className="font-bold text-base">Nova Senha *</Label>
              <Input
                id="novaSenha"
                type="password"
                value={passwordData.novaSenha}
                onChange={(e) => setPasswordData({ ...passwordData, novaSenha: e.target.value })}
                placeholder="Digite sua nova senha"
                className="border-2 font-semibold"
              />
              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Mínimo de 6 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha" className="font-bold text-base">Confirmar Nova Senha *</Label>
              <Input
                id="confirmarSenha"
                type="password"
                value={passwordData.confirmarSenha}
                onChange={(e) => setPasswordData({ ...passwordData, confirmarSenha: e.target.value })}
                placeholder="Confirme sua nova senha"
                className="border-2 font-semibold"
              />
            </div>

            <Button 
              type="submit" 
              disabled={loadingPassword}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold shadow border-0"
            >
              {loadingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loadingPassword ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes float-delayed { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-30px); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
      `}</style>
    </div>
  );
}

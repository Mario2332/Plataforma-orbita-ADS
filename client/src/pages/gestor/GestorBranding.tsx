import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Palette, 
  Image, 
  Save, 
  Upload, 
  Eye, 
  RefreshCw,
  Check,
  AlertCircle,
  Settings,
  Globe,
  Megaphone
} from "lucide-react";
import { toast } from "sonner";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, currentProject } from "@/lib/firebase";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";

interface BrandingConfig {
  logo: string;
  favicon?: string;
  corPrimaria: string;
  corPrimariaHover: string;
  corSecundaria: string;
  nomeExibicao: string;
}

interface AdsConfig {
  exibirAnuncios: boolean;
  googleAdsClientId: string;
  slots: {
    header: string;
    sidebar: string;
    inContent: string;
    footer: string;
  };
}

export default function GestorBranding() {
  const { user } = useAuthContext();
  const { tenant, isLoading: tenantLoading } = useTenant();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [branding, setBranding] = useState<BrandingConfig>({
    logo: "/logo.png",
    corPrimaria: "#10b981",
    corPrimariaHover: "#059669",
    corSecundaria: "#14b8a6",
    nomeExibicao: "Plataforma Órbita",
  });
  
  const [ads, setAds] = useState<AdsConfig>({
    exibirAnuncios: false,
    googleAdsClientId: "",
    slots: {
      header: "",
      sidebar: "",
      inContent: "",
      footer: "",
    },
  });
  
  const [dominios, setDominios] = useState<string[]>([]);
  const [novoDominio, setNovoDominio] = useState("");
  
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Carregar configurações do tenant
  useEffect(() => {
    if (tenant) {
      setBranding(tenant.branding);
      setAds({
        exibirAnuncios: tenant.ads.exibirAnuncios,
        googleAdsClientId: tenant.ads.googleAdsClientId || "",
        slots: tenant.ads.slots || { header: "", sidebar: "", inContent: "", footer: "" },
      });
      setDominios(tenant.dominios || []);
      setIsLoading(false);
    }
  }, [tenant]);

  // Upload de logo
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const tenantId = tenant?.id || "default";
      const storageRef = ref(storage, `tenants/${tenantId}/logo-${Date.now()}.${file.name.split('.').pop()}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      setBranding(prev => ({ ...prev, logo: downloadURL }));
      toast.success("Logo enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar logo:", error);
      toast.error("Erro ao enviar logo. Tente novamente.");
    } finally {
      setUploadingLogo(false);
    }
  };

  // Salvar configurações
  const handleSave = async () => {
    if (!tenant?.id) {
      toast.error("Tenant não encontrado");
      return;
    }

    setIsSaving(true);
    try {
      const tenantRef = doc(db, "tenants", tenant.id);
      
      await updateDoc(tenantRef, {
        branding,
        ads,
        dominios,
        atualizadoEm: new Date(),
      });

      toast.success("Configurações salvas com sucesso!");
      
      // Recarregar página para aplicar mudanças
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // Adicionar domínio
  const handleAddDominio = () => {
    if (!novoDominio.trim()) return;
    
    // Validar formato do domínio
    const dominioRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    if (!dominioRegex.test(novoDominio) && !novoDominio.includes("localhost")) {
      toast.error("Formato de domínio inválido");
      return;
    }

    if (dominios.includes(novoDominio)) {
      toast.error("Este domínio já foi adicionado");
      return;
    }

    setDominios(prev => [...prev, novoDominio]);
    setNovoDominio("");
    toast.success("Domínio adicionado");
  };

  // Remover domínio
  const handleRemoveDominio = (dominio: string) => {
    setDominios(prev => prev.filter(d => d !== dominio));
  };

  if (isLoading || tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500 p-3 rounded-xl">
            <Palette className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Personalização da Plataforma
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Configure a identidade visual e anúncios do seu tenant
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Projeto Firebase atual: <code className="bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded">{currentProject}</code>
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="branding" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="dominios" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Domínios
          </TabsTrigger>
          <TabsTrigger value="anuncios" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Anúncios
          </TabsTrigger>
        </TabsList>

        {/* Tab: Branding */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Logo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Logo da Plataforma
                </CardTitle>
                <CardDescription>
                  Envie o logo que será exibido na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600">
                    {branding.logo ? (
                      <img 
                        src={branding.logo} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <Image className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      Enviar Logo
                    </Button>
                    <p className="text-xs text-gray-500">PNG, JPG ou SVG. Máx 2MB.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nome */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Nome da Plataforma
                </CardTitle>
                <CardDescription>
                  Nome que será exibido no título e cabeçalho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="nomeExibicao">Nome de Exibição</Label>
                  <Input
                    id="nomeExibicao"
                    value={branding.nomeExibicao}
                    onChange={(e) => setBranding(prev => ({ ...prev, nomeExibicao: e.target.value }))}
                    placeholder="Nome da sua plataforma"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Cores da Marca
              </CardTitle>
              <CardDescription>
                Defina as cores principais da sua plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="corPrimaria">Cor Primária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="corPrimaria"
                      value={branding.corPrimaria}
                      onChange={(e) => setBranding(prev => ({ ...prev, corPrimaria: e.target.value }))}
                      className="w-12 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={branding.corPrimaria}
                      onChange={(e) => setBranding(prev => ({ ...prev, corPrimaria: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="corPrimariaHover">Cor Primária (Hover)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="corPrimariaHover"
                      value={branding.corPrimariaHover}
                      onChange={(e) => setBranding(prev => ({ ...prev, corPrimariaHover: e.target.value }))}
                      className="w-12 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={branding.corPrimariaHover}
                      onChange={(e) => setBranding(prev => ({ ...prev, corPrimariaHover: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="corSecundaria">Cor Secundária</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="corSecundaria"
                      value={branding.corSecundaria}
                      onChange={(e) => setBranding(prev => ({ ...prev, corSecundaria: e.target.value }))}
                      className="w-12 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={branding.corSecundaria}
                      onChange={(e) => setBranding(prev => ({ ...prev, corSecundaria: e.target.value }))}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Preview</p>
                <div className="flex items-center gap-4">
                  <button
                    className="px-4 py-2 rounded-lg text-white font-medium transition-colors"
                    style={{ backgroundColor: branding.corPrimaria }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = branding.corPrimariaHover}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = branding.corPrimaria}
                  >
                    Botão Primário
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: branding.corSecundaria }}
                  >
                    Botão Secundário
                  </button>
                  <span 
                    className="font-semibold"
                    style={{ color: branding.corPrimaria }}
                  >
                    Texto Colorido
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Domínios */}
        <TabsContent value="dominios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Domínios Personalizados
              </CardTitle>
              <CardDescription>
                Configure os domínios que apontam para esta plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={novoDominio}
                  onChange={(e) => setNovoDominio(e.target.value)}
                  placeholder="exemplo.com.br"
                  onKeyDown={(e) => e.key === "Enter" && handleAddDominio()}
                />
                <Button onClick={handleAddDominio}>
                  Adicionar
                </Button>
              </div>

              <div className="space-y-2">
                {dominios.map((dominio) => (
                  <div
                    key={dominio}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <span className="font-mono text-sm">{dominio}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDominio(dominio)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Nota:</strong> Para usar um domínio personalizado, você precisa configurar o DNS 
                  apontando para o Firebase Hosting. Consulte a documentação do Firebase para mais detalhes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Anúncios */}
        <TabsContent value="anuncios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Configuração de Anúncios
              </CardTitle>
              <CardDescription>
                Configure o Google AdSense para monetização
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="space-y-1">
                  <Label htmlFor="exibirAnuncios" className="text-base font-medium">
                    Exibir Anúncios
                  </Label>
                  <p className="text-sm text-gray-500">
                    Ative para mostrar anúncios do Google AdSense na plataforma
                  </p>
                </div>
                <Switch
                  id="exibirAnuncios"
                  checked={ads.exibirAnuncios}
                  onCheckedChange={(checked) => setAds(prev => ({ ...prev, exibirAnuncios: checked }))}
                />
              </div>

              {ads.exibirAnuncios && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="googleAdsClientId">Google AdSense Publisher ID</Label>
                    <Input
                      id="googleAdsClientId"
                      value={ads.googleAdsClientId}
                      onChange={(e) => setAds(prev => ({ ...prev, googleAdsClientId: e.target.value }))}
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500">
                      Encontre seu Publisher ID no painel do Google AdSense
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-base">Slots de Anúncio</Label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="slotHeader">Header (728x90)</Label>
                        <Input
                          id="slotHeader"
                          value={ads.slots.header}
                          onChange={(e) => setAds(prev => ({ 
                            ...prev, 
                            slots: { ...prev.slots, header: e.target.value } 
                          }))}
                          placeholder="Slot ID"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slotSidebar">Sidebar (300x250)</Label>
                        <Input
                          id="slotSidebar"
                          value={ads.slots.sidebar}
                          onChange={(e) => setAds(prev => ({ 
                            ...prev, 
                            slots: { ...prev.slots, sidebar: e.target.value } 
                          }))}
                          placeholder="Slot ID"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slotInContent">Entre Conteúdo (336x280)</Label>
                        <Input
                          id="slotInContent"
                          value={ads.slots.inContent}
                          onChange={(e) => setAds(prev => ({ 
                            ...prev, 
                            slots: { ...prev.slots, inContent: e.target.value } 
                          }))}
                          placeholder="Slot ID"
                          className="font-mono"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="slotFooter">Footer (728x90)</Label>
                        <Input
                          id="slotFooter"
                          value={ads.slots.footer}
                          onChange={(e) => setAds(prev => ({ 
                            ...prev, 
                            slots: { ...prev.slots, footer: e.target.value } 
                          }))}
                          placeholder="Slot ID"
                          className="font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Dica:</strong> Anúncios só serão exibidos após a aprovação do Google AdSense. 
                  Enquanto isso, espaços de placeholder serão mostrados para visualização.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {isSaving ? (
            <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAlunoApi } from "@/hooks/useAlunoApi";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, FileText, BarChart3, AlertCircle, Filter, Upload, X, Image as ImageIcon, Zap, Target, TrendingDown, Lightbulb } from "lucide-react";
import { criarPlanosDeAutodiagnostico } from "@/lib/firestore-direct";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

const AREAS_ENEM = [
  { value: "linguagens", label: "Linguagens" },
  { value: "humanas", label: "Humanas" },
  { value: "natureza", label: "Natureza" },
  { value: "matematica", label: "Matemática" },
];

const MOTIVOS_ERRO = [
  { value: "interpretacao", label: "Interpretação", color: "#3b82f6" },
  { value: "atencao", label: "Atenção", color: "#06b6d4" },
  { value: "lacuna_teorica", label: "Lacuna Teórica", color: "#0ea5e9" },
  { value: "nao_estudado", label: "Não Estudado", color: "#6366f1" },
];

interface Questao {
  id: string;
  numeroQuestao: string;
  area: string;
  macroassunto: string;
  microassunto: string;
  motivoErro: string;
  anotacoes?: string;
  imagemUrl?: string;
}

export default function AlunoAutodiagnostico() {
  const alunoApi = useAlunoApi();
  const [autodiagnosticos, setAutodiagnosticos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Record<number, boolean>>({});
  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({});
  const [filtroArea, setFiltroArea] = useState<string>("geral");
  const [filtroTempo, setFiltroTempo] = useState<string>("todo");
  const [prova, setProva] = useState("");
  const [dataProva, setDataProva] = useState(new Date().toISOString().split('T')[0]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [questoes, setQuestoes] = useState<Questao[]>([
    { id: crypto.randomUUID(), numeroQuestao: "", area: "", macroassunto: "", microassunto: "", motivoErro: "", anotacoes: "" }
  ]);
  const questoesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAutodiagnosticos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAutodiagnosticos = async () => {
    try {
      setIsLoading(true);
      const response = await alunoApi.getAutodiagnosticos();
      
      // Garantir que todas as questões tenham IDs únicos
      const autodiagnosticosComIds = (response || []).map((auto: any) => ({
        ...auto,
        questoes: (auto.questoes || []).map((q: any) => ({
          ...q,
          id: q.id || crypto.randomUUID()
        }))
      }));
      
      setAutodiagnosticos(autodiagnosticosComIds);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar autodiagnósticos");
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestao = () => {
    // Adicionar nova questão no final do array
    setQuestoes([...questoes, { id: crypto.randomUUID(), numeroQuestao: "", area: "", macroassunto: "", microassunto: "", motivoErro: "", anotacoes: "" }]);
    // Scroll automático para o topo do container de questões
    setTimeout(() => {
      questoesContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const removeQuestao = (index: number) => {
    if (questoes.length === 1) {
      toast.error("É necessário ter pelo menos uma questão");
      return;
    }
    setQuestoes(questoes.filter((_, i) => i !== index));
  };

  const updateQuestao = (index: number, field: keyof Questao, value: string) => {
    const novasQuestoes = [...questoes];
    novasQuestoes[index][field] = value;
    setQuestoes(novasQuestoes);
  };

  const handleImageUpload = async (index: number, file: File) => {
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato de imagem não suportado. Use JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > maxSize) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }
    try {
      setUploadingImages(prev => ({ ...prev, [index]: true }));
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `autodiagnosticos/temp/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      const novasQuestoes = [...questoes];
      novasQuestoes[index].imagemUrl = downloadURL;
      setQuestoes(novasQuestoes);
      toast.success("Imagem carregada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao fazer upload da imagem:", error);
      toast.error("Erro ao fazer upload da imagem");
    } finally {
      setUploadingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleRemoveImage = (index: number) => {
    const novasQuestoes = [...questoes];
    novasQuestoes[index].imagemUrl = undefined;
    setQuestoes(novasQuestoes);
    toast.success("Imagem removida");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prova.trim()) {
      toast.error("Informe o nome da prova");
      return;
    }
    if (!dataProva) {
      toast.error("Informe a data da prova");
      return;
    }
    const questoesValidas = questoes.filter(q => 
      q.numeroQuestao.trim() && q.area && q.macroassunto.trim() && q.microassunto.trim() && q.motivoErro
    );
    if (questoesValidas.length === 0) {
      toast.error("Adicione pelo menos uma questão completa");
      return;
    }
    try {
      setIsSaving(true);
      if (editandoId) {
        await alunoApi.updateAutodiagnostico(editandoId, {
          prova: prova.trim(),
          dataProva: new Date(dataProva),
          questoes: questoesValidas
        });
        toast.success("Autodiagnóstico atualizado com sucesso!");
      } else {
        await alunoApi.createAutodiagnostico({
          prova: prova.trim(),
          dataProva: new Date(dataProva),
          questoes: questoesValidas
        });
        toast.success("Autodiagnóstico salvo com sucesso!");
        
        // Criar planos de ação automaticamente para erros por interpretação ou lacuna teórica
        try {
          await criarPlanosDeAutodiagnostico(prova.trim(), questoesValidas);
        } catch (planoError) {
          console.error("Erro ao criar planos de ação:", planoError);
          // Não mostrar erro ao usuário, pois o autodiagnóstico foi salvo com sucesso
        }
      }
      setProva("");
      setDataProva(new Date().toISOString().split('T')[0]);
      setEditandoId(null);
      setQuestoes([{ id: crypto.randomUUID(), numeroQuestao: "", area: "", macroassunto: "", microassunto: "", motivoErro: "", anotacoes: "" }]);
      await loadAutodiagnosticos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar autodiagnóstico");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (autodiagnostico: any) => {
    setEditandoId(autodiagnostico.id);
    setProva(autodiagnostico.prova);
    
    // Converter dataProva para formato YYYY-MM-DD
    let dataFormatada = new Date().toISOString().split('T')[0];
    if (autodiagnostico.dataProva) {
      if (autodiagnostico.dataProva.toDate) {
        dataFormatada = autodiagnostico.dataProva.toDate().toISOString().split('T')[0];
      } else if (autodiagnostico.dataProva.seconds || autodiagnostico.dataProva._seconds) {
        const seconds = autodiagnostico.dataProva.seconds || autodiagnostico.dataProva._seconds;
        dataFormatada = new Date(seconds * 1000).toISOString().split('T')[0];
      } else {
        dataFormatada = new Date(autodiagnostico.dataProva).toISOString().split('T')[0];
      }
    }
    setDataProva(dataFormatada);
    
    // Adicionar IDs às questões se não tiverem
    const questoesComId = (autodiagnostico.questoes || []).map((q: any) => ({
      ...q,
      id: q.id || crypto.randomUUID()
    }));
    setQuestoes(questoesComId.length > 0 ? questoesComId : [{ id: crypto.randomUUID(), numeroQuestao: "", area: "", macroassunto: "", microassunto: "", motivoErro: "", anotacoes: "" }]);
    
    // Scroll para o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info("Editando autodiagnóstico");
  };

  const handleCancelEdit = () => {
    setEditandoId(null);
    setProva("");
    setDataProva(new Date().toISOString().split('T')[0]);
    setQuestoes([{ id: crypto.randomUUID(), numeroQuestao: "", area: "", macroassunto: "", microassunto: "", motivoErro: "", anotacoes: "" }]);
    toast.info("Edição cancelada");
  };

  const handleDelete = async (autodiagnosticoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este autodiagnóstico?")) return;
    try {
      await alunoApi.deleteAutodiagnostico(autodiagnosticoId);
      toast.success("Autodiagnóstico excluído com sucesso!");
      await loadAutodiagnosticos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir autodiagnóstico");
    }
  };

  const getMotivoErro = (value: string) => MOTIVOS_ERRO.find(m => m.value === value);
  const getAreaLabel = (value: string) => AREAS_ENEM.find(a => a.value === value)?.label || value;

  const autodiagnosticosFiltrados = useMemo(() => {
    let filtrados = [...autodiagnosticos];
    if (filtroTempo !== "todo") {
      const dataLimite = new Date();
      if (filtroTempo === "1mes") dataLimite.setMonth(dataLimite.getMonth() - 1);
      if (filtroTempo === "3meses") dataLimite.setMonth(dataLimite.getMonth() - 3);
      if (filtroTempo === "6meses") dataLimite.setMonth(dataLimite.getMonth() - 6);
      if (filtroTempo === "12meses") dataLimite.setMonth(dataLimite.getMonth() - 12);
      filtrados = filtrados.filter(auto => {
        // Usar dataProva se existir, senão usar createdAt como fallback
        let dataAuto;
        if (auto.dataProva) {
          if (auto.dataProva.toDate) {
            dataAuto = auto.dataProva.toDate();
          } else if (auto.dataProva.seconds || auto.dataProva._seconds) {
            const seconds = auto.dataProva.seconds || auto.dataProva._seconds;
            dataAuto = new Date(seconds * 1000);
          } else {
            dataAuto = new Date(auto.dataProva);
          }
        } else if (auto.createdAt) {
          dataAuto = auto.createdAt.toDate ? auto.createdAt.toDate() : new Date(auto.createdAt);
        } else {
          return false; // Sem data, não incluir
        }
        return dataAuto >= dataLimite;
      });
    }
    if (filtroArea !== "geral") {
      filtrados = filtrados.map(auto => ({
        ...auto,
        questoes: auto.questoes?.filter((q: Questao) => q.area === filtroArea) || []
      })).filter(auto => auto.questoes.length > 0);
    }
    return filtrados;
  }, [autodiagnosticos, filtroTempo, filtroArea]);

  const dadosDistribuicao = useMemo(() => {
    const contagem: Record<string, number> = {};
    MOTIVOS_ERRO.forEach(m => { contagem[m.value] = 0; });
    autodiagnosticosFiltrados.forEach(auto => {
      auto.questoes?.forEach((q: Questao) => {
        if (q.motivoErro) contagem[q.motivoErro] = (contagem[q.motivoErro] || 0) + 1;
      });
    });
    return MOTIVOS_ERRO.map(m => ({
      nome: m.label,
      quantidade: contagem[m.value] || 0,
      cor: m.color
    }));
  }, [autodiagnosticosFiltrados]);

  const totalErros = dadosDistribuicao.reduce((sum, d) => sum + d.quantidade, 0);

  const contagemPorArea = useMemo(() => {
    const contagem: Record<string, number> = {};
    AREAS_ENEM.forEach(a => { contagem[a.value] = 0; });
    autodiagnosticos.forEach(auto => {
      auto.questoes?.forEach((q: Questao) => {
        if (q.area) contagem[q.area] = (contagem[q.area] || 0) + 1;
      });
    });
    return contagem;
  }, [autodiagnosticos]);

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
      {/* Elementos decorativos */}

      {/* Box Motivacional */}
      <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg animate-slide-up shadow">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="p-3 bg-emerald-500 rounded-xl shadow">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-base leading-relaxed text-gray-700 dark:text-gray-200">
                <strong className="font-semibold text-emerald-700 dark:text-emerald-400">Não encare seus erros como fracasso, mas sim como o GPS da sua aprovação.</strong> Cada questão errada mostra uma lacuna específica no seu conhecimento, funcionando como um mapa que ajuda a direcionar corretamente sua energia. Ao registrar seus erros aqui e corrigi-los, você transforma uma falha momentânea em retenção de longo prazo e garante que o seu esforço seja cirúrgico. <strong className="font-semibold text-teal-700 dark:text-teal-400">Quem mapeia o erro hoje, maximiza as chances de acerto no ENEM.</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário Premium */}
      <Card className="border-2 hover:shadow-sm transition-shadow rounded-lg animate-slide-up">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl shadow">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">{editandoId ? "Editar Autodiagnóstico" : "Novo Autodiagnóstico"}</CardTitle>
              <CardDescription className="text-base">Registre os erros de uma prova ou simulado para identificar padrões</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prova" className="font-bold">Nome da Prova/Simulado *</Label>
                <Input id="prova" placeholder="Ex: ENEM 2022, ENEM 2023, Simulado FUVEST..." value={prova} onChange={(e) => setProva(e.target.value)} required className="border-2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataProva" className="font-bold">Data da Prova *</Label>
                <Input id="dataProva" type="date" value={dataProva} onChange={(e) => setDataProva(e.target.value)} required className="border-2" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-bold">Questões Erradas</Label>
                <Button type="button" onClick={addQuestao} size="sm" className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Questão
                </Button>
              </div>
              <div ref={questoesContainerRef} className="space-y-4">
                {[...questoes].reverse().map((questao, reversedIndex) => {
                  const originalIndex = questoes.length - 1 - reversedIndex;
                  return (
                  <Card key={questao.id} className="p-4 border-2 hover:shadow transition-shadow">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white ">Questão {originalIndex + 1}</span>
                        {questoes.length > 1 && (
                          <Button type="button" onClick={() => removeQuestao(originalIndex)} size="sm" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-100">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-semibold">Número da Questão *</Label>
                          <Input placeholder="Ex: 45, Q12..." value={questao.numeroQuestao} onChange={(e) => updateQuestao(originalIndex, "numeroQuestao", e.target.value)} className="border-2" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold">Área *</Label>
                          <Select value={questao.area} onValueChange={(value) => updateQuestao(originalIndex, "area", value)}>
                            <SelectTrigger className="border-2">
                              <SelectValue placeholder="Selecione a área" />
                            </SelectTrigger>
                            <SelectContent>
                              {AREAS_ENEM.map(area => <SelectItem key={area.value} value={area.value}>{area.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold">Macroassunto *</Label>
                          <Input placeholder="Ex: Ecologia, Termologia..." value={questao.macroassunto} onChange={(e) => updateQuestao(originalIndex, "macroassunto", e.target.value)} className="border-2" />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold">Microassunto *</Label>
                          <Input placeholder="Ex: Relações ecológicas, Calorimetria..." value={questao.microassunto} onChange={(e) => updateQuestao(originalIndex, "microassunto", e.target.value)} className="border-2" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="font-semibold">Motivo do Erro *</Label>
                          <Select value={questao.motivoErro} onValueChange={(value) => updateQuestao(originalIndex, "motivoErro", value)}>
                            <SelectTrigger className="border-2">
                              <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                            <SelectContent>
                              {MOTIVOS_ERRO.map(motivo => <SelectItem key={motivo.value} value={motivo.value}>{motivo.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="font-semibold">Anotações (opcional)</Label>
                          <Textarea placeholder="Ex: Confundi o narrador com o personagem principal..." value={questao.anotacoes || ""} onChange={(e) => updateQuestao(originalIndex, "anotacoes", e.target.value)} rows={3} className="resize-none border-2" />
                          <p className="text-xs text-muted-foreground">Use este campo para registrar observações sobre o erro, raciocínio, ou pontos de atenção.</p>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="font-semibold">Imagem (opcional)</Label>
                          {questao.imagemUrl ? (
                            <div className="space-y-2">
                              <div className="relative rounded-lg border-2 overflow-hidden">
                                <img src={questao.imagemUrl} alt="Preview" className="w-full max-h-64 object-contain bg-muted" />
                                <Button type="button" onClick={() => handleRemoveImage(index)} size="sm" variant="destructive" className="absolute top-2 right-2">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(originalIndex, file); }} disabled={uploadingImages[originalIndex]} className="cursor-pointer border-2" />
                              {uploadingImages[originalIndex] && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                                  Enviando...
                                </div>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">Adicione uma imagem da questão ou do seu raciocínio (JPG, PNG ou WEBP, máx. 5MB)</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              {editandoId && (
                <Button type="button" onClick={handleCancelEdit} variant="outline" className="flex-1 font-bold text-lg py-3 border-2">
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isSaving} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold text-lg py-3">
                {isSaving ? "Salvando..." : editandoId ? "Atualizar Autodiagnóstico" : "Salvar Autodiagnóstico"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Gráfico Premium */}
      {autodiagnosticos.length > 0 && (
        <Card className="border-2 hover:shadow-sm transition-shadow rounded-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl shadow">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-semibold">Distribuição de Tipos de Erro</CardTitle>
                <CardDescription className="text-base">Análise de {totalErros} erros registrados {filtroArea !== "geral" && `em ${getAreaLabel(filtroArea)}`}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 space-y-2">
                <Label className="flex items-center gap-2 text-sm font-bold">
                  <Filter className="h-4 w-4" />
                  Filtrar por Área
                </Label>
                <Select value={filtroArea} onValueChange={setFiltroArea}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral (Todas as Áreas)</SelectItem>
                    {AREAS_ENEM.map(area => (
                      <SelectItem key={area.value} value={area.value}>{area.label} ({contagemPorArea[area.value] || 0})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label className="flex items-center gap-2 text-sm font-bold">
                  <Filter className="h-4 w-4" />
                  Filtrar por Período
                </Label>
                <Select value={filtroTempo} onValueChange={setFiltroTempo}>
                  <SelectTrigger className="border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo o Período</SelectItem>
                    <SelectItem value="1mes">Último Mês</SelectItem>
                    <SelectItem value="3meses">Últimos 3 Meses</SelectItem>
                    <SelectItem value="6meses">Últimos 6 Meses</SelectItem>
                    <SelectItem value="12meses">Últimos 12 Meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {totalErros > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosDistribuicao}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="nome" stroke="#6b7280" />
                    <YAxis allowDecimals={false} stroke="#6b7280" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', fontWeight: 'bold' }} />
                    <Bar dataKey="quantidade" radius={[8, 8, 0, 0]}>
                      {dadosDistribuicao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-2">
                  <h4 className="font-semibold text-sm">💡 Insights:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {dadosDistribuicao.filter(d => d.quantidade > 0).sort((a, b) => b.quantidade - a.quantidade).map(d => {
                      const percentual = ((d.quantidade / totalErros) * 100).toFixed(1);
                      return (
                        <div key={d.nome} className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-200/50">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.cor }}></div>
                          <span className="font-semibold"><strong>{d.nome}:</strong> {d.quantidade} ({percentual}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                Nenhum erro registrado para os filtros selecionados
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista Premium */}
      <Card className="border-2 hover:shadow-sm transition-shadow rounded-lg animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl shadow">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold">Autodiagnósticos Salvos</CardTitle>
              <CardDescription className="text-base">
                {autodiagnosticos.length > 0 ? `${autodiagnosticos.length} autodiagnóstico(s) registrado(s)` : "Nenhum autodiagnóstico registrado ainda"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {autodiagnosticos.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {autodiagnosticos.map((auto) => {
                const questoesPorArea = AREAS_ENEM.reduce((acc, area) => {
                  acc[area.value] = auto.questoes?.filter((q: Questao) => q.area === area.value) || [];
                  return acc;
                }, {} as Record<string, Questao[]>);
                return (
                  <AccordionItem key={auto.id} value={auto.id} className="border-2 rounded-xl mb-4 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500 rounded-lg">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-left">
                            <div className="font-semibold">{auto.prova}</div>
                            <div className="text-sm text-muted-foreground font-semibold">
                              {auto.totalQuestoes || auto.questoes?.length || 0} questão(ões) errada(s)
                              {auto.dataProva && (
                                <span className="ml-2">• {(() => {
                                  if (auto.dataProva.toDate) return auto.dataProva.toDate().toLocaleDateString('pt-BR');
                                  if (auto.dataProva.seconds || auto.dataProva._seconds) {
                                    const seconds = auto.dataProva.seconds || auto.dataProva._seconds;
                                    return new Date(seconds * 1000).toLocaleDateString('pt-BR');
                                  }
                                  return new Date(auto.dataProva).toLocaleDateString('pt-BR');
                                })()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6 pt-4">
                        {AREAS_ENEM.map(area => {
                          const questoesDaArea = questoesPorArea[area.value];
                          if (!questoesDaArea || questoesDaArea.length === 0) return null;
                          return (
                            <div key={area.value} className="space-y-3">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                {area.label}
                                <span className="text-muted-foreground font-semibold">({questoesDaArea.length} questão{questoesDaArea.length !== 1 ? 'ões' : ''})</span>
                              </h4>
                              <div className="overflow-x-auto rounded-xl border-2">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                                      <th className="text-left py-2 px-3 font-semibold">Questão</th>
                                      <th className="text-left py-2 px-3 font-semibold">Macroassunto</th>
                                      <th className="text-left py-2 px-3 font-semibold">Microassunto</th>
                                      <th className="text-left py-2 px-3 font-semibold">Motivo do Erro</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {questoesDaArea.map((q: Questao, idx: number) => {
                                      const motivo = getMotivoErro(q.motivoErro);
                                      return (
                                        <>
                                          <tr key={idx} className="border-b last:border-0 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors">
                                            <td className="py-2 px-3 font-semibold">{q.numeroQuestao}</td>
                                            <td className="py-2 px-3">{q.macroassunto}</td>
                                            <td className="py-2 px-3">{q.microassunto}</td>
                                            <td className="py-2 px-3">
                                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: motivo?.color }}>
                                                {motivo?.label}
                                              </span>
                                            </td>
                                          </tr>
                                          {q.anotacoes && (
                                            <tr key={`${idx}-anotacoes`} className="border-b last:border-0 bg-emerald-50/50 dark:bg-emerald-950/10">
                                              <td colSpan={4} className="py-2 px-3">
                                                <div className="text-xs">
                                                  <span className="font-bold text-muted-foreground">Anotações:</span>
                                                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{q.anotacoes}</p>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                          {q.imagemUrl && (
                                            <tr key={`${idx}-imagem`} className="border-b last:border-0 bg-emerald-50/50 dark:bg-emerald-950/10">
                                              <td colSpan={4} className="py-2 px-3">
                                                <div className="text-xs space-y-2">
                                                  <button onClick={() => { const key = `${auto.id}-${idx}`; setExpandedImages(prev => ({ ...prev, [key]: !prev[key] })); }} className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                                                    <ImageIcon className="h-4 w-4" />
                                                    {expandedImages[`${auto.id}-${idx}`] ? 'Ocultar' : 'Ver'} Imagem da Questão
                                                    <span className="text-xs">{expandedImages[`${auto.id}-${idx}`] ? '▲' : '▼'}</span>
                                                  </button>
                                                  {expandedImages[`${auto.id}-${idx}`] && (
                                                    <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                      <div className="rounded-lg border-2 overflow-hidden bg-white">
                                                        <img src={q.imagemUrl} alt="Questão" className="w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(q.imagemUrl, '_blank')} />
                                                      </div>
                                                      <p className="text-muted-foreground italic text-xs">Clique na imagem para abrir em tamanho completo</p>
                                                    </div>
                                                  )}
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                        </>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                        <div className="flex justify-end gap-2 pt-2">
                          <Button onClick={() => handleEdit(auto)} variant="outline" size="sm" className="font-bold">
                            <FileText className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                          <Button onClick={() => handleDelete(auto.id)} variant="destructive" size="sm" className="font-bold">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full flex items-center justify-center">
                <FileText className="w-12 h-12 text-emerald-500" />
              </div>
              <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Nenhum autodiagnóstico registrado</p>
              <p className="text-sm text-muted-foreground mt-2">Comece criando seu primeiro autodiagnóstico acima!</p>
            </div>
          )}
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

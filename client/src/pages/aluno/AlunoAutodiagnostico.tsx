import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { alunoApi } from "@/lib/api";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, FileText, BarChart3, AlertCircle, Filter, Upload, X, Image as ImageIcon, Zap, Target } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

// Áreas do ENEM
const AREAS_ENEM = [
  { value: "linguagens", label: "Linguagens" },
  { value: "humanas", label: "Humanas" },
  { value: "natureza", label: "Natureza" },
  { value: "matematica", label: "Matemática" },
];

// Motivos de erro
const MOTIVOS_ERRO = [
  { value: "interpretacao", label: "Interpretação", color: "#3b82f6" },
  { value: "atencao", label: "Atenção", color: "#06b6d4" },
  { value: "lacuna_teorica", label: "Lacuna Teórica", color: "#0ea5e9" },
  { value: "nao_estudado", label: "Não Estudado", color: "#6366f1" },
];

interface Questao {
  numeroQuestao: string;
  area: string;
  macroassunto: string;
  microassunto: string;
  motivoErro: string;
  anotacoes?: string;
  imagemUrl?: string;
}

export default function AlunoAutodiagnostico() {
  const [autodiagnosticos, setAutodiagnosticos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Record<number, boolean>>({});
  const [expandedImages, setExpandedImages] = useState<Record<string, boolean>>({});
  
  // Filtros
  const [filtroArea, setFiltroArea] = useState<string>("geral");
  const [filtroTempo, setFiltroTempo] = useState<string>("todo");
  
  // Formulário
  const [prova, setProva] = useState("");
  const [questoes, setQuestoes] = useState<Questao[]>([
    { numeroQuestao: "", area: "", macroassunto: "", microassunto: "", motivoErro: "", anotacoes: "" }
  ]);

  useEffect(() => {
    loadAutodiagnosticos();
  }, []);

  const loadAutodiagnosticos = async () => {
    try {
      setIsLoading(true);
      const response = await alunoApi.getAutodiagnosticos();
      setAutodiagnosticos(response || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar autodiagnósticos");
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestao = () => {
    setQuestoes([...questoes, { numeroQuestao: "", area: "", macroassunto: "", microassunto: "", motivoErro: "", anotacoes: "" }]);
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
    // Validar arquivo
    const maxSize = 5 * 1024 * 1024; // 5MB
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

      // Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storageRef = ref(storage, `autodiagnosticos/temp/${fileName}`);

      // Upload
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Atualizar questão com URL da imagem
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

    // Validar questões
    const questoesValidas = questoes.filter(q => 
      q.numeroQuestao.trim() && q.area && q.macroassunto.trim() && q.microassunto.trim() && q.motivoErro
    );

    if (questoesValidas.length === 0) {
      toast.error("Adicione pelo menos uma questão completa");
      return;
    }

    try {
      setIsSaving(true);
      await alunoApi.createAutodiagnostico({
        prova: prova.trim(),
        questoes: questoesValidas
      });
      toast.success("Autodiagnóstico salvo com sucesso!");
      
      // Limpar formulário
      setProva("");
      setQuestoes([{ numeroQuestao: "", area: "", macroassunto: "", microassunto: "", motivoErro: "", anotacoes: "" }]);
      
      await loadAutodiagnosticos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar autodiagnóstico");
    } finally {
      setIsSaving(false);
    }
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

  const getMotivoErro = (value: string) => {
    return MOTIVOS_ERRO.find(m => m.value === value);
  };

  const getAreaLabel = (value: string) => {
    return AREAS_ENEM.find(a => a.value === value)?.label || value;
  };

  // Filtrar autodiagnósticos por tempo e área
  const autodiagnosticosFiltrados = useMemo(() => {
    let filtrados = [...autodiagnosticos];
    
    // Filtro de tempo
    if (filtroTempo !== "todo") {
      const dataLimite = new Date();
      if (filtroTempo === "1mes") dataLimite.setMonth(dataLimite.getMonth() - 1);
      if (filtroTempo === "3meses") dataLimite.setMonth(dataLimite.getMonth() - 3);
      if (filtroTempo === "6meses") dataLimite.setMonth(dataLimite.getMonth() - 6);
      if (filtroTempo === "12meses") dataLimite.setMonth(dataLimite.getMonth() - 12);
      
      filtrados = filtrados.filter(auto => {
        const dataAuto = auto.createdAt?.toDate ? auto.createdAt.toDate() : new Date(auto.createdAt);
        return dataAuto >= dataLimite;
      });
    }
    
    // Filtro de área
    if (filtroArea !== "geral") {
      filtrados = filtrados.map(auto => ({
        ...auto,
        questoes: auto.questoes?.filter((q: Questao) => q.area === filtroArea) || []
      })).filter(auto => auto.questoes.length > 0);
    }
    
    return filtrados;
  }, [autodiagnosticos, filtroTempo, filtroArea]);

  // Preparar dados para o gráfico de distribuição
  const dadosDistribuicao = useMemo(() => {
    const contagem: Record<string, number> = {};
    
    MOTIVOS_ERRO.forEach(m => {
      contagem[m.value] = 0;
    });

    autodiagnosticosFiltrados.forEach(auto => {
      auto.questoes?.forEach((q: Questao) => {
        if (q.motivoErro) {
          contagem[q.motivoErro] = (contagem[q.motivoErro] || 0) + 1;
        }
      });
    });

    return MOTIVOS_ERRO.map(m => ({
      nome: m.label,
      quantidade: contagem[m.value] || 0,
      cor: m.color
    }));
  }, [autodiagnosticosFiltrados]);

  const totalErros = dadosDistribuicao.reduce((sum, d) => sum + d.quantidade, 0);

  // Contagem por área
  const contagemPorArea = useMemo(() => {
    const contagem: Record<string, number> = {};
    
    AREAS_ENEM.forEach(a => {
      contagem[a.value] = 0;
    });

    autodiagnosticos.forEach(auto => {
      auto.questoes?.forEach((q: Questao) => {
        if (q.area) {
          contagem[q.area] = (contagem[q.area] || 0) + 1;
        }
      });
    });

    return contagem;
  }, [autodiagnosticos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando autodiagnósticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Novo Autodiagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Novo Autodiagnóstico
          </CardTitle>
          <CardDescription>
            Registre os erros de uma prova ou simulado para identificar padrões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome da Prova */}
            <div className="space-y-2">
              <Label htmlFor="prova">Nome da Prova/Simulado *</Label>
              <Input
                id="prova"
                placeholder="Ex: ENEM 2022, ENEM 2023, Simulado FUVEST..."
                value={prova}
                onChange={(e) => setProva(e.target.value)}
                required
              />
            </div>

            {/* Questões Erradas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Questões Erradas</Label>
                <Button type="button" onClick={addQuestao} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Questão
                </Button>
              </div>

              <div className="space-y-4">
                {questoes.map((questao, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Questão {index + 1}</span>
                        {questoes.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeQuestao(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Número da Questão *</Label>
                          <Input
                            placeholder="Ex: 45, Q12..."
                            value={questao.numeroQuestao}
                            onChange={(e) => updateQuestao(index, "numeroQuestao", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Área *</Label>
                          <Select
                            value={questao.area}
                            onValueChange={(value) => updateQuestao(index, "area", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a área" />
                            </SelectTrigger>
                            <SelectContent>
                              {AREAS_ENEM.map(area => (
                                <SelectItem key={area.value} value={area.value}>
                                  {area.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Macroassunto *</Label>
                          <Input
                            placeholder="Ex: Ecologia, Termologia..."
                            value={questao.macroassunto}
                            onChange={(e) => updateQuestao(index, "macroassunto", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Microassunto *</Label>
                          <Input
                            placeholder="Ex: Relações ecológicas, Calorimetria..."
                            value={questao.microassunto}
                            onChange={(e) => updateQuestao(index, "microassunto", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Motivo do Erro *</Label>
                          <Select
                            value={questao.motivoErro}
                            onValueChange={(value) => updateQuestao(index, "motivoErro", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                            <SelectContent>
                              {MOTIVOS_ERRO.map(motivo => (
                                <SelectItem key={motivo.value} value={motivo.value}>
                                  {motivo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Anotações (opcional)</Label>
                          <Textarea
                            placeholder="Ex: Confundi o narrador com o personagem principal..."
                            value={questao.anotacoes || ""}
                            onChange={(e) => updateQuestao(index, "anotacoes", e.target.value)}
                            rows={3}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            Use este campo para registrar observações sobre o erro, raciocínio, ou pontos de atenção.
                          </p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label>Imagem (opcional)</Label>
                          {questao.imagemUrl ? (
                            <div className="space-y-2">
                              <div className="relative rounded-lg border overflow-hidden">
                                <img 
                                  src={questao.imagemUrl} 
                                  alt="Preview" 
                                  className="w-full max-h-64 object-contain bg-muted"
                                />
                                <Button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  size="sm"
                                  variant="destructive"
                                  className="absolute top-2 right-2"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleImageUpload(index, file);
                                }}
                                disabled={uploadingImages[index]}
                                className="cursor-pointer"
                              />
                              {uploadingImages[index] && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                  Enviando...
                                </div>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Adicione uma imagem da questão ou do seu raciocínio (JPG, PNG ou WEBP, máx. 5MB)
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? "Salvando..." : "Salvar Autodiagnóstico"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Gráfico de Distribuição */}
      {autodiagnosticos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição de Tipos de Erro
            </CardTitle>
            <CardDescription>
              Análise de {totalErros} erros registrados {filtroArea !== "geral" && `em ${getAreaLabel(filtroArea)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4" />
                  Filtrar por Área
                </Label>
                <Select value={filtroArea} onValueChange={setFiltroArea}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="geral">Geral (Todas as Áreas)</SelectItem>
                    {AREAS_ENEM.map(area => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label} ({contagemPorArea[area.value] || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Filter className="h-4 w-4" />
                  Filtrar por Período
                </Label>
                <Select value={filtroTempo} onValueChange={setFiltroTempo}>
                  <SelectTrigger>
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosDistribuicao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="quantidade" radius={[8, 8, 0, 0]}>
                    {dadosDistribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                Nenhum erro registrado para os filtros selecionados
              </div>
            )}

            {/* Insights */}
            {totalErros > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="font-medium text-sm">💡 Insights:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {dadosDistribuicao
                    .filter(d => d.quantidade > 0)
                    .sort((a, b) => b.quantidade - a.quantidade)
                    .map(d => {
                      const percentual = ((d.quantidade / totalErros) * 100).toFixed(1);
                      return (
                        <div key={d.nome} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.cor }}></div>
                          <span className="text-muted-foreground">
                            <strong>{d.nome}:</strong> {d.quantidade} ({percentual}%)
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Autodiagnósticos */}
      <Card>
        <CardHeader>
          <CardTitle>Autodiagnósticos Salvos</CardTitle>
          <CardDescription>
            {autodiagnosticos.length > 0
              ? `${autodiagnosticos.length} autodiagnóstico(s) registrado(s)`
              : "Nenhum autodiagnóstico registrado ainda"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {autodiagnosticos.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {autodiagnosticos.map((auto) => {
                // Agrupar questões por área
                const questoesPorArea = AREAS_ENEM.reduce((acc, area) => {
                  acc[area.value] = auto.questoes?.filter((q: Questao) => q.area === area.value) || [];
                  return acc;
                }, {} as Record<string, Questao[]>);

                return (
                  <AccordionItem key={auto.id} value={auto.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div className="text-left">
                            <div className="font-medium">{auto.prova}</div>
                            <div className="text-sm text-muted-foreground">
                              {auto.totalQuestoes || auto.questoes?.length || 0} questão(ões) errada(s)
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-6 pt-4">
                        {/* Questões agrupadas por área */}
                        {AREAS_ENEM.map(area => {
                          const questoesDaArea = questoesPorArea[area.value];
                          if (!questoesDaArea || questoesDaArea.length === 0) return null;

                          return (
                            <div key={area.value} className="space-y-3">
                              <h4 className="font-semibold text-sm flex items-center gap-2">
                                {area.label}
                                <span className="text-muted-foreground font-normal">
                                  ({questoesDaArea.length} questão{questoesDaArea.length !== 1 ? 'ões' : ''})
                                </span>
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-2 px-3">Questão</th>
                                      <th className="text-left py-2 px-3">Macroassunto</th>
                                      <th className="text-left py-2 px-3">Microassunto</th>
                                      <th className="text-left py-2 px-3">Motivo do Erro</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {questoesDaArea.map((q: Questao, idx: number) => {
                                      const motivo = getMotivoErro(q.motivoErro);
                                      return (
                                        <>
                                          <tr key={idx} className="border-b last:border-0">
                                            <td className="py-2 px-3">{q.numeroQuestao}</td>
                                            <td className="py-2 px-3">{q.macroassunto}</td>
                                            <td className="py-2 px-3">{q.microassunto}</td>
                                            <td className="py-2 px-3">
                                              <span 
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                                                style={{ backgroundColor: motivo?.color }}
                                              >
                                                {motivo?.label}
                                              </span>
                                            </td>
                                          </tr>
                                          {q.anotacoes && (
                                            <tr key={`${idx}-anotacoes`} className="border-b last:border-0 bg-muted/30">
                                              <td colSpan={4} className="py-2 px-3">
                                                <div className="text-xs">
                                                  <span className="font-medium text-muted-foreground">Anotações:</span>
                                                  <p className="mt-1 text-muted-foreground whitespace-pre-wrap">{q.anotacoes}</p>
                                                </div>
                                              </td>
                                            </tr>
                                          )}
                                          {q.imagemUrl && (
                                            <tr key={`${idx}-imagem`} className="border-b last:border-0 bg-muted/30">
                                              <td colSpan={4} className="py-2 px-3">
                                                <div className="text-xs space-y-2">
                                                  <button
                                                    onClick={() => {
                                                      const key = `${auto.id}-${idx}`;
                                                      setExpandedImages(prev => ({
                                                        ...prev,
                                                        [key]: !prev[key]
                                                      }));
                                                    }}
                                                    className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                                  >
                                                    <ImageIcon className="h-4 w-4" />
                                                    {expandedImages[`${auto.id}-${idx}`] ? 'Ocultar' : 'Ver'} Imagem da Questão
                                                    <span className="text-xs text-muted-foreground">
                                                      {expandedImages[`${auto.id}-${idx}`] ? '▲' : '▼'}
                                                    </span>
                                                  </button>
                                                  
                                                  {expandedImages[`${auto.id}-${idx}`] && (
                                                    <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                      <div className="rounded-lg border overflow-hidden bg-white">
                                                        <img 
                                                          src={q.imagemUrl} 
                                                          alt="Questão" 
                                                          className="w-full max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                                          onClick={() => window.open(q.imagemUrl, '_blank')}
                                                        />
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

                        {/* Botão de Excluir */}
                        <div className="flex justify-end pt-2">
                          <Button
                            onClick={() => handleDelete(auto.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Excluir Autodiagnóstico
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum autodiagnóstico registrado</p>
              <p className="text-sm mt-2">Comece criando seu primeiro autodiagnóstico acima!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

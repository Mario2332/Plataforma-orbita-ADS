import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlunoApi } from "@/hooks/useAlunoApi";
import { FileText, Plus, Trash2, TrendingUp, Edit, Zap, BarChart3, Target, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AlunoAutodiagnostico from "./AlunoAutodiagnostico";
import ErrorBoundary from "@/components/ErrorBoundary";

type AreaFiltro = "total" | "linguagens" | "humanas" | "natureza" | "matematica";
type MetricaFiltro = "acertos" | "tempo";

const DIFICULDADES = [
  { value: "nao_informado", label: "Não informado" },
  { value: "muito_facil", label: "Muito Fácil" },
  { value: "facil", label: "Fácil" },
  { value: "media", label: "Média" },
  { value: "dificil", label: "Difícil" },
  { value: "muito_dificil", label: "Muito Difícil" },
];

const formatarTempo = (minutos: number): string => {
  if (minutos === 0) return "-";
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  if (horas === 0) return `${mins}min`;
  if (mins === 0) return `${horas}h`;
  return `${horas}h${mins}min`;
};

export default function AlunoSimulados() {
  const api = useAlunoApi();
  const [activeTab, setActiveTab] = useState("simulados");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [simulados, setSimulados] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [areaFiltro, setAreaFiltro] = useState<AreaFiltro>("total");
  const [metricaFiltro, setMetricaFiltro] = useState<MetricaFiltro>("acertos");

  const [formData, setFormData] = useState({
    nome: "",
    data: new Date().toISOString().split("T")[0],
    linguagensAcertos: 0,
    linguagensTempo: 0,
    humanasAcertos: 0,
    humanasTempo: 0,
    naturezaAcertos: 0,
    naturezaTempo: 0,
    matematicaAcertos: 0,
    matematicaTempo: 0,
    redacaoNota: 0,
    redacaoTempo: 0,
    dificuldadeDia1: "nao_informado",
    dificuldadeDia2: "nao_informado",
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      data: new Date().toISOString().split("T")[0],
      linguagensAcertos: 0,
      linguagensTempo: 0,
      humanasAcertos: 0,
      humanasTempo: 0,
      naturezaAcertos: 0,
      naturezaTempo: 0,
      matematicaAcertos: 0,
      matematicaTempo: 0,
      redacaoNota: 0,
      redacaoTempo: 0,
      dificuldadeDia1: "nao_informado",
      dificuldadeDia2: "nao_informado",
    });
    setEditandoId(null);
  };

  const loadSimulados = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSimulados();
      setSimulados(data as any[]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar simulados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSimulados();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error("Nome do simulado é obrigatório");
      return;
    }
    try {
      setIsSaving(true);
      const [ano, mes, dia] = formData.data.split('-').map(Number);
      const dataLocal = new Date(ano, mes - 1, dia, 12, 0, 0);
      if (editandoId) {
        await api.updateSimulado({ simuladoId: editandoId, ...formData, data: dataLocal });
        toast.success("Simulado atualizado!");
      } else {
        await api.createSimulado({ ...formData, data: dataLocal });
        toast.success("Simulado registrado!");
      }
      setDialogOpen(false);
      resetForm();
      await loadSimulados();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar simulado");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (simulado: any) => {
    let data: Date;
    try {
      if (simulado.data?.seconds || simulado.data?._seconds) {
        const seconds = simulado.data.seconds || simulado.data._seconds;
        data = new Date(seconds * 1000);
      } else if (simulado.data?.toDate) {
        data = simulado.data.toDate();
      } else {
        data = new Date(simulado.data);
      }
    } catch {
      data = new Date();
    }
    setFormData({
      nome: simulado.nome || "",
      data: data.toISOString().split("T")[0],
      linguagensAcertos: simulado.linguagensAcertos || 0,
      linguagensTempo: simulado.linguagensTempo || 0,
      humanasAcertos: simulado.humanasAcertos || 0,
      humanasTempo: simulado.humanasTempo || 0,
      naturezaAcertos: simulado.naturezaAcertos || 0,
      naturezaTempo: simulado.naturezaTempo || 0,
      matematicaAcertos: simulado.matematicaAcertos || 0,
      matematicaTempo: simulado.matematicaTempo || 0,
      redacaoNota: simulado.redacaoNota || 0,
      redacaoTempo: simulado.redacaoTempo || 0,
      dificuldadeDia1: simulado.dificuldadeDia1 || "nao_informado",
      dificuldadeDia2: simulado.dificuldadeDia2 || "nao_informado",
    });
    setEditandoId(simulado.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este simulado?")) {
      try {
        await api.deleteSimulado(id);
        toast.success("Simulado excluído!");
        await loadSimulados();
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir simulado");
      }
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) resetForm();
  };

  const prepararDadosGrafico = () => {
    if (!simulados || simulados.length === 0) return [];
    return simulados.map(s => {
      let data: Date;
      try {
        if (s.data?.seconds || s.data?._seconds) {
          const seconds = s.data.seconds || s.data._seconds;
          data = new Date(seconds * 1000);
        } else if (s.data?.toDate) {
          data = s.data.toDate();
        } else {
          data = new Date(s.data);
        }
      } catch {
        return null;
      }
      const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      let valor: number;
      let label: string;
      if (metricaFiltro === "acertos") {
        switch (areaFiltro) {
          case "linguagens": valor = s.linguagensAcertos || 0; label = "Linguagens"; break;
          case "humanas": valor = s.humanasAcertos || 0; label = "Humanas"; break;
          case "natureza": valor = s.naturezaAcertos || 0; label = "Natureza"; break;
          case "matematica": valor = s.matematicaAcertos || 0; label = "Matemática"; break;
          default: valor = (s.linguagensAcertos || 0) + (s.humanasAcertos || 0) + (s.naturezaAcertos || 0) + (s.matematicaAcertos || 0); label = "Total";
        }
      } else {
        switch (areaFiltro) {
          case "linguagens": valor = s.linguagensTempo || 0; label = "Linguagens"; break;
          case "humanas": valor = s.humanasTempo || 0; label = "Humanas"; break;
          case "natureza": valor = s.naturezaTempo || 0; label = "Natureza"; break;
          case "matematica": valor = s.matematicaTempo || 0; label = "Matemática"; break;
          default: valor = (s.linguagensTempo || 0) + (s.humanasTempo || 0) + (s.naturezaTempo || 0) + (s.matematicaTempo || 0); label = "Total";
        }
      }
      return { data: dataFormatada, [label]: valor, nome: s.nome };
    }).filter(Boolean).reverse();
  };

  const dadosGrafico = prepararDadosGrafico();
  const labelGrafico = areaFiltro === "total" ? "Total" : areaFiltro === "linguagens" ? "Linguagens" : areaFiltro === "humanas" ? "Humanas" : areaFiltro === "natureza" ? "Natureza" : "Matemática";
  const getDificuldadeLabel = (value: string) => DIFICULDADES.find(d => d.value === value)?.label || "Não informado";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Zap className="h-8 w-8 text-blue-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Elementos decorativos */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-float-delayed pointer-events-none" />

      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/20 via-cyan-500/10 to-sky-500/10 p-8 border-2 border-white/20 dark:border-white/10 backdrop-blur-xl shadow-2xl animate-slide-up">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-50 animate-pulse-slow" />
              <div className="relative bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-500 p-4 rounded-2xl shadow-2xl">
                <FileText className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-cyan-600 to-sky-600 bg-clip-text text-transparent animate-gradient">
              Simulados
            </h1>
          </div>
          <p className="text-lg text-muted-foreground font-medium">
            Registre seus simulados e acompanhe sua evolução 📝
          </p>
        </div>
      </div>

      {/* Tabs Premium */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <TabsList className="grid w-full grid-cols-2 p-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-2 border-blue-200/50 dark:border-blue-800/50 rounded-2xl h-auto">
          <TabsTrigger 
            value="simulados" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold text-base py-3 rounded-xl transition-all"
          >
            <FileText className="w-5 h-5 mr-2" />
            Meus Simulados
          </TabsTrigger>
          <TabsTrigger 
            value="autodiagnostico" 
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-xl font-bold text-base py-3 rounded-xl transition-all"
          >
            <Target className="w-5 h-5 mr-2" />
            Autodiagnóstico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulados" className="space-y-6 mt-6">
          {/* Gráfico de Evolução Premium */}
          <Card className="border-2 hover:shadow-2xl transition-shadow rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black">Evolução</CardTitle>
                    <CardDescription className="text-base">Acompanhe seu progresso ao longo do tempo</CardDescription>
                  </div>
                </div>
                <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-xl hover:shadow-2xl font-bold hover:-translate-y-0.5 transition-all">
                      <Plus className="mr-2 h-5 w-5" />
                      Novo Simulado
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto border-2">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-black">{editandoId ? "Editar Simulado" : "Novo Simulado"}</DialogTitle>
                      <DialogDescription className="text-base">Preencha os dados do simulado realizado</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <Label htmlFor="nome" className="font-bold">Nome do Simulado *</Label>
                          <Input id="nome" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Simulado ENEM 2024" required className="border-2 mt-2" />
                        </div>
                        <div>
                          <Label htmlFor="data" className="font-bold">Data</Label>
                          <Input id="data" type="date" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} className="border-2 mt-2" />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-black text-lg flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                          Linguagens e Códigos (45 questões)
                        </h3>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-200/50">
                          <div>
                            <Label htmlFor="linguagensAcertos" className="font-semibold">Acertos</Label>
                            <Input id="linguagensAcertos" type="number" min="0" max="45" value={formData.linguagensAcertos} onChange={(e) => setFormData({...formData, linguagensAcertos: Number(e.target.value)})} className="border-2 mt-2" />
                          </div>
                          <div>
                            <Label htmlFor="linguagensTempo" className="font-semibold">Tempo (minutos)</Label>
                            <Input id="linguagensTempo" type="number" min="0" value={formData.linguagensTempo} onChange={(e) => setFormData({...formData, linguagensTempo: Number(e.target.value)})} className="border-2 mt-2" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-black text-lg flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-gradient-to-b from-cyan-500 to-sky-500 rounded-full" />
                          Ciências Humanas (45 questões)
                        </h3>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-xl border-2 border-cyan-200/50">
                          <div>
                            <Label htmlFor="humanasAcertos" className="font-semibold">Acertos</Label>
                            <Input id="humanasAcertos" type="number" min="0" max="45" value={formData.humanasAcertos} onChange={(e) => setFormData({...formData, humanasAcertos: Number(e.target.value)})} className="border-2 mt-2" />
                          </div>
                          <div>
                            <Label htmlFor="humanasTempo" className="font-semibold">Tempo (minutos)</Label>
                            <Input id="humanasTempo" type="number" min="0" value={formData.humanasTempo} onChange={(e) => setFormData({...formData, humanasTempo: Number(e.target.value)})} className="border-2 mt-2" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-black text-lg flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-gradient-to-b from-sky-500 to-blue-500 rounded-full" />
                          Ciências da Natureza (45 questões)
                        </h3>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-sky-50 dark:bg-sky-950/20 rounded-xl border-2 border-sky-200/50">
                          <div>
                            <Label htmlFor="naturezaAcertos" className="font-semibold">Acertos</Label>
                            <Input id="naturezaAcertos" type="number" min="0" max="45" value={formData.naturezaAcertos} onChange={(e) => setFormData({...formData, naturezaAcertos: Number(e.target.value)})} className="border-2 mt-2" />
                          </div>
                          <div>
                            <Label htmlFor="naturezaTempo" className="font-semibold">Tempo (minutos)</Label>
                            <Input id="naturezaTempo" type="number" min="0" value={formData.naturezaTempo} onChange={(e) => setFormData({...formData, naturezaTempo: Number(e.target.value)})} className="border-2 mt-2" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-black text-lg flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-blue-500 rounded-full" />
                          Matemática (45 questões)
                        </h3>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border-2 border-indigo-200/50">
                          <div>
                            <Label htmlFor="matematicaAcertos" className="font-semibold">Acertos</Label>
                            <Input id="matematicaAcertos" type="number" min="0" max="45" value={formData.matematicaAcertos} onChange={(e) => setFormData({...formData, matematicaAcertos: Number(e.target.value)})} className="border-2 mt-2" />
                          </div>
                          <div>
                            <Label htmlFor="matematicaTempo" className="font-semibold">Tempo (minutos)</Label>
                            <Input id="matematicaTempo" type="number" min="0" value={formData.matematicaTempo} onChange={(e) => setFormData({...formData, matematicaTempo: Number(e.target.value)})} className="border-2 mt-2" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-black text-lg flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                          Redação
                        </h3>
                        <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border-2 border-blue-200/50">
                          <div>
                            <Label htmlFor="redacaoNota" className="font-semibold">Nota (0-1000)</Label>
                            <Input id="redacaoNota" type="number" min="0" max="1000" value={formData.redacaoNota} onChange={(e) => setFormData({...formData, redacaoNota: Number(e.target.value)})} className="border-2 mt-2" />
                          </div>
                          <div>
                            <Label htmlFor="redacaoTempo" className="font-semibold">Tempo (minutos)</Label>
                            <Input id="redacaoTempo" type="number" min="0" value={formData.redacaoTempo} onChange={(e) => setFormData({...formData, redacaoTempo: Number(e.target.value)})} className="border-2 mt-2" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="dificuldadeDia1" className="font-bold">Dificuldade 1º Dia</Label>
                          <Select value={formData.dificuldadeDia1} onValueChange={(value) => setFormData({...formData, dificuldadeDia1: value})}>
                            <SelectTrigger className="border-2 mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DIFICULDADES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="dificuldadeDia2" className="font-bold">Dificuldade 2º Dia</Label>
                          <Select value={formData.dificuldadeDia2} onValueChange={(value) => setFormData({...formData, dificuldadeDia2: value})}>
                            <SelectTrigger className="border-2 mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DIFICULDADES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => handleDialogClose(false)} className="border-2">Cancelar</Button>
                        <Button type="submit" disabled={isSaving} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 font-bold">
                          {isSaving ? "Salvando..." : editandoId ? "Atualizar" : "Salvar"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {simulados.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full flex items-center justify-center">
                    <FileText className="w-12 h-12 text-blue-500" />
                  </div>
                  <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Nenhum simulado registrado</p>
                  <p className="text-sm text-muted-foreground mt-2">Clique em "Novo Simulado" para começar</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 mb-6">
                    <Select value={areaFiltro} onValueChange={(v: AreaFiltro) => setAreaFiltro(v)}>
                      <SelectTrigger className="w-48 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total">Total (180)</SelectItem>
                        <SelectItem value="linguagens">Linguagens (45)</SelectItem>
                        <SelectItem value="humanas">Humanas (45)</SelectItem>
                        <SelectItem value="natureza">Natureza (45)</SelectItem>
                        <SelectItem value="matematica">Matemática (45)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={metricaFiltro} onValueChange={(v: MetricaFiltro) => setMetricaFiltro(v)}>
                      <SelectTrigger className="w-48 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="acertos">Acertos</SelectItem>
                        <SelectItem value="tempo">Tempo (min)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="data" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', fontWeight: 'bold' }} />
                      <Legend />
                      <Line type="monotone" dataKey={labelGrafico} stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>

          {/* Tabela de Simulados Premium */}
          <Card className="border-2 hover:shadow-2xl transition-shadow rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">Histórico</CardTitle>
                  <CardDescription className="text-base">Todos os simulados registrados</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {simulados.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground font-medium">Nenhum simulado para exibir</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border-2">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                        <TableHead className="font-black">Nome</TableHead>
                        <TableHead className="font-black">Data</TableHead>
                        <TableHead className="font-black">Ling.</TableHead>
                        <TableHead className="font-black">Hum.</TableHead>
                        <TableHead className="font-black">Nat.</TableHead>
                        <TableHead className="font-black">Mat.</TableHead>
                        <TableHead className="font-black">1º Dia</TableHead>
                        <TableHead className="font-black">Tempo 1º</TableHead>
                        <TableHead className="font-black">Dif. 1º</TableHead>
                        <TableHead className="font-black">2º Dia</TableHead>
                        <TableHead className="font-black">Tempo 2º</TableHead>
                        <TableHead className="font-black">Dif. 2º</TableHead>
                        <TableHead className="font-black">Total</TableHead>
                        <TableHead className="font-black">Redação</TableHead>
                        <TableHead className="text-right font-black">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simulados.map((simulado) => {
                        let data: Date;
                        try {
                          if (simulado.data?.seconds || simulado.data?._seconds) {
                            const seconds = simulado.data.seconds || simulado.data._seconds;
                            data = new Date(seconds * 1000);
                          } else if (simulado.data?.toDate) {
                            data = simulado.data.toDate();
                          } else {
                            data = new Date(simulado.data);
                          }
                        } catch {
                          data = new Date();
                        }
                        const linguagens = simulado.linguagensAcertos || 0;
                        const humanas = simulado.humanasAcertos || 0;
                        const natureza = simulado.naturezaAcertos || 0;
                        const matematica = simulado.matematicaAcertos || 0;
                        const dia1Acertos = linguagens + humanas;
                        const dia2Acertos = natureza + matematica;
                        const total = dia1Acertos + dia2Acertos;
                        const tempoDia1 = (simulado.linguagensTempo || 0) + (simulado.humanasTempo || 0) + (simulado.redacaoTempo || 0);
                        const tempoDia2 = (simulado.naturezaTempo || 0) + (simulado.matematicaTempo || 0);
                        return (
                          <TableRow key={simulado.id} className="hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                            <TableCell className="font-bold">{simulado.nome}</TableCell>
                            <TableCell className="font-semibold">{data.toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{linguagens}/45</TableCell>
                            <TableCell>{humanas}/45</TableCell>
                            <TableCell>{natureza}/45</TableCell>
                            <TableCell>{matematica}/45</TableCell>
                            <TableCell className="font-bold">{dia1Acertos}/90</TableCell>
                            <TableCell>{formatarTempo(tempoDia1)}</TableCell>
                            <TableCell className="text-sm">{getDificuldadeLabel(simulado.dificuldadeDia1)}</TableCell>
                            <TableCell className="font-bold">{dia2Acertos}/90</TableCell>
                            <TableCell>{formatarTempo(tempoDia2)}</TableCell>
                            <TableCell className="text-sm">{getDificuldadeLabel(simulado.dificuldadeDia2)}</TableCell>
                            <TableCell className="font-black text-lg">{total}/180</TableCell>
                            <TableCell className="font-bold">{simulado.redacaoNota > 0 ? simulado.redacaoNota : "-"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(simulado)} className="hover:bg-blue-100 dark:hover:bg-blue-900/30">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(simulado.id)} className="hover:bg-red-100 dark:hover:bg-red-900/30">
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="autodiagnostico">
          <ErrorBoundary 
            componentName="AlunoAutodiagnostico" 
            fallbackMessage="Erro ao carregar Autodiagnóstico"
          >
            <AlunoAutodiagnostico />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }
        .animate-gradient { background-size: 200% 200%; animation: gradient 3s ease infinite; }
        .animate-pulse-slow { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
      `}</style>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAlunoApi } from "@/hooks/useAlunoApi";
import { Plus, Trash2, Edit2, TrendingUp, Award, FileText, Clock, Target, AlertTriangle, ChevronDown, ChevronUp, PenTool, Zap, Star, Flame } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell, Legend } from "recharts";
import { db, auth } from "@/lib/firebase";
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, setDoc } from "firebase/firestore";

// Valores fixos das notas do ENEM por competência
const NOTAS_COMPETENCIA = [0, 40, 80, 120, 160, 200];

// Cores para as competências
const CORES_COMPETENCIAS = {
  c1: "#3b82f6", // blue
  c2: "#10b981", // green
  c3: "#f59e0b", // amber
  c4: "#8b5cf6", // purple
  c5: "#ef4444", // red
};

// Nomes das competências
const NOMES_COMPETENCIAS = {
  c1: "C1 - Norma Culta",
  c2: "C2 - Tema/Estrutura",
  c3: "C3 - Argumentação",
  c4: "C4 - Coesão",
  c5: "C5 - Proposta",
};

interface Redacao {
  id: string;
  titulo: string;
  data: string;
  tempoHoras: number;
  tempoMinutos: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
  notaTotal: number;
  criadoEm: Date;
}

interface RedacaoForm {
  titulo: string;
  data: string;
  tempoHoras: string;
  tempoMinutos: string;
  c1: string;
  c2: string;
  c3: string;
  c4: string;
  c5: string;
}

const initialForm: RedacaoForm = {
  titulo: "",
  data: new Date().toISOString().split('T')[0],
  tempoHoras: "1",
  tempoMinutos: "30",
  c1: "",
  c2: "",
  c3: "",
  c4: "",
  c5: "",
};

export default function AlunoRedacoes() {
  const alunoApi = useAlunoApi();
  const [redacoes, setRedacoes] = useState<Redacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<RedacaoForm>(initialForm);
  const [metaNota, setMetaNota] = useState<number>(900);
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>("todo");
  const [showHistorico, setShowHistorico] = useState(false);

  // Carregar redações do Firestore
  useEffect(() => {
    loadRedacoes();
    loadMeta();
  }, []);

  const getAlunoId = () => {
    // Se estiver em modo mentor, pegar o alunoId da URL
    const urlParams = new URLSearchParams(window.location.search);
    const alunoIdFromUrl = urlParams.get('alunoId');
    if (alunoIdFromUrl) return alunoIdFromUrl;
    
    // Caso contrário, usar o usuário logado
    return auth.currentUser?.uid || "";
  };

  const loadRedacoes = async () => {
    try {
      setIsLoading(true);
      const alunoId = getAlunoId();
      if (!alunoId) return;

      const redacoesRef = collection(db, "alunos", alunoId, "redacoes");
      const q = query(redacoesRef, orderBy("data", "desc"));
      const snapshot = await getDocs(q);
      
      const redacoesData: Redacao[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titulo: data.titulo || "",
          data: data.data || "",
          tempoHoras: data.tempoHoras || 0,
          tempoMinutos: data.tempoMinutos || 0,
          c1: data.c1 || 0,
          c2: data.c2 || 0,
          c3: data.c3 || 0,
          c4: data.c4 || 0,
          c5: data.c5 || 0,
          notaTotal: data.notaTotal || 0,
          criadoEm: data.criadoEm?.toDate() || new Date(),
        };
      });
      
      setRedacoes(redacoesData);
    } catch (error) {
      console.error("Erro ao carregar redações:", error);
      toast.error("Erro ao carregar redações");
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeta = async () => {
    try {
      const alunoId = getAlunoId();
      if (!alunoId) return;

      const snapshot = await getDocs(collection(db, "alunos", alunoId, "configuracoes"));
      const metaDoc = snapshot.docs.find(d => d.id === "redacoes");
      if (metaDoc) {
        setMetaNota(metaDoc.data().metaNota || 900);
      }
    } catch (error) {
      console.error("Erro ao carregar meta:", error);
    }
  };

  const saveMeta = async (novaMeta: number) => {
    try {
      const alunoId = getAlunoId();
      if (!alunoId) return;

      const metaRef = doc(db, "alunos", alunoId, "configuracoes", "redacoes");
      await setDoc(metaRef, { metaNota: novaMeta }, { merge: true });
      setMetaNota(novaMeta);
      toast.success("Meta atualizada!");
    } catch (error) {
      console.error("Erro ao salvar meta:", error);
      toast.error("Erro ao salvar meta");
    }
  };

  const calcularNotaTotal = (c1: number, c2: number, c3: number, c4: number, c5: number) => {
    return c1 + c2 + c3 + c4 + c5;
  };

  const handleSubmit = async () => {
    // Validações
    if (!form.titulo.trim()) {
      toast.error("Informe o título/tema da redação");
      return;
    }
    if (!form.data) {
      toast.error("Informe a data de realização");
      return;
    }
    if (!form.c1 || !form.c2 || !form.c3 || !form.c4 || !form.c5) {
      toast.error("Informe todas as notas por competência");
      return;
    }

    try {
      setIsSaving(true);
      const alunoId = getAlunoId();
      if (!alunoId) {
        toast.error("Usuário não identificado");
        return;
      }

      const notaTotal = calcularNotaTotal(
        parseInt(form.c1),
        parseInt(form.c2),
        parseInt(form.c3),
        parseInt(form.c4),
        parseInt(form.c5)
      );

      const redacaoData = {
        titulo: form.titulo.trim(),
        data: form.data,
        tempoHoras: parseInt(form.tempoHoras) || 0,
        tempoMinutos: parseInt(form.tempoMinutos) || 0,
        c1: parseInt(form.c1),
        c2: parseInt(form.c2),
        c3: parseInt(form.c3),
        c4: parseInt(form.c4),
        c5: parseInt(form.c5),
        notaTotal,
        criadoEm: Timestamp.now(),
      };

      if (editandoId) {
        // Atualizar redação existente
        const redacaoRef = doc(db, "alunos", alunoId, "redacoes", editandoId);
        await updateDoc(redacaoRef, redacaoData);
        toast.success("Redação atualizada com sucesso!");
      } else {
        // Criar nova redação
        await addDoc(collection(db, "alunos", alunoId, "redacoes"), redacaoData);
        toast.success("Redação registrada com sucesso!");
      }

      setForm(initialForm);
      setEditandoId(null);
      setIsDialogOpen(false);
      loadRedacoes();
    } catch (error) {
      console.error("Erro ao salvar redação:", error);
      toast.error("Erro ao salvar redação");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (redacao: Redacao) => {
    setForm({
      titulo: redacao.titulo,
      data: redacao.data,
      tempoHoras: redacao.tempoHoras.toString(),
      tempoMinutos: redacao.tempoMinutos.toString(),
      c1: redacao.c1.toString(),
      c2: redacao.c2.toString(),
      c3: redacao.c3.toString(),
      c4: redacao.c4.toString(),
      c5: redacao.c5.toString(),
    });
    setEditandoId(redacao.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta redação?")) return;

    try {
      const alunoId = getAlunoId();
      if (!alunoId) return;

      await deleteDoc(doc(db, "alunos", alunoId, "redacoes", id));
      toast.success("Redação excluída com sucesso!");
      loadRedacoes();
    } catch (error) {
      console.error("Erro ao excluir redação:", error);
      toast.error("Erro ao excluir redação");
    }
  };

  // Filtrar redações por período
  const redacoesFiltradas = useMemo(() => {
    if (filtroPeriodo === "todo") return redacoes;
    
    const hoje = new Date();
    const dataLimite = new Date();
    
    switch (filtroPeriodo) {
      case "30dias":
        dataLimite.setDate(hoje.getDate() - 30);
        break;
      case "90dias":
        dataLimite.setDate(hoje.getDate() - 90);
        break;
      case "6meses":
        dataLimite.setMonth(hoje.getMonth() - 6);
        break;
      case "1ano":
        dataLimite.setFullYear(hoje.getFullYear() - 1);
        break;
      default:
        return redacoes;
    }
    
    return redacoes.filter(r => new Date(r.data) >= dataLimite);
  }, [redacoes, filtroPeriodo]);

  // Estatísticas calculadas
  const estatisticas = useMemo(() => {
    if (redacoesFiltradas.length === 0) {
      return {
        mediaGeral: 0,
        melhorNota: 0,
        totalRedacoes: 0,
        tempoMedio: { horas: 0, minutos: 0 },
        tempoExcessivo: false,
        tempoAlerta: false,
        mediasCompetencias: { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 },
        pontoFraco: null as string | null,
      };
    }

    // Usar últimas 5 redações para média mais realista
    const ultimasRedacoes = redacoesFiltradas.slice(0, 5);
    const mediaGeral = Math.round(ultimasRedacoes.reduce((acc, r) => acc + r.notaTotal, 0) / ultimasRedacoes.length);
    const melhorNota = Math.max(...redacoesFiltradas.map(r => r.notaTotal));
    
    // Tempo médio
    const totalMinutos = redacoesFiltradas.reduce((acc, r) => acc + (r.tempoHoras * 60) + r.tempoMinutos, 0);
    const mediaMinutos = totalMinutos / redacoesFiltradas.length;
    const tempoMedio = {
      horas: Math.floor(mediaMinutos / 60),
      minutos: Math.round(mediaMinutos % 60),
    };
    
    // Alertas de tempo
    const tempoAlerta = mediaMinutos > 90 && mediaMinutos <= 120; // > 1h30 e <= 2h
    const tempoExcessivo = mediaMinutos > 120; // > 2h

    // Médias por competência
    const mediasCompetencias = {
      c1: Math.round(redacoesFiltradas.reduce((acc, r) => acc + r.c1, 0) / redacoesFiltradas.length),
      c2: Math.round(redacoesFiltradas.reduce((acc, r) => acc + r.c2, 0) / redacoesFiltradas.length),
      c3: Math.round(redacoesFiltradas.reduce((acc, r) => acc + r.c3, 0) / redacoesFiltradas.length),
      c4: Math.round(redacoesFiltradas.reduce((acc, r) => acc + r.c4, 0) / redacoesFiltradas.length),
      c5: Math.round(redacoesFiltradas.reduce((acc, r) => acc + r.c5, 0) / redacoesFiltradas.length),
    };

    // Identificar ponto fraco (menor média)
    const menorMedia = Math.min(...Object.values(mediasCompetencias));
    const pontoFraco = Object.entries(mediasCompetencias).find(([_, v]) => v === menorMedia)?.[0] || null;

    return {
      mediaGeral,
      melhorNota,
      totalRedacoes: redacoesFiltradas.length,
      tempoMedio,
      tempoExcessivo,
      tempoAlerta,
      mediasCompetencias,
      pontoFraco,
    };
  }, [redacoesFiltradas]);

  // Dados para o gráfico de evolução
  const dadosEvolucao = useMemo(() => {
    return [...redacoesFiltradas]
      .reverse()
      .map((r, index) => ({
        nome: `#${index + 1}`,
        data: new Date(r.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        nota: r.notaTotal,
        titulo: r.titulo,
      }));
  }, [redacoesFiltradas]);

  // Dados para o gráfico de radar
  const dadosRadar = useMemo(() => {
    return [
      { competencia: "C1", valor: estatisticas.mediasCompetencias.c1, fullMark: 200 },
      { competencia: "C2", valor: estatisticas.mediasCompetencias.c2, fullMark: 200 },
      { competencia: "C3", valor: estatisticas.mediasCompetencias.c3, fullMark: 200 },
      { competencia: "C4", valor: estatisticas.mediasCompetencias.c4, fullMark: 200 },
      { competencia: "C5", valor: estatisticas.mediasCompetencias.c5, fullMark: 200 },
    ];
  }, [estatisticas.mediasCompetencias]);

  // Dados para o gráfico de barras
  const dadosBarras = useMemo(() => {
    return [
      { nome: "C1", media: estatisticas.mediasCompetencias.c1, cor: CORES_COMPETENCIAS.c1, descricao: "Norma Culta" },
      { nome: "C2", media: estatisticas.mediasCompetencias.c2, cor: CORES_COMPETENCIAS.c2, descricao: "Tema/Estrutura" },
      { nome: "C3", media: estatisticas.mediasCompetencias.c3, cor: CORES_COMPETENCIAS.c3, descricao: "Argumentação" },
      { nome: "C4", media: estatisticas.mediasCompetencias.c4, cor: CORES_COMPETENCIAS.c4, descricao: "Coesão" },
      { nome: "C5", media: estatisticas.mediasCompetencias.c5, cor: CORES_COMPETENCIAS.c5, descricao: "Proposta" },
    ];
  }, [estatisticas.mediasCompetencias]);

  // Nota total calculada no formulário
  const notaTotalForm = useMemo(() => {
    const c1 = parseInt(form.c1) || 0;
    const c2 = parseInt(form.c2) || 0;
    const c3 = parseInt(form.c3) || 0;
    const c4 = parseInt(form.c4) || 0;
    const c5 = parseInt(form.c5) || 0;
    return c1 + c2 + c3 + c4 + c5;
  }, [form]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-orange-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <PenTool className="h-8 w-8 text-orange-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Elementos decorativos flutuantes */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-orange-500/5 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-float-delayed pointer-events-none" />

      {/* Header Premium com Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/20 via-red-500/10 to-amber-500/10 p-8 border-2 border-white/20 dark:border-white/10 backdrop-blur-xl shadow-2xl animate-slide-up">
        {/* Efeitos de luz */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-red-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        {/* Partículas decorativas */}
        <div className="absolute top-10 right-20 w-2 h-2 bg-orange-500 rounded-full animate-ping" />
        <div className="absolute top-20 right-40 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-10 left-20 w-2 h-2 bg-amber-500 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl blur-xl opacity-50 animate-pulse-slow" />
              <div className="relative bg-gradient-to-br from-orange-500 via-red-500 to-amber-500 p-4 rounded-2xl shadow-2xl">
                <PenTool className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 bg-clip-text text-transparent animate-gradient">
                Redações
              </h1>
              <p className="text-lg text-muted-foreground font-medium mt-1">
                Acompanhe sua evolução nas redações do ENEM ✍️
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
              <SelectTrigger className="w-[180px] border-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <SelectValue placeholder="Filtrar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo o período</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                <SelectItem value="6meses">Últimos 6 meses</SelectItem>
                <SelectItem value="1ano">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setForm(initialForm);
                setEditandoId(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-105">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Redação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    {editandoId ? "Editar Redação" : "Registrar Nova Redação"}
                  </DialogTitle>
                  <DialogDescription>
                    Preencha as informações da sua redação para acompanhar sua evolução
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6 py-4">
                  {/* Título/Tema */}
                  <div className="space-y-2">
                    <Label className="font-semibold">Título/Tema da Redação *</Label>
                    <Input
                      placeholder="Ex: A persistência da violência contra a mulher na sociedade brasileira"
                      value={form.titulo}
                      onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                      className="border-2 focus:border-orange-500 transition-colors"
                    />
                  </div>

                  {/* Data e Tempo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Data de Realização *</Label>
                      <Input
                        type="date"
                        value={form.data}
                        onChange={(e) => setForm({ ...form, data: e.target.value })}
                        className="border-2 focus:border-orange-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Tempo (Horas)</Label>
                      <Select value={form.tempoHoras} onValueChange={(v) => setForm({ ...form, tempoHoras: v })}>
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 1, 2, 3, 4].map(h => (
                            <SelectItem key={h} value={h.toString()}>{h}h</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Tempo (Minutos)</Label>
                      <Select value={form.tempoMinutos} onValueChange={(v) => setForm({ ...form, tempoMinutos: v })}>
                        <SelectTrigger className="border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[0, 15, 30, 45].map(m => (
                            <SelectItem key={m} value={m.toString()}>{m}min</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Notas por Competência */}
                  <div className="space-y-4">
                    <Label className="font-semibold text-lg">Notas por Competência *</Label>
                    <p className="text-sm text-muted-foreground">
                      Selecione a nota de cada competência conforme a correção da sua redação
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* C1 */}
                      <div className="space-y-2 p-4 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 dark:border-blue-800">
                        <Label className="font-semibold text-blue-700 dark:text-blue-400">C1 - Norma Culta</Label>
                        <Select value={form.c1} onValueChange={(v) => setForm({ ...form, c1: v })}>
                          <SelectTrigger className="border-2 border-blue-300 bg-white dark:bg-black/20">
                            <SelectValue placeholder="Selecione a nota" />
                          </SelectTrigger>
                          <SelectContent>
                            {NOTAS_COMPETENCIA.map(nota => (
                              <SelectItem key={nota} value={nota.toString()}>{nota}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* C2 */}
                      <div className="space-y-2 p-4 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 dark:border-green-800">
                        <Label className="font-semibold text-green-700 dark:text-green-400">C2 - Tema/Estrutura</Label>
                        <Select value={form.c2} onValueChange={(v) => setForm({ ...form, c2: v })}>
                          <SelectTrigger className="border-2 border-green-300 bg-white dark:bg-black/20">
                            <SelectValue placeholder="Selecione a nota" />
                          </SelectTrigger>
                          <SelectContent>
                            {NOTAS_COMPETENCIA.map(nota => (
                              <SelectItem key={nota} value={nota.toString()}>{nota}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* C3 */}
                      <div className="space-y-2 p-4 rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 dark:border-amber-800">
                        <Label className="font-semibold text-amber-700 dark:text-amber-400">C3 - Argumentação</Label>
                        <Select value={form.c3} onValueChange={(v) => setForm({ ...form, c3: v })}>
                          <SelectTrigger className="border-2 border-amber-300 bg-white dark:bg-black/20">
                            <SelectValue placeholder="Selecione a nota" />
                          </SelectTrigger>
                          <SelectContent>
                            {NOTAS_COMPETENCIA.map(nota => (
                              <SelectItem key={nota} value={nota.toString()}>{nota}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* C4 */}
                      <div className="space-y-2 p-4 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 dark:border-purple-800">
                        <Label className="font-semibold text-purple-700 dark:text-purple-400">C4 - Coesão</Label>
                        <Select value={form.c4} onValueChange={(v) => setForm({ ...form, c4: v })}>
                          <SelectTrigger className="border-2 border-purple-300 bg-white dark:bg-black/20">
                            <SelectValue placeholder="Selecione a nota" />
                          </SelectTrigger>
                          <SelectContent>
                            {NOTAS_COMPETENCIA.map(nota => (
                              <SelectItem key={nota} value={nota.toString()}>{nota}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* C5 */}
                      <div className="space-y-2 p-4 rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 dark:border-red-800 md:col-span-2">
                        <Label className="font-semibold text-red-700 dark:text-red-400">C5 - Proposta de Intervenção</Label>
                        <Select value={form.c5} onValueChange={(v) => setForm({ ...form, c5: v })}>
                          <SelectTrigger className="border-2 border-red-300 bg-white dark:bg-black/20">
                            <SelectValue placeholder="Selecione a nota" />
                          </SelectTrigger>
                          <SelectContent>
                            {NOTAS_COMPETENCIA.map(nota => (
                              <SelectItem key={nota} value={nota.toString()}>{nota}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Nota Total Calculada */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-100 via-red-100 to-amber-100 dark:from-orange-950/50 dark:via-red-950/50 dark:to-amber-950/50 border-2 border-orange-300 dark:border-orange-800">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-orange-800 dark:text-orange-300">Nota Total (calculada automaticamente)</span>
                        <span className="text-4xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{notaTotalForm}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-2">
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSaving}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {isSaving ? "Salvando..." : editandoId ? "Atualizar" : "Registrar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Dashboard - Cards de Métricas Premium */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card Média Geral */}
        <Card className="relative overflow-hidden border-2 hover:border-blue-500 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 group animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold">Média Geral (últimas 5)</CardTitle>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-md opacity-50 animate-pulse-slow" />
              <div className="relative p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {estatisticas.mediaGeral}
              </div>
              <span className="text-lg font-bold text-muted-foreground">pts</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              de 1000 pontos possíveis
            </p>
          </CardContent>
        </Card>

        {/* Card Melhor Nota */}
        <Card className="relative overflow-hidden border-2 hover:border-yellow-500 transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/20 group animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Melhor Nota
                {estatisticas.melhorNota >= 900 && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 animate-spin-slow" />}
              </CardTitle>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl blur-md opacity-50 animate-pulse-slow" />
              <div className="relative p-3 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-xl">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black bg-gradient-to-r from-yellow-600 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                {estatisticas.melhorNota}
              </div>
              <span className="text-lg font-bold text-muted-foreground">pts</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              🏆 Recorde pessoal
            </p>
          </CardContent>
        </Card>

        {/* Card Total de Redações */}
        <Card className="relative overflow-hidden border-2 hover:border-emerald-500 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 group animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold">Redações Produzidas</CardTitle>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl blur-md opacity-50 animate-pulse-slow" />
              <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 bg-clip-text text-transparent">
                {estatisticas.totalRedacoes}
              </div>
              <span className="text-lg font-bold text-muted-foreground">textos</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              📝 No período selecionado
            </p>
          </CardContent>
        </Card>

        {/* Card Tempo Médio */}
        <Card className={`relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl group animate-slide-up ${
          estatisticas.tempoExcessivo 
            ? "hover:border-red-500 hover:shadow-red-500/20 border-red-300" 
            : estatisticas.tempoAlerta 
              ? "hover:border-yellow-500 hover:shadow-yellow-500/20 border-yellow-300" 
              : "hover:border-purple-500 hover:shadow-purple-500/20"
        }`} style={{ animationDelay: '0.4s' }}>
          <div className={`absolute inset-0 bg-gradient-to-br ${
            estatisticas.tempoExcessivo 
              ? "from-red-500/10" 
              : estatisticas.tempoAlerta 
                ? "from-yellow-500/10" 
                : "from-purple-500/10"
          } via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${
            estatisticas.tempoExcessivo 
              ? "from-red-500/20" 
              : estatisticas.tempoAlerta 
                ? "from-yellow-500/20" 
                : "from-purple-500/20"
          } to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`} />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${
              estatisticas.tempoExcessivo ? "text-red-600" : estatisticas.tempoAlerta ? "text-yellow-600" : ""
            }`}>
              Tempo Médio
              {(estatisticas.tempoExcessivo || estatisticas.tempoAlerta) && (
                <AlertTriangle className="h-4 w-4" />
              )}
            </CardTitle>
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${
                estatisticas.tempoExcessivo 
                  ? "from-red-500 to-rose-500" 
                  : estatisticas.tempoAlerta 
                    ? "from-yellow-500 to-amber-500" 
                    : "from-purple-500 to-pink-500"
              } rounded-xl blur-md opacity-50 animate-pulse-slow`} />
              <div className={`relative p-3 bg-gradient-to-br ${
                estatisticas.tempoExcessivo 
                  ? "from-red-500 to-rose-500" 
                  : estatisticas.tempoAlerta 
                    ? "from-yellow-500 to-amber-500" 
                    : "from-purple-500 to-pink-500"
              } rounded-xl shadow-xl`}>
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline gap-2">
              <div className={`text-4xl font-black ${
                estatisticas.tempoExcessivo 
                  ? "text-red-600" 
                  : estatisticas.tempoAlerta 
                    ? "text-yellow-600" 
                    : "bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              }`}>
                {estatisticas.tempoMedio.horas}h{estatisticas.tempoMedio.minutos}
              </div>
              <span className="text-lg font-bold text-muted-foreground">min</span>
            </div>
            <p className={`text-xs font-medium ${
              estatisticas.tempoExcessivo ? "text-red-500" : estatisticas.tempoAlerta ? "text-yellow-500" : "text-muted-foreground"
            }`}>
              {estatisticas.tempoExcessivo ? "⚠️ Tempo excessivo!" : estatisticas.tempoAlerta ? "⏰ Atenção ao tempo" : "⏱️ Por redação"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Meta de Nota */}
      <Card className="relative overflow-hidden border-2 hover:border-orange-500 transition-all duration-500 hover:shadow-xl group animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg blur-md opacity-50" />
              <div className="relative p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Minha Meta</span>
          </CardTitle>
          <CardDescription>
            Defina sua meta de nota para acompanhar no gráfico de evolução
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Input
              type="number"
              min={0}
              max={1000}
              step={20}
              value={metaNota}
              onChange={(e) => setMetaNota(parseInt(e.target.value) || 0)}
              className="w-32 border-2 focus:border-orange-500 transition-colors"
            />
            <Button 
              variant="outline" 
              onClick={() => saveMeta(metaNota)}
              className="border-2 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
            >
              Salvar Meta
            </Button>
            <span className="text-sm text-muted-foreground">
              Meta atual: <strong className="text-orange-600">{metaNota}</strong> pontos
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Evolução */}
      {redacoesFiltradas.length > 0 && (
        <Card className="relative overflow-hidden border-2 hover:border-blue-500 transition-all duration-500 hover:shadow-xl animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent" />
          
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg blur-md opacity-50" />
                <div className="relative p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Evolução das Notas</span>
            </CardTitle>
            <CardDescription>
              Acompanhe sua trajetória ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dadosEvolucao}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="data" stroke="#6b7280" fontSize={12} />
                <YAxis domain={[0, 1000]} stroke="#6b7280" fontSize={12} />
                <RechartsTooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '2px solid #f97316', 
                    borderRadius: '12px', 
                    fontWeight: 'bold',
                    boxShadow: '0 10px 40px rgba(249, 115, 22, 0.2)'
                  }}
                  formatter={(value: number, name: string) => [value, "Nota"]}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <ReferenceLine 
                  y={metaNota} 
                  stroke="#ef4444" 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                  label={{ value: `Meta: ${metaNota}`, position: 'right', fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="nota" 
                  stroke="url(#colorGradient)" 
                  strokeWidth={4}
                  dot={{ fill: '#f97316', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 10, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Diagnóstico por Competência */}
      {redacoesFiltradas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Radar */}
          <Card className="relative overflow-hidden border-2 hover:border-purple-500 transition-all duration-500 hover:shadow-xl animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent" />
            
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg blur-md opacity-50" />
                  <div className="relative p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Equilíbrio entre Competências</span>
              </CardTitle>
              <CardDescription>
                Visualize o equilíbrio das suas notas nas 5 competências
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={dadosRadar}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="competencia" stroke="#6b7280" fontSize={12} fontWeight="bold" />
                  <PolarRadiusAxis angle={30} domain={[0, 200]} stroke="#6b7280" fontSize={10} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '2px solid #8b5cf6',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 40px rgba(139, 92, 246, 0.2)'
                    }}
                    formatter={(value: number, name: string) => [value, "Nota"]}
                  />
                  <Radar
                    name="Média"
                    dataKey="valor"
                    stroke="#8b5cf6"
                    fill="url(#radarGradient)"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Barras */}
          <Card className="relative overflow-hidden border-2 hover:border-emerald-500 transition-all duration-500 hover:shadow-xl animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
            
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg blur-md opacity-50" />
                  <div className="relative p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                </div>
                <span className="bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Média por Competência</span>
              </CardTitle>
              <CardDescription>
                Compare suas médias históricas em cada competência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dadosBarras}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="nome" stroke="#6b7280" fontSize={12} fontWeight="bold" />
                  <YAxis domain={[0, 200]} stroke="#6b7280" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '2px solid #6b7280', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      value, 
                      props.payload.descricao
                    ]}
                  />
                  <Bar dataKey="media" radius={[8, 8, 0, 0]}>
                    {dadosBarras.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.cor}
                        opacity={estatisticas.pontoFraco === `c${index + 1}` ? 1 : 0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Tabela de Médias */}
              <div className="mt-4 space-y-2">
                {dadosBarras.map((item, index) => {
                  const isPontoFraco = estatisticas.pontoFraco === `c${index + 1}`;
                  return (
                    <div 
                      key={item.nome}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                        isPontoFraco 
                          ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20 border-2 border-red-200 dark:border-red-800" 
                          : "bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full shadow-lg" 
                          style={{ backgroundColor: item.cor }}
                        />
                        <span className={`text-sm font-medium ${isPontoFraco ? "font-bold text-red-600 dark:text-red-400" : ""}`}>
                          {item.nome} - {item.descricao}
                        </span>
                        {isPontoFraco && (
                          <span className="text-xs bg-gradient-to-r from-red-500 to-rose-500 text-white px-2 py-1 rounded-full font-bold shadow-lg">
                            ⚠️ Ponto Fraco
                          </span>
                        )}
                      </div>
                      <span className={`font-black text-lg ${isPontoFraco ? "text-red-600 dark:text-red-400" : ""}`}>
                        {item.media}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Histórico Detalhado */}
      <Card className="relative overflow-hidden border-2 hover:border-gray-400 transition-all duration-500 hover:shadow-xl animate-slide-up" style={{ animationDelay: '0.9s' }}>
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors rounded-t-xl"
          onClick={() => setShowHistorico(!showHistorico)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg blur-md opacity-50" />
                <div className="relative p-2 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Histórico Detalhado</CardTitle>
                <CardDescription>
                  {redacoesFiltradas.length} redação(ões) registrada(s)
                </CardDescription>
              </div>
            </div>
            <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-800 transition-transform duration-300 ${showHistorico ? 'rotate-180' : ''}`}>
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </div>
          </div>
        </CardHeader>
        {showHistorico && (
          <CardContent className="pt-0">
            {redacoesFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-full blur-xl opacity-20" />
                  <FileText className="h-16 w-16 mx-auto text-orange-300 relative" />
                </div>
                <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhuma redação registrada ainda.</p>
                <p className="text-sm text-muted-foreground">Clique em "Nova Redação" para começar!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {redacoesFiltradas.map((redacao, index) => (
                  <div 
                    key={redacao.id}
                    className="p-5 rounded-2xl border-2 hover:border-orange-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-lg">{redacao.titulo}</h4>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            📅 {new Date(redacao.data).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            ⏱️ {redacao.tempoHoras}h {redacao.tempoMinutos}min
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                            C1: {redacao.c1}
                          </span>
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700">
                            C2: {redacao.c2}
                          </span>
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
                            C3: {redacao.c3}
                          </span>
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                            C4: {redacao.c4}
                          </span>
                          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700">
                            C5: {redacao.c5}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                            {redacao.notaTotal}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">pontos</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(redacao)}
                            className="border-2 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(redacao.id)}
                            className="border-2 text-red-500 hover:text-red-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Mensagem quando não há redações */}
      {redacoes.length === 0 && !isLoading && (
        <Card className="relative overflow-hidden border-2 border-dashed border-orange-300 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-red-500/5 to-amber-500/5" />
          
          <CardContent className="py-16">
            <div className="text-center">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-full blur-2xl opacity-30 animate-pulse-slow" />
                <div className="relative bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 p-6 rounded-full">
                  <PenTool className="h-16 w-16 text-orange-500" />
                </div>
              </div>
              <h3 className="text-2xl font-black mb-3 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Comece a registrar suas redações!
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Acompanhe sua evolução nas redações do ENEM registrando suas notas por competência.
              </p>
              <Button 
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-105"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                Registrar Primeira Redação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

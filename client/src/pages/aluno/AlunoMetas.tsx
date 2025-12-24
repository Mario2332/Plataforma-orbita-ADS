import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAlunoApi } from "@/hooks/useAlunoApi";
import { 
  Target, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  Flame,
  BookOpen,
  FileText,
  BarChart3,
  Trophy,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { toDate, timestampToInputDate, formatDateBR, getTodayString, addDays } from "@/utils/dateHelpers";
import { EstatisticasMetasCards } from "@/components/metas/EstatisticasMetasCards";
import { GraficoMetasPorDia } from "@/components/metas/GraficoMetasPorDia";
import { GraficosStatusETipo } from "@/components/metas/GraficosStatusETipo";
import { FiltrosPeriodoGraficos, PeriodoGrafico } from "@/components/metas/FiltrosPeriodoGraficos";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Tipos de metas
type TipoMeta = 'horas' | 'questoes' | 'simulados' | 'topicos' | 'sequencia' | 'desempenho';
type StatusMeta = 'ativa' | 'concluida' | 'expirada' | 'cancelada';

interface Meta {
  id: string;
  tipo: TipoMeta;
  nome: string;
  descricao?: string;
  valorAlvo: number;
  valorAtual: number;
  unidade: string;
  dataInicio: any;
  dataFim: any;
  status: StatusMeta;
  materia?: string;
  incidencia?: string;
  dataConclusao?: any;
  createdBy?: string;
  repetirDiariamente?: boolean;
  metaPaiId?: string; // ID da meta "template" (para instâncias diárias)
  dataReferencia?: any; // Data específica desta instância (para metas diárias)
}



// Matérias do ENEM
const MATERIAS_ENEM = [
  "Matemática",
  "Biologia",
  "Física",
  "Química",
  "História",
  "Geografia",
  "Filosofia",
  "Sociologia",
  "Linguagens",
  "Redação",
];

// Configurações dos tipos de meta
const TIPOS_META = {
  horas: {
    nome: "Horas de Estudo",
    icon: Clock,
    unidade: "horas",
    descricao: "Estudar X horas em um período",
    color: "text-emerald-500",
    bgGradient: "from-emerald-500/20 to-emerald-600/10",
  },
  questoes: {
    nome: "Questões",
    icon: FileText,
    unidade: "questões",
    descricao: "Resolver X questões",
    color: "text-green-500",
    bgGradient: "from-green-500/20 to-green-600/10",
  },
  simulados: {
    nome: "Simulados",
    icon: BookOpen,
    unidade: "simulados",
    descricao: "Fazer X simulados completos",
    color: "text-purple-500",
    bgGradient: "from-purple-500/20 to-purple-600/10",
  },
  topicos: {
    nome: "Tópicos do Cronograma",
    icon: CheckCircle2,
    unidade: "tópicos",
    descricao: "Concluir X tópicos do cronograma",
    color: "text-orange-500",
    bgGradient: "from-orange-500/20 to-orange-600/10",
  },
  sequencia: {
    nome: "Sequência de Dias",
    icon: Flame,
    unidade: "dias",
    descricao: "Estudar X dias consecutivos",
    color: "text-red-500",
    bgGradient: "from-red-500/20 to-red-600/10",
  },
  desempenho: {
    nome: "Desempenho em Simulados",
    icon: Trophy,
    unidade: "acertos",
    descricao: "Acertar X questões em simulados",
    color: "text-yellow-500",
    bgGradient: "from-yellow-500/20 to-yellow-600/10",
  },
};

export default function AlunoMetas() {
  const api = useAlunoApi();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [metaEditando, setMetaEditando] = useState<Meta | null>(null);

  // Form state
  const [tipo, setTipo] = useState<TipoMeta>('horas');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valorAlvo, setValorAlvo] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [materia, setMateria] = useState('');
  const [repetirDiariamente, setRepetirDiariamente] = useState(false);
  
  // Filtro de período para gráficos
  const [periodoGraficos, setPeriodoGraficos] = useState<PeriodoGrafico>('30');
  
  // Estados de expansão das seções
  const [metasAtivasExpanded, setMetasAtivasExpanded] = useState(true);
  const [metasConcluidasExpanded, setMetasConcluidasExpanded] = useState(false);
  const [metasNaoAlcancadasExpanded, setMetasNaoAlcancadasExpanded] = useState(false);

  const loadMetas = async () => {
    try {
      setIsLoading(true);
      await api.checkExpiredMetas(); // Verificar metas expiradas
      const metasData = await api.getMetas();
      setMetas(metasData as Meta[]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar metas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetas();
  }, []);

  const handleOpenDialog = (meta?: Meta) => {
    if (meta) {
      setIsEditMode(true);
      setMetaEditando(meta);
      setTipo(meta.tipo);
      setNome(meta.nome);
      setDescricao(meta.descricao || '');
      setValorAlvo(meta.valorAlvo.toString());
      setMateria(meta.materia || '');
      setRepetirDiariamente(meta.repetirDiariamente || false);
      setDataInicio(timestampToInputDate(meta.dataInicio));
      setDataFim(timestampToInputDate(meta.dataFim));
    } else {
      setIsEditMode(false);
      setMetaEditando(null);
      resetForm();
      // Definir datas padrão
      setDataInicio(getTodayString());
      setDataFim(addDays(new Date(), 7));
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setTipo('horas');
    setNome('');
    setDescricao('');
    setValorAlvo('');
    setDataInicio('');
    setDataFim('');
    setMateria('');
    setRepetirDiariamente(false);
  };

  const handleSubmit = async () => {
    // Validação
    if (!nome || !valorAlvo || !dataInicio || !dataFim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const unidade = TIPOS_META[tipo].unidade;
      
      // Converter datas para ISO com horário meio-dia (evita problemas de timezone)
      const dataInicioISO = `${dataInicio}T12:00:00`;
      const dataFimISO = `${dataFim}T12:00:00`;
      
      if (isEditMode && metaEditando) {
        await api.updateMeta({
          metaId: metaEditando.id,
          nome,
          descricao,
          valorAlvo: Number(valorAlvo),
          dataInicio: dataInicioISO,
          dataFim: dataFimISO,
        });
        toast.success("Meta atualizada com sucesso!");
      } else {
        await api.createMeta({
          tipo,
          nome,
          descricao,
          valorAlvo: Number(valorAlvo),
          unidade,
          dataInicio: dataInicioISO,
          dataFim: dataFimISO,
          materia: materia || undefined,
          repetirDiariamente: (tipo === 'horas' || tipo === 'questoes' || tipo === 'topicos') ? repetirDiariamente : undefined,
        });
        toast.success("Meta criada com sucesso!");
      }

      setIsDialogOpen(false);
      resetForm();
      loadMetas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar meta");
    }
  };

  const handleDelete = async (metaId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta meta?")) return;

    try {
      await api.deleteMeta(metaId);
      toast.success("Meta excluída");
      loadMetas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir meta");
    }
  };

  const handleCancelMeta = async (metaId: string) => {
    try {
      await api.updateMeta({
        metaId,
        status: 'cancelada',
      });
      toast.success("Meta cancelada");
      loadMetas();
    } catch (error: any) {
      toast.error(error.message || "Erro ao cancelar meta");
    }
  };

  const getStatusBadge = (meta: Meta) => {
    const now = new Date();
    const dataFim = toDate(meta.dataFim);
    const diasRestantes = Math.ceil((dataFim.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (meta.status === 'concluida') {
      return <Badge className="bg-green-500">Concluída</Badge>;
    }

    if (meta.status === 'expirada') {
      return <Badge variant="secondary">Expirada</Badge>;
    }

    if (meta.status === 'cancelada') {
      return <Badge variant="outline">Cancelada</Badge>;
    }

    if (diasRestantes <= 1) {
      return <Badge variant="destructive">Último dia!</Badge>;
    }

    if (diasRestantes <= 3) {
      return <Badge className="bg-orange-500">3 dias restantes</Badge>;
    }

    if (diasRestantes <= 7) {
      return <Badge className="bg-yellow-500">7 dias restantes</Badge>;
    }

    return <Badge variant="outline">Ativa</Badge>;
  };

  const getProgressColor = (progresso: number) => {
    if (progresso >= 90) return "bg-green-500";
    if (progresso >= 75) return "bg-emerald-500";
    if (progresso >= 50) return "bg-yellow-500";
    if (progresso >= 25) return "bg-orange-500";
    return "bg-gray-500";
  };

  // Filtrar metas para exibição
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const hojeStr = hoje.toISOString().split('T')[0];
  
  console.log('=== DEBUG METAS ===');
  console.log('Total de metas:', metas.length);
  console.log('Hoje (string):', hojeStr);
  console.log('Todas as metas:', metas);
  
  // Filtrar apenas:
  // 1. Metas não-diárias (sem metaPaiId)
  // 2. Instâncias diárias de hoje (com metaPaiId e dataReferencia = hoje)
  const metasExibir = metas.filter(m => {
    console.log('Analisando meta:', m.nome, '| metaPaiId:', m.metaPaiId, '| repetirDiariamente:', m.repetirDiariamente);
    
    if (m.metaPaiId) {
      // É instância diária, mostrar apenas se for de hoje
      if (m.dataReferencia) {
        const dataRef = toDate(m.dataReferencia);
        dataRef.setHours(0, 0, 0, 0);
        const dataRefStr = dataRef.toISOString().split('T')[0];
        console.log('  -> Instância diária | dataRef:', dataRefStr, '| hoje:', hojeStr, '| match:', dataRefStr === hojeStr);
        return dataRefStr === hojeStr;
      }
      console.log('  -> Instância sem dataReferencia, escondendo');
      return false;
    }
    // Não é instância diária
    // Se for meta "pai" (template), não mostrar
    if (m.repetirDiariamente && !m.metaPaiId) {
      console.log('  -> Meta PAI (template), escondendo');
      return false; // Meta "pai", não mostrar
    }
    console.log('  -> Meta normal, mostrando');
    return true; // Meta normal, mostrar
  });
  
  console.log('Metas após filtro:', metasExibir.length);
  
  // Calcular estatísticas
  const metasAtivas = metasExibir.filter(m => m.status === 'ativa');
  const metasConcluidas = metasExibir.filter(m => m.status === 'concluida');
  const metasNaoAlcancadas = metasExibir.filter(m => m.status === 'expirada' || m.status === 'cancelada');
  const totalMetasFinalizadas = metasAtivas.length + metasConcluidas.length + metasNaoAlcancadas.length;
  const taxaConclusao = totalMetasFinalizadas > 0 
    ? Math.round((metasConcluidas.length / totalMetasFinalizadas) * 100) 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Target className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 mb-6 border-2 border-primary/20 animate-slide-up">
        <div className="relative flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Target className="h-10 w-10 text-primary" />
              Minhas Metas
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Defina e acompanhe seus objetivos de estudo
            </p>
          </div>
          <Button 
            onClick={() => handleOpenDialog()} 
            className="gap-2 bg-gradient-to-r from-primary via-primary to-emerald-600 hover:from-primary/90 hover:via-primary/90 hover:to-emerald-600/90 shadow hover:shadow-sm hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.01] text-white font-semibold"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <EstatisticasMetasCards metas={metasExibir} />

      {/* Filtro de Período */}
      <div className="flex justify-end animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <FiltrosPeriodoGraficos periodo={periodoGraficos} onPeriodoChange={setPeriodoGraficos} />
      </div>

      {/* Gráficos de Análise */}
      <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        {/* Gráfico de Linhas - Evolução */}
        <GraficoMetasPorDia 
          metas={metasExibir} 
          diasPeriodo={periodoGraficos === 'todos' ? 365 : Number(periodoGraficos)} 
        />
        
        {/* Gráficos de Pizza e Barras */}
        <GraficosStatusETipo metas={metasExibir} />
      </div>

      {/* Metas Ativas */}
      {metasAtivas.length > 0 && (
        <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setMetasAtivasExpanded(!metasAtivasExpanded)}
            className="w-full flex items-center justify-between text-left hover:bg-accent/50 p-4 rounded-lg transition-colors"
          >
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Metas Ativas
              <Badge variant="secondary" className="ml-2">{metasAtivas.length}</Badge>
            </h2>
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${metasAtivasExpanded ? 'rotate-180' : ''}`} />
          </button>
          {metasAtivasExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metasAtivas.map((meta, index) => {
              const Icon = TIPOS_META[meta.tipo].icon;
              
              // Calcular progresso considerando metas diárias
              let progresso = 0;
              let valorAtualExibido = meta.valorAtual;
              let valorAlvoExibido = meta.valorAlvo;
              let textoProgresso = '';
              
              // Metas diárias já mostram progresso do dia (instância)
              // Metas normais mostram progresso total
              progresso = Math.min(100, Math.round((meta.valorAtual / meta.valorAlvo) * 100));
              
              if (meta.repetirDiariamente) {
                textoProgresso = `${meta.valorAtual} / ${meta.valorAlvo} ${meta.unidade} hoje`;
              } else {
                textoProgresso = `${meta.valorAtual} / ${meta.valorAlvo} ${meta.unidade}`;
              }
              
              return (
                <Card 
                  key={meta.id}
                  className="relative overflow-hidden border-2 hover:border-primary transition-all duration-500 hover:shadow-sm hover:shadow-primary/20 group animate-slide-up bg-yellow-50/30 dark:bg-yellow-900/10"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  
                  <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-none group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                  
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${TIPOS_META[meta.tipo].bgGradient}`}>
                          <Icon className={`h-4 w-4 ${TIPOS_META[meta.tipo].color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{meta.nome}</CardTitle>
                          <CardDescription className="mt-1">
                            {meta.descricao || TIPOS_META[meta.tipo].descricao}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(meta)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    {/* Progresso */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Progresso</span>
                        <span className="font-semibold">
                          {textoProgresso}
                        </span>
                      </div>
                      {meta.repetirDiariamente && (
                        <p className="text-xs text-muted-foreground">
                          Total: {meta.valorAtual} {meta.unidade}
                        </p>
                      )}
                      <div className="relative">
                        <Progress 
                          value={progresso} 
                          className={`h-3 ${getProgressColor(progresso)} transition-all duration-1000`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground text-right font-semibold">{progresso}%</p>
                    </div>

                    {/* Informações */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-full">
                        <Calendar className="h-4 w-4" />
                        <span>Até {formatDateBR(meta.dataFim)}</span>
                      </div>
                      {meta.repetirDiariamente && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 shadow">
                          <Flame className="h-3 w-3 mr-1" />
                          Meta diária
                        </Badge>
                      )}
                      {meta.materia && (
                        <Badge variant="outline" className="border-primary/50">{meta.materia}</Badge>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(meta)}
                        className="flex-1 hover:bg-primary/10 hover:border-primary transition-all duration-300"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelMeta(meta.id)}
                        className="flex-1 hover:bg-orange-500/10 hover:border-orange-500 hover:text-orange-600 transition-all duration-300"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(meta.id)}
                        className="hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* Metas Concluídas */}
      {metasConcluidas.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setMetasConcluidasExpanded(!metasConcluidasExpanded)}
            className="w-full flex items-center justify-between text-left hover:bg-accent/50 p-4 rounded-lg transition-colors"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              ✅ Metas Concluídas
              <Badge variant="secondary" className="ml-2">{metasConcluidas.length}</Badge>
            </h2>
            <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${metasConcluidasExpanded ? 'rotate-180' : ''}`} />
          </button>
          {metasConcluidasExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metasConcluidas.map((meta) => {
              const Icon = TIPOS_META[meta.tipo].icon;
              
              return (
                <Card key={meta.id} className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-1 ${TIPOS_META[meta.tipo].color}`} />
                        <div>
                          <CardTitle className="text-lg">{meta.nome}</CardTitle>
                          <CardDescription className="mt-1">
                            Concluída em {meta.dataConclusao ? formatDateBR(meta.dataConclusao) : 'N/A'}
                          </CardDescription>
                        </div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Meta alcançada</span>
                      <span className="font-medium">
                        {meta.valorAtual} / {meta.valorAlvo} {meta.unidade}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(meta.id)}
                      className="w-full mt-4"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Excluir
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* Metas Não Alcançadas */}
      {metasNaoAlcancadas.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setMetasNaoAlcancadasExpanded(!metasNaoAlcancadasExpanded)}
            className="w-full flex items-center justify-between text-left hover:bg-accent/50 p-4 rounded-lg transition-colors"
          >
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Metas Não Alcançadas
              <Badge variant="secondary" className="ml-2">{metasNaoAlcancadas.length}</Badge>
            </h2>
            <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${metasNaoAlcancadasExpanded ? 'rotate-180' : ''}`} />
          </button>
          {metasNaoAlcancadasExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metasNaoAlcancadas.map((meta, index) => {
              const Icon = TIPOS_META[meta.tipo].icon;
              
              return (
                <Card 
                  key={meta.id}
                  className="relative overflow-hidden border-2 border-red-200 bg-red-50/30 dark:bg-red-900/10 animate-slide-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="relative z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${TIPOS_META[meta.tipo].bgGradient} opacity-50`}>
                          <Icon className={`h-4 w-4 ${TIPOS_META[meta.tipo].color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{meta.nome}</CardTitle>
                          <CardDescription className="mt-1">
                            {meta.status === 'expirada' ? 'Prazo expirado' : 'Cancelada'}
                          </CardDescription>
                        </div>
                      </div>
                      <XCircle className="h-5 w-5 text-red-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso final</span>
                      <span className="font-medium">
                        {meta.valorAtual} / {meta.valorAlvo} {meta.unidade}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(meta.id)}
                      className="w-full hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* Estado vazio */}
      {metasExibir.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma meta criada</h3>
            <p className="text-muted-foreground mb-4">
              Crie sua primeira meta para organizar seus estudos!
            </p>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Criar/Editar Meta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="relative">
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                {isEditMode ? 'Editar Meta' : 'Nova Meta'}
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                {isEditMode 
                  ? 'Atualize as informações da sua meta' 
                  : 'Defina um objetivo de estudo para acompanhar seu progresso'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-4 py-4">
            {/* Tipo de Meta (apenas na criação) */}
            {!isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Meta</Label>
                <Select value={tipo} onValueChange={(value) => setTipo(value as TipoMeta)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS_META).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className={`h-4 w-4 ${config.color}`} />
                          {config.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {TIPOS_META[tipo].descricao}
                </p>
              </div>
            )}

            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="nome">Nome da Meta *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Estudar 20 horas esta semana"
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Adicione detalhes sobre sua meta..."
                rows={3}
              />
            </div>

            {/* Valor Alvo */}
            <div className="space-y-2">
              <Label htmlFor="valorAlvo">
                Meta ({TIPOS_META[tipo].unidade}) *
              </Label>
              <Input
                id="valorAlvo"
                type="number"
                value={valorAlvo}
                onChange={(e) => setValorAlvo(e.target.value)}
                placeholder="Ex: 20"
                min="1"
              />
            </div>

            {/* Matéria (para questões e desempenho) */}
            {(tipo === 'questoes' || tipo === 'desempenho') && (
              <div className="space-y-2">
                <Label htmlFor="materia">Matéria (opcional)</Label>
                <Select value={materia || undefined} onValueChange={(value) => setMateria(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as matérias" />
                  </SelectTrigger>
                  <SelectContent>
                    {MATERIAS_ENEM.map((mat) => (
                      <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Deixe em branco para considerar todas as matérias
                </p>
              </div>
            )}

            {/* Repetir Diariamente (para horas, questões e tópicos) */}
            {(tipo === 'horas' || tipo === 'questoes' || tipo === 'topicos') && (
              <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                <Checkbox 
                  id="repetirDiariamente" 
                  checked={repetirDiariamente}
                  onCheckedChange={(checked) => setRepetirDiariamente(checked as boolean)}
                />
                <div className="space-y-1">
                  <Label 
                    htmlFor="repetirDiariamente" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    Repetir diariamente
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {tipo === 'horas' && 'Ex: Estudar 2 horas por dia'}
                    {tipo === 'questoes' && 'Ex: Resolver 10 questões por dia'}
                    {tipo === 'topicos' && 'Ex: Concluir 3 tópicos por dia'}
                  </p>
                </div>
              </div>
            )}

            {/* Datas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início *</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim *</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              className="hover:bg-muted transition-all duration-300"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow hover:shadow-sm transition-all duration-300 hover:scale-[1.01]"
            >
              {isEditMode ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Meta
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

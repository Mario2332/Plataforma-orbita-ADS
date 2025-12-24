import { InContentAd } from "@/components/ads";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAlunoApi } from "@/hooks/useAlunoApi";
import { BarChart3, Calendar, TrendingUp, PieChart, Activity, Zap, Target, Award, Clock } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

type PeriodoFiltro = "7d" | "30d" | "3m" | "6m" | "1a" | "all";

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
  "Revisão",
  "Simulado",
  "Correção de simulado",
  "Preenchimento de lacunas",
] as const;

const CORES_GRAFICOS = [
  "#3b82f6", // blue - Matemática
  "#10b981", // green - Biologia
  "#f59e0b", // amber - Física
  "#ef4444", // red - Química
  "#8b5cf6", // violet - História
  "#ec4899", // pink - Geografia
  "#06b6d4", // cyan - Filosofia
  "#f97316", // orange - Sociologia
  "#84cc16", // lime - Linguagens
  "#14b8a6", // teal - Redação
  "#a855f7", // purple - Revisão
  "#f43f5e", // rose - Simulado
  "#0ea5e9", // sky - Correção de simulado
  "#eab308", // yellow - Preenchimento de lacunas
];

export default function AlunoMetricas() {
  const api = useAlunoApi();
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("30d");
  const [estudos, setEstudos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [itensOcultos, setItensOcultos] = useState<Set<string>>(new Set());

  const loadEstudos = async () => {
    try {
      setIsLoading(true);
      const data = await api.getEstudos();
      setEstudos(data as any[]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar estudos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEstudos();
  }, []);

  const estudosFiltrados = useMemo(() => {
    if (!estudos) return [];
    
    const agora = new Date();
    let dataLimite = new Date();
    
    switch (periodo) {
      case "7d":
        dataLimite.setDate(agora.getDate() - 7);
        break;
      case "30d":
        dataLimite.setDate(agora.getDate() - 30);
        break;
      case "3m":
        dataLimite.setMonth(agora.getMonth() - 3);
        break;
      case "6m":
        dataLimite.setMonth(agora.getMonth() - 6);
        break;
      case "1a":
        dataLimite.setFullYear(agora.getFullYear() - 1);
        break;
      case "all":
        return estudos;
    }
    
    return estudos.filter(e => {
      try {
        let data: Date;
        if (e.data?.seconds || e.data?._seconds) {
          const seconds = e.data.seconds || e.data._seconds;
          data = new Date(seconds * 1000);
        } else if (e.data?.toDate) {
          data = e.data.toDate();
        } else {
          data = new Date(e.data);
        }
        return !isNaN(data.getTime()) && data >= dataLimite;
      } catch {
        return false;
      }
    });
  }, [estudos, periodo]);

  const dadosEvolucao = useMemo(() => {
    if (!estudosFiltrados.length) return [];
    
    // Agrupar por data, guardando timestamp para ordenação
    const porDia = estudosFiltrados.reduce((acc, estudo) => {
      let dataFormatada: string;
      let timestamp: number = 0;
      try {
        let data: Date;
        if (estudo.data?.seconds || estudo.data?._seconds) {
          const seconds = estudo.data.seconds || estudo.data._seconds;
          data = new Date(seconds * 1000);
        } else if (estudo.data?.toDate) {
          data = estudo.data.toDate();
        } else {
          data = new Date(estudo.data);
        }
        if (!isNaN(data.getTime())) {
          dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
          timestamp = data.getTime();
        } else {
          dataFormatada = 'Inválida';
        }
      } catch {
        dataFormatada = 'Inválida';
      }
      
      if (!acc[dataFormatada]) {
        acc[dataFormatada] = { data: dataFormatada, tempo: 0, questoes: 0, acertos: 0, timestamp };
      }
      // Atualizar timestamp para o mais recente do dia (para garantir consistência)
      if (timestamp > acc[dataFormatada].timestamp) {
        acc[dataFormatada].timestamp = timestamp;
      }
      acc[dataFormatada].tempo += estudo.tempoMinutos;
      acc[dataFormatada].questoes += estudo.questoesFeitas;
      acc[dataFormatada].acertos += estudo.questoesAcertadas;
      return acc;
    }, {} as Record<string, any>);
    
    // Ordenar por timestamp (mais antigo primeiro = à esquerda do gráfico)
    const dadosOrdenados = Object.values(porDia)
      .filter((d: any) => d.data !== 'Inválida')
      .sort((a: any, b: any) => a.timestamp - b.timestamp);
    
    return dadosOrdenados.map((d: any) => ({
      data: d.data,
      tempo: d.tempo,
      questoes: d.questoes,
      acertos: d.acertos,
      percentual: d.questoes > 0 ? Math.round((d.acertos / d.questoes) * 100) : 0,
    }));
  }, [estudosFiltrados]);

  const dadosPorMateria = useMemo(() => {
    const porMateria: Record<string, any> = {};
    MATERIAS_ENEM.forEach(materia => {
      porMateria[materia] = { materia, tempo: 0, questoes: 0, acertos: 0 };
    });
    
    estudosFiltrados.forEach(estudo => {
      const materia = estudo.materia;
      if (!porMateria[materia]) {
        porMateria[materia] = { materia, tempo: 0, questoes: 0, acertos: 0 };
      }
      porMateria[materia].tempo += estudo.tempoMinutos;
      porMateria[materia].questoes += estudo.questoesFeitas;
      porMateria[materia].acertos += estudo.questoesAcertadas;
    });
    
    return MATERIAS_ENEM.map(materia => ({
      ...porMateria[materia],
      percentual: porMateria[materia].questoes > 0 
        ? Math.round((porMateria[materia].acertos / porMateria[materia].questoes) * 100) 
        : 0,
    }));
  }, [estudosFiltrados]);

  const dadosDistribuicaoTempo = useMemo(() => {
    return dadosPorMateria
      .filter(d => d.tempo > 0)
      .map((d) => {
        const indexMateria = MATERIAS_ENEM.indexOf(d.materia as typeof MATERIAS_ENEM[number]);
        return {
          name: d.materia,
          value: d.tempo,
          color: CORES_GRAFICOS[indexMateria >= 0 ? indexMateria : 0],
        };
      });
  }, [dadosPorMateria]);

  // Dados filtrados para o gráfico (excluindo itens ocultos)
  const dadosDistribuicaoTempoFiltrados = useMemo(() => {
    return dadosDistribuicaoTempo.filter(d => !itensOcultos.has(d.name));
  }, [dadosDistribuicaoTempo, itensOcultos]);

  // Função para alternar visibilidade de um item
  const toggleItemVisibilidade = (nome: string) => {
    setItensOcultos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nome)) {
        newSet.delete(nome);
      } else {
        newSet.add(nome);
      }
      return newSet;
    });
  };

  const metricas = useMemo(() => {
    const tempoTotal = estudosFiltrados.reduce((acc, e) => acc + e.tempoMinutos, 0);
    const questoesTotal = estudosFiltrados.reduce((acc, e) => acc + e.questoesFeitas, 0);
    const acertosTotal = estudosFiltrados.reduce((acc, e) => acc + e.questoesAcertadas, 0);
    const percentualAcerto = questoesTotal > 0 ? Math.round((acertosTotal / questoesTotal) * 100) : 0;
    
    const diasUnicos = new Set(
      estudosFiltrados
        .map(e => {
          try {
            let data: Date;
            
            if (e.data?.seconds || e.data?._seconds) {
              const seconds = e.data.seconds || e.data._seconds;
              data = new Date(seconds * 1000);
            } else if (e.data?.toDate) {
              data = e.data.toDate();
            } else {
              data = new Date(e.data);
            }
            
            if (isNaN(data.getTime())) {
              return null;
            }
            
            return data.toISOString().split('T')[0];
          } catch (error) {
            return null;
          }
        })
        .filter((v): v is string => v !== null)
    );
    
    return {
      tempoTotal,
      questoesTotal,
      acertosTotal,
      percentualAcerto,
      diasEstudo: diasUnicos.size,
    };
  }, [estudosFiltrados]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Elementos decorativos */}

      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-900 p-4 border-2 border-white/20 dark:border-white/10 backdrop-blur-none shadow-sm animate-slide-up">
        
        
        
        <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                
                <div className="relative bg-emerald-500 p-3 rounded-lg shadow-sm">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white ">
                  Análise de Desempenho
                </h1>
              </div>
            </div>
            <p className="text-lg text-muted-foreground font-medium">
              Acompanhe sua evolução nos estudos 📊
            </p>
          </div>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-white/50 dark:bg-black/30 rounded-lg border-2 border-white/30 backdrop-blur-sm">
            <Calendar className="h-5 w-5 text-purple-500" />
            <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
              <SelectTrigger className="w-[180px] border-2 font-semibold">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="1a">Último ano</SelectItem>
                <SelectItem value="all">Todo o período</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Cards de métricas premium */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="relative overflow-hidden border-2 hover:shadow-sm hover:shadow-sm transition-all duration-500 group animate-slide-up" style={{ animationDelay: '0.1s' }}>
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Tempo Total</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-xl">
              <Clock className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-semibold text-gray-900 dark:text-white ">
              {Math.floor(metricas.tempoTotal / 60)}h {metricas.tempoTotal % 60}m
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">de estudo dedicado</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-sm hover:shadow-sm transition-all duration-500 group animate-slide-up" style={{ animationDelay: '0.15s' }}>
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Questões</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-xl">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-semibold text-gray-900 dark:text-white ">
              {metricas.questoesTotal}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">questões resolvidas</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-sm hover:shadow-sm transition-all duration-500 group animate-slide-up" style={{ animationDelay: '0.2s' }}>
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Acertos</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-xl">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-semibold text-gray-900 dark:text-white ">
              {metricas.acertosTotal}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">questões corretas</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-sm hover:shadow-amber-500/20 transition-all duration-500 group animate-slide-up" style={{ animationDelay: '0.25s' }}>
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Taxa de Acerto</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-xl">
              <Target className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-semibold text-gray-900 dark:text-white ">
              {metricas.percentualAcerto}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">de aproveitamento</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-2 hover:shadow-sm hover:shadow-rose-500/20 transition-all duration-500 group animate-slide-up" style={{ animationDelay: '0.3s' }}>
          
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold">Dias de Estudo</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-xl">
              <Award className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-semibold text-gray-900 dark:text-white ">
              {metricas.diasEstudo}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">dias praticados</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos Premium */}
      <Tabs defaultValue="evolucao" className="space-y-6 animate-slide-up" style={{ animationDelay: '0.35s' }}>
        <TabsList className="grid w-full grid-cols-3 p-1 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800">
          <TabsTrigger value="evolucao" className="font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            Evolução Temporal
          </TabsTrigger>
          <TabsTrigger value="materias" className="font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            Por Matéria
          </TabsTrigger>
          <TabsTrigger value="distribuicao" className="font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
            Distribuição
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evolucao" className="space-y-4">
          <Card className="border-2 hover:shadow-sm transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                Evolução do Desempenho
              </CardTitle>
              <CardDescription className="text-base">Acompanhe sua progressão ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosEvolucao.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dadosEvolucao}>
                    <defs>
                      <linearGradient id="colorTempo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPercentual" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="data" stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
                    <YAxis yAxisId="left" stroke="#3b82f6" style={{ fontSize: '12px', fontWeight: 600 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: '12px', fontWeight: 600 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontWeight: 600
                      }} 
                    />
                    <Legend wrapperStyle={{ fontWeight: 600 }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="tempo"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="Tempo (min)"
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="percentual"
                      stroke="#10b981"
                      strokeWidth={3}
                      name="Taxa de Acerto (%)"
                      dot={{ fill: '#10b981', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px]">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mb-4">
                    <BarChart3 className="h-12 w-12 text-emerald-500" />
                  </div>
                  <p className="text-lg font-semibold text-muted-foreground">Nenhum dado disponível</p>
                  <p className="text-sm text-muted-foreground">para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materias" className="space-y-6">
          <Card className="border-2 hover:shadow-sm transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                Desempenho por Matéria
              </CardTitle>
              <CardDescription className="text-base">Compare seu progresso em cada disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosPorMateria.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={dadosPorMateria}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="materia" stroke="#6b7280" style={{ fontSize: '11px', fontWeight: 600 }} angle={-15} textAnchor="end" height={80} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px', fontWeight: 600 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontWeight: 600
                      }} 
                    />
                    <Legend wrapperStyle={{ fontWeight: 600 }} />
                    <Bar dataKey="questoes" fill="#3b82f6" name="Questões Feitas" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="acertos" fill="#10b981" name="Acertos" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px]">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full mb-4">
                    <BarChart3 className="h-12 w-12 text-emerald-500" />
                  </div>
                  <p className="text-lg font-semibold text-muted-foreground">Nenhum dado disponível</p>
                  <p className="text-sm text-muted-foreground">para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-sm transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <Target className="h-5 w-5 text-white" />
                </div>
                Taxa de Acerto por Matéria
              </CardTitle>
              <CardDescription className="text-base">Identifique seus pontos fortes e fracos</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosPorMateria.length > 0 ? (
                <div className="space-y-6">
                  {dadosPorMateria.map((item, index) => (
                    <div key={index} className="space-y-3 p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 hover:border-purple-500/30 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-base">{item.materia}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground font-semibold">
                            {item.acertos}/{item.questoes} questões
                          </span>
                          <span className={`px-4 py-1.5 rounded-full font-semibold text-sm ${
                            item.percentual >= 80
                              ? "bg-emerald-600 text-white"
                              : item.percentual >= 60
                              ? "bg-emerald-500 text-white"
                              : item.percentual >= 40
                              ? "bg-gray-500 text-white"
                              : "bg-gray-600 text-white"
                          }`}>
                            {item.percentual}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-1000 ${
                            item.percentual >= 80
                              ? "bg-emerald-500"
                              : item.percentual >= 60
                              ? "bg-emerald-500"
                              : item.percentual >= 40
                              ? "bg-gray-400"
                              : "bg-gray-500"
                          }`}
                          style={{ width: `${item.percentual}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px]">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-full mb-4">
                    <Target className="h-12 w-12 text-purple-500" />
                  </div>
                  <p className="text-lg font-semibold text-muted-foreground">Nenhum dado disponível</p>
                  <p className="text-sm text-muted-foreground">para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribuicao" className="space-y-4">
          <Card className="border-2 hover:shadow-sm transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg shadow">
                  <PieChart className="h-5 w-5 text-white" />
                </div>
                Distribuição de Tempo por Matéria/Atividade
              </CardTitle>
              <CardDescription className="text-base">Veja como você distribui seu tempo de estudo</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosDistribuicaoTempo.length > 0 ? (
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Gráfico de Pizza */}
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={450}>
                      <RechartsPie>
                        <Pie
                          data={dadosDistribuicaoTempoFiltrados}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={140}
                          fill="#8884d8"
                          dataKey="value"
                          style={{ fontSize: '12px', fontWeight: 700 }}
                        >
                          {dadosDistribuicaoTempoFiltrados.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                            border: '2px solid #e5e7eb',
                            borderRadius: '12px',
                            fontWeight: 600
                          }}
                          formatter={(value: number) => [`${Math.floor(value / 60)}h ${value % 60}min`, 'Tempo']}
                        />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Legenda Interativa */}
                  <div className="lg:w-64 space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">Clique para ocultar/exibir:</p>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {dadosDistribuicaoTempo.map((item) => {
                        const isOculto = itensOcultos.has(item.name);
                        const tempoHoras = Math.floor(item.value / 60);
                        const tempoMinutos = item.value % 60;
                        return (
                          <button
                            key={item.name}
                            onClick={() => toggleItemVisibilidade(item.name)}
                            className={`w-full flex items-center gap-3 p-2 rounded-lg border-2 transition-all duration-200 text-left ${
                              isOculto 
                                ? 'opacity-40 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                          >
                            <div 
                              className={`w-4 h-4 rounded-full flex-shrink-0 transition-opacity ${isOculto ? 'opacity-40' : ''}`}
                              style={{ backgroundColor: item.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isOculto ? 'line-through text-muted-foreground' : ''}`}>
                                {item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {tempoHoras > 0 ? `${tempoHoras}h ` : ''}{tempoMinutos}min
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {itensOcultos.size > 0 && (
                      <button
                        onClick={() => setItensOcultos(new Set())}
                        className="w-full mt-3 p-2 text-sm font-semibold text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 rounded-lg transition-colors"
                      >
                        Mostrar todos ({itensOcultos.size} oculto{itensOcultos.size > 1 ? 's' : ''})
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[450px]">
                  <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-full mb-4">
                    <PieChart className="h-12 w-12 text-pink-500" />
                  </div>
                  <p className="text-lg font-semibold text-muted-foreground">Nenhum dado disponível</p>
                  <p className="text-sm text-muted-foreground">para o período selecionado</p>
                </div>
              )}
            </CardContent>
          </Card>
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
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

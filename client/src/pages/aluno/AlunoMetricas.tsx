import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { alunoApi } from "@/lib/api";
import { BarChart3, Calendar, TrendingUp, PieChart, Activity } from "lucide-react";
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

const CORES_GRAFICOS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export default function AlunoMetricas() {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>("30d");
  const [estudos, setEstudos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEstudos = async () => {
    try {
      setIsLoading(true);
      const data = await alunoApi.getEstudos();
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
    
    return estudos.filter(e => new Date(e.data) >= dataLimite);
  }, [estudos, periodo]);

  // Dados para gráfico de evolução temporal
  const dadosEvolucao = useMemo(() => {
    if (!estudosFiltrados.length) return [];
    
    const porDia = estudosFiltrados.reduce((acc, estudo) => {
      const data = new Date(estudo.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      if (!acc[data]) {
        acc[data] = { data, tempo: 0, questoes: 0, acertos: 0 };
      }
      acc[data].tempo += estudo.tempoMinutos;
      acc[data].questoes += estudo.questoesFeitas;
      acc[data].acertos += estudo.questoesAcertadas;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(porDia).map((d: any) => ({
      ...d,
      percentual: d.questoes > 0 ? Math.round((d.acertos / d.questoes) * 100) : 0,
    }));
  }, [estudosFiltrados]);

  // Dados para gráfico por matéria
  const dadosPorMateria = useMemo(() => {
    if (!estudosFiltrados.length) return [];
    
    const porMateria = estudosFiltrados.reduce((acc, estudo) => {
      if (!acc[estudo.materia]) {
        acc[estudo.materia] = { materia: estudo.materia, tempo: 0, questoes: 0, acertos: 0 };
      }
      acc[estudo.materia].tempo += estudo.tempoMinutos;
      acc[estudo.materia].questoes += estudo.questoesFeitas;
      acc[estudo.materia].acertos += estudo.questoesAcertadas;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(porMateria).map((d: any) => ({
      ...d,
      percentual: d.questoes > 0 ? Math.round((d.acertos / d.questoes) * 100) : 0,
    })).sort((a, b) => b.questoes - a.questoes);
  }, [estudosFiltrados]);

  // Dados para gráfico de pizza (distribuição de tempo)
  const dadosDistribuicaoTempo = useMemo(() => {
    if (!estudosFiltrados.length) return [];
    
    return dadosPorMateria.map((d, index) => ({
      name: d.materia,
      value: d.tempo,
      color: CORES_GRAFICOS[index % CORES_GRAFICOS.length],
    }));
  }, [dadosPorMateria]);

  // Métricas gerais
  const metricas = useMemo(() => {
    const tempoTotal = estudosFiltrados.reduce((acc, e) => acc + e.tempoMinutos, 0);
    const questoesTotal = estudosFiltrados.reduce((acc, e) => acc + e.questoesFeitas, 0);
    const acertosTotal = estudosFiltrados.reduce((acc, e) => acc + e.questoesAcertadas, 0);
    const percentualAcerto = questoesTotal > 0 ? Math.round((acertosTotal / questoesTotal) * 100) : 0;
    
    // Calcular dias únicos de estudo (lidar com Timestamps do Firestore)
    const diasUnicos = new Set(
      estudosFiltrados.map(e => {
        let data: Date;
        
        if (e.data?.seconds) {
          data = new Date(e.data.seconds * 1000);
        } else if (e.data?.toDate) {
          data = e.data.toDate();
        } else {
          data = new Date(e.data);
        }
        
        return data.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      })
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com filtro */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análise de Desempenho</h1>
          <p className="text-muted-foreground">Acompanhe sua evolução nos estudos</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as PeriodoFiltro)}>
            <SelectTrigger className="w-[180px]">
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

      {/* Cards de métricas resumidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor(metricas.tempoTotal / 60)}h {metricas.tempoTotal % 60}m</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questões</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.questoesTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acertos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.acertosTotal}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.percentualAcerto}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dias de Estudo</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.diasEstudo}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="evolucao" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evolucao">Evolução Temporal</TabsTrigger>
          <TabsTrigger value="materias">Por Matéria</TabsTrigger>
          <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="evolucao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Desempenho</CardTitle>
              <CardDescription>Acompanhe sua progressão ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosEvolucao.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={dadosEvolucao}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="tempo"
                      stroke="#3b82f6"
                      name="Tempo (min)"
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="percentual"
                      stroke="#10b981"
                      name="Taxa de Acerto (%)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Matéria</CardTitle>
              <CardDescription>Compare seu progresso em cada disciplina</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosPorMateria.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dadosPorMateria}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="materia" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="questoes" fill="#3b82f6" name="Questões Feitas" />
                    <Bar dataKey="acertos" fill="#10b981" name="Acertos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Taxa de Acerto por Matéria</CardTitle>
              <CardDescription>Identifique seus pontos fortes e fracos</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosPorMateria.length > 0 ? (
                <div className="space-y-4">
                  {dadosPorMateria.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.materia}</span>
                        <span className="text-muted-foreground">
                          {item.percentual}% ({item.acertos}/{item.questoes})
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            item.percentual >= 80
                              ? "bg-green-500"
                              : item.percentual >= 60
                              ? "bg-blue-500"
                              : item.percentual >= 40
                              ? "bg-amber-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${item.percentual}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribuicao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Tempo por Matéria</CardTitle>
              <CardDescription>Veja como você distribui seu tempo de estudo</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosDistribuicaoTempo.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsPie>
                    <Pie
                      data={dadosDistribuicaoTempo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dadosDistribuicaoTempo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[350px] text-muted-foreground">
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

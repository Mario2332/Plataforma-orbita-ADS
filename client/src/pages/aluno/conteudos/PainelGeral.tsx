import { useMemo, useState, useEffect } from "react";
import { alunoApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import studyData from "@shared/study-content-data.json";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"];

export default function PainelGeral() {
  const [progressoMap, setProgressoMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgresso = async () => {
    try {
      setIsLoading(true);
      const data = await alunoApi.getProgresso();
      setProgressoMap(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar progresso");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProgresso();
  }, []);

  const stats = useMemo(() => {
    if (!progressoMap) return null;

    const materias = Object.entries(studyData as Record<string, any>);
    let totalTopicos = 0;
    let topicosEstudados = 0;

    const resumoPorMateria = materias.map(([key, materia]) => {
      const topics = materia.topics || [];
      const topicosMateria = topics.length;
      let estudadosMateria = 0;

      topics.forEach((topic: any) => {
        const progresso = progressoMap[topic.id];
        if (progresso?.estudado) {
          estudadosMateria++;
        }
      });

      totalTopicos += topicosMateria;
      topicosEstudados += estudadosMateria;

      const percentualEstudado = topicosMateria > 0
        ? ((estudadosMateria / topicosMateria) * 100).toFixed(1)
        : "0.0";

      return {
        materia: materia.displayName,
        topicos: topicosMateria,
        estudados: estudadosMateria,
        percentualEstudado: parseFloat(percentualEstudado)
      };
    });

    return {
      totalTopicos,
      topicosEstudados,
      resumoPorMateria
    };
  }, [progressoMap]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const dadosGraficoBarras = stats.resumoPorMateria.map(m => ({
    name: m.materia,
    "% Estudado": m.percentualEstudado
  }));

  const dadosGraficoPizza = stats.resumoPorMateria.map(m => ({
    name: m.materia,
    value: m.estudados
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Geral - Controle de Conteúdos</h1>
        <p className="text-muted-foreground mt-2">
          Visão completa do seu progresso em todas as matérias do ENEM
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tópicos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTopicos}</div>
            <p className="text-xs text-muted-foreground">
              Disponíveis para estudo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tópicos Estudados</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topicosEstudados}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.topicosEstudados / stats.totalTopicos) * 100).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Progresso por Matéria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficoBarras}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="% Estudado" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Tópicos Estudados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosGraficoPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosGraficoPizza.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Matéria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Matéria</th>
                  <th className="text-center p-3 font-semibold">Total Tópicos</th>
                  <th className="text-center p-3 font-semibold">Estudados</th>
                  <th className="text-center p-3 font-semibold">% Estudado</th>
                </tr>
              </thead>
              <tbody>
                {stats.resumoPorMateria.map((m, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{m.materia}</td>
                    <td className="p-3 text-center">{m.topicos}</td>
                    <td className="p-3 text-center">{m.estudados}</td>
                    <td className="p-3 text-center font-semibold">{m.percentualEstudado}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

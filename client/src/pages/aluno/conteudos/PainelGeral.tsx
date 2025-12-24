import { useMemo, useState, useEffect } from "react";
import { alunoApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, CheckCircle2, Zap, BarChart3, PieChart as PieChartIcon, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import studyData from "@shared/study-content-data.json";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#0891b2", "#0284c7", "#2563eb"];

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
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-emerald-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Zap className="h-8 w-8 text-emerald-500 animate-pulse" />
          </div>
        </div>
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

  const percentualGeral = ((stats.topicosEstudados / stats.totalTopicos) * 100).toFixed(1);

  return (
    <div className="container mx-auto py-6 space-y-8 pb-8 animate-fade-in">

      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-500 p-8 text-white animate-slide-up">
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
            <BookOpen className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold mb-2">Painel Geral - Controle de Conteúdos</h1>
            <p className="text-emerald-50 text-lg">Visão completa do seu progresso em todas as matérias do ENEM</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <Card className="border-2 hover:shadow-sm transition-all rounded-lg group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Total de Tópicos</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-xl shadow group-hover:scale-[1.01] transition-transform">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white bg-clip-text text-transparent">
              {stats.totalTopicos}
            </div>
            <p className="text-sm text-muted-foreground font-semibold mt-2">
              Disponíveis para estudo
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-sm transition-all rounded-lg group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Tópicos Estudados</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-xl shadow group-hover:scale-[1.01] transition-transform">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-gray-900 dark:text-white bg-clip-text text-transparent">
              {stats.topicosEstudados}
            </div>
            <p className="text-sm text-muted-foreground font-semibold mt-2">
              {percentualGeral}% do total
            </p>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${percentualGeral}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <Card className="border-2 hover:shadow-sm transition-shadow rounded-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl shadow">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold">Progresso por Matéria</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficoBarras}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#6b7280" style={{ fontWeight: 'bold', fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontWeight: 'bold' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', fontWeight: 'bold' }} />
                <Legend wrapperStyle={{ fontWeight: 'bold' }} />
                <Bar dataKey="% Estudado" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-sm transition-shadow rounded-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-xl shadow">
                <PieChartIcon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold">Distribuição de Tópicos Estudados</CardTitle>
            </div>
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
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 hover:shadow-sm transition-shadow rounded-lg animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500 rounded-xl shadow">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-semibold">Resumo por Matéria</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                  <th className="text-left p-4 font-semibold text-emerald-900">Matéria</th>
                  <th className="text-center p-4 font-semibold text-emerald-900">Total Tópicos</th>
                  <th className="text-center p-4 font-semibold text-emerald-900">Estudados</th>
                  <th className="text-center p-4 font-semibold text-emerald-900">% Estudado</th>
                </tr>
              </thead>
              <tbody>
                {stats.resumoPorMateria.map((m, idx) => (
                  <tr key={idx} className="border-b hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all">
                    <td className="p-4 font-bold">{m.materia}</td>
                    <td className="p-4 text-center font-semibold">{m.topicos}</td>
                    <td className="p-4 text-center font-semibold">{m.estudados}</td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-semibold text-lg text-gray-900 dark:text-white bg-clip-text text-transparent">
                          {m.percentualEstudado}%
                        </span>
                        <div className="w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${m.percentualEstudado}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

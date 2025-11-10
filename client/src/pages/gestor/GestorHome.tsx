import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, TrendingUp } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useAuthContext } from "@/contexts/AuthContext";

export default function GestorHome() {
  const { user } = useAuthContext();
  const { data: totalAlunos, isLoading: loadingAlunos } = trpc.gestor.getTotalAlunos.useQuery();
  const { data: mentores, isLoading: loadingMentores } = trpc.gestor.getMentores.useQuery();
  const { data: alunos } = trpc.gestor.getAllAlunos.useQuery();
  
  // Calcular crescimento de alunos por mês
  const getAlunosGrowthData = () => {
    if (!alunos) return [];
    
    const monthlyData: Record<string, number> = {};
    
    alunos.forEach((aluno: any) => {
      const date = new Date(aluno.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });
    
    // Converter para array e calcular acumulado
    const sortedMonths = Object.keys(monthlyData).sort();
    let accumulated = 0;
    
    return sortedMonths.map((month) => {
      accumulated += monthlyData[month];
      const [year, monthNum] = month.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return {
        mes: `${monthNames[parseInt(monthNum) - 1]}/${year.slice(2)}`,
        novos: monthlyData[month],
        total: accumulated,
      };
    });
  };

  // Calcular crescimento de mentores por mês
  const getMentoresGrowthData = () => {
    if (!mentores) return [];
    
    const monthlyData: Record<string, number> = {};
    
    mentores.forEach((mentor: any) => {
      const date = new Date(mentor.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
    });
    
    const sortedMonths = Object.keys(monthlyData).sort();
    let accumulated = 0;
    
    return sortedMonths.map((month) => {
      accumulated += monthlyData[month];
      const [year, monthNum] = month.split('-');
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return {
        mes: `${monthNames[parseInt(monthNum) - 1]}/${year.slice(2)}`,
        novos: monthlyData[month],
        total: accumulated,
      };
    });
  };

  // Calcular alunos por mentor
  const getAlunosPorMentor = () => {
    if (!alunos || !mentores) return [];
    
    const mentorCount: Record<number, number> = {};
    
    alunos.forEach((aluno: any) => {
      mentorCount[aluno.mentorId] = (mentorCount[aluno.mentorId] || 0) + 1;
    });
    
    return mentores.map((mentor: any) => ({
      nome: mentor.nome,
      alunos: mentorCount[mentor.id] || 0,
    })).sort((a: any, b: any) => b.alunos - a.alunos);
  };

  const alunosGrowthData = getAlunosGrowthData();
  const mentoresGrowthData = getMentoresGrowthData();
  const alunosPorMentor = getAlunosPorMentor();

  // Calcular crescimento percentual
  const calcularCrescimento = (data: any[]) => {
    if (data.length < 2) return 0;
    const ultimo = data[data.length - 1].novos;
    const penultimo = data[data.length - 2].novos;
    if (penultimo === 0) return 100;
    return ((ultimo - penultimo) / penultimo * 100).toFixed(1);
  };

  const crescimentoAlunos = calcularCrescimento(alunosGrowthData);
  const crescimentoMentores = calcularCrescimento(mentoresGrowthData);

  if (loadingAlunos || loadingMentores) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard do Gestor</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo à Mentoria Mário Machado, {user?.name}!
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mentores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentores?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {mentores?.filter((m: any) => m.ativo).length || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAlunos || 0}</div>
            <p className="text-xs text-muted-foreground">
              Em toda a plataforma
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alunosGrowthData.length > 0 
                ? `${alunosGrowthData[alunosGrowthData.length - 1].novos}` 
                : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {crescimentoAlunos !== "0" 
                ? `${Number(crescimentoAlunos) > 0 ? '+' : ''}${crescimentoAlunos}% vs mês anterior`
                : "Em breve"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visão Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
          <CardDescription>Resumo da Mentoria Mário Machado</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Gerencie mentores, configure plataformas white-label e acompanhe o crescimento da rede de estudantes.
          </p>
        </CardContent>
      </Card>

      {/* Gráficos de Crescimento */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Alunos</CardTitle>
            <CardDescription>Evolução do número de alunos ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            {alunosGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={alunosGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total Acumulado" strokeWidth={2} />
                  <Line type="monotone" dataKey="novos" stroke="#10b981" name="Novos no Mês" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível ainda
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crescimento de Mentores</CardTitle>
            <CardDescription>Evolução do número de mentores ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            {mentoresGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mentoresGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#8b5cf6" name="Total Acumulado" strokeWidth={2} />
                  <Line type="monotone" dataKey="novos" stroke="#f59e0b" name="Novos no Mês" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Nenhum dado disponível ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Alunos por Mentor */}
      <Card>
        <CardHeader>
          <CardTitle>Alunos por Mentor</CardTitle>
          <CardDescription>Distribuição de alunos entre os mentores</CardDescription>
        </CardHeader>
        <CardContent>
          {alunosPorMentor.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={alunosPorMentor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nome" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="alunos" fill="#3b82f6" name="Número de Alunos" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlunoApi } from "@/hooks/useAlunoApi";
import { 
  Activity, 
  BookOpen, 
  Calendar, 
  FileText, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  BarChart3,
  PlayCircle,
  Plus,
  ArrowRight,
  Flame,
  Trophy,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";

// Função auxiliar para formatar data no fuso horário brasileiro (GMT-3)
const formatarDataBrasil = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Matérias padronizadas do ENEM
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
] as const;

export default function AlunoHome() {
  console.log('[AlunoHome] Componente montado!');
  const api = useAlunoApi();
  const [, setLocation] = useLocation();
  const { userData } = useAuthContext();
  const [estudos, setEstudos] = useState<any[]>([]);
  const [simulados, setSimulados] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [estudosData, simuladosData] = await Promise.all([
        api.getEstudos(),
        api.getSimulados(),
      ]);
      setEstudos(estudosData as any[]);
      setSimulados(simuladosData as any[]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Zap className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Calcular métricas
  const tempoTotal = estudos?.reduce((acc, e) => acc + e.tempoMinutos, 0) || 0;
  const questoesTotal = estudos?.reduce((acc, e) => acc + e.questoesFeitas, 0) || 0;
  const acertosTotal = estudos?.reduce((acc, e) => acc + e.questoesAcertadas, 0) || 0;
  const percentualAcerto = questoesTotal > 0 ? Math.round((acertosTotal / questoesTotal) * 100) : 0;

  // Último simulado
  const ultimoSimulado = simulados?.[0];
  const acertosUltimoSimulado = ultimoSimulado
    ? ultimoSimulado.linguagensAcertos +
      ultimoSimulado.humanasAcertos +
      ultimoSimulado.naturezaAcertos +
      ultimoSimulado.matematicaAcertos
    : 0;

  // Calcular streak (dias consecutivos de estudo)
  const calcularStreak = () => {
    if (!estudos || estudos.length === 0) return 0;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const datasEstudo = estudos
      .map(e => {
        try {
          let data: Date;
          
          // Lidar com diferentes formatos de data
          if (e.data?.seconds || e.data?._seconds) {
            // Timestamp do Firestore (com ou sem underscore)
            const seconds = e.data.seconds || e.data._seconds;
            data = new Date(seconds * 1000);
          } else if (e.data?.toDate) {
            // Timestamp do Firestore (método toDate)
            data = e.data.toDate();
          } else {
            // String ou Date
            data = new Date(e.data);
          }
          
          // Validar se a data é válida
          if (isNaN(data.getTime())) {
            return null;
          }
          
          data.setHours(0, 0, 0, 0);
          return data.getTime();
        } catch (error) {
          return null;
        }
      })
      .filter((v): v is number => v !== null) // Remover datas inválidas
      .filter((v, i, a) => a.indexOf(v) === i) // Remover duplicatas
      .sort((a, b) => b - a); // Ordenar do mais recente para o mais antigo
    
    let streak = 0;
    let dataEsperada = hoje.getTime();
    
    // Verificar se estudou hoje ou ontem (para não quebrar a sequência)
    const ontem = hoje.getTime() - 24 * 60 * 60 * 1000;
    const estudouHoje = datasEstudo.includes(hoje.getTime());
    const estudouOntem = datasEstudo.includes(ontem);
    
    if (!estudouHoje && !estudouOntem) {
      return 0; // Sequência quebrada
    }
    
    // Começar a contar do dia mais recente
    if (!estudouHoje) {
      dataEsperada = ontem;
    }
    
    for (const data of datasEstudo) {
      if (data === dataEsperada) {
        streak++;
        dataEsperada -= 24 * 60 * 60 * 1000; // Voltar 1 dia
      } else if (data < dataEsperada) {
        // Pulou um dia, quebrou a sequência
        break;
      }
    }
    
    return streak;
  };

  const streak = calcularStreak();

  // Gerar dados para o mapa de calor (últimos 150 dias)
  const gerarMapaCalor = () => {
    const dias: { data: Date; count: number; }[] = [];
    const hoje = new Date();
    
    // Criar um mapa de contagem de estudos por dia
    const contagemPorDia = new Map<string, number>();
    
    estudos.forEach(e => {
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
        
        // Validar se a data é válida
        if (isNaN(data.getTime())) {
          console.warn('Data inválida ignorada no mapa de calor:', e.data);
          return;
        }
        
        const dataStr = formatarDataBrasil(data);
        contagemPorDia.set(dataStr, (contagemPorDia.get(dataStr) || 0) + 1);
      } catch (error) {
        console.error('Erro ao processar data no mapa de calor:', error);
      }
    });
    
    // Gerar últimos 150 dias
    for (let i = 149; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      const dataStr = formatarDataBrasil(data);
      
      dias.push({
        data: data,
        count: contagemPorDia.get(dataStr) || 0,
      });
    }
    
    return dias;
  };
  
  const mapaCalor = gerarMapaCalor();
  
  // Análise por matéria (pontos fortes e fracos) - Cálculo direto
  const calcularAnalisePorMateria = () => {
    if (!estudos || estudos.length === 0) {
      return { pontosFortes: [], pontosFracos: [] };
    }
    
    const porMateria: Record<string, { questoes: number; acertos: number }> = {};
    
    // Agregar dados dos estudos
    for (const estudo of estudos) {
      const materia = estudo.materia;
      if (!porMateria[materia]) {
        porMateria[materia] = { questoes: 0, acertos: 0 };
      }
      porMateria[materia].questoes += estudo.questoesFeitas || 0;
      porMateria[materia].acertos += estudo.questoesAcertadas || 0;
    }
    
    const pontosFortes: Array<{ materia: string; percentual: number; acertos: number; questoes: number }> = [];
    const pontosFracos: Array<{ materia: string; percentual: number; acertos: number; questoes: number }> = [];
    
    // Classificar matérias
    for (const [materia, dados] of Object.entries(porMateria)) {
      if (dados.questoes >= 5) {
        const percentual = Math.round((dados.acertos / dados.questoes) * 100);
        const item = { materia, percentual, acertos: dados.acertos, questoes: dados.questoes };
        
        if (percentual >= 80) {
          pontosFortes.push(item);
        } else if (percentual < 60) {
          pontosFracos.push(item);
        }
      }
    }
    
    return { pontosFortes, pontosFracos };
  };
  
  const analisePorMateria = calcularAnalisePorMateria();
  
  // Função para determinar a cor baseada na contagem
  const getCorIntensidade = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count === 1) return 'bg-emerald-200 dark:bg-emerald-900';
    if (count === 2) return 'bg-emerald-400 dark:bg-emerald-700';
    if (count >= 3) return 'bg-emerald-600 dark:bg-emerald-500';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header com gradiente */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 border border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Bem-vindo de volta, {userData?.name?.split(' ')[0] || "Aluno"}!
            </h1>
            <span className="text-4xl animate-wave inline-block">👋</span>
          </div>
          <p className="text-lg text-muted-foreground">
            Continue sua jornada rumo à aprovação no ENEM
          </p>
        </div>
      </div>

      {/* Cards de Métricas Principais com design moderno */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card Sequência */}
        <Card className="relative overflow-hidden border-2 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sequência de Dias</CardTitle>
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg shadow-orange-500/30">
              <Flame className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
              {streak} dias
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {streak > 0 ? "🔥 Continue assim!" : "Comece sua sequência hoje"}
            </p>
          </CardContent>
        </Card>

        {/* Card Tempo Total */}
        <Card className="relative overflow-hidden border-2 hover:border-blue-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg shadow-blue-500/30">
              <Clock className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
              {Math.floor(tempoTotal / 60)}h {tempoTotal % 60}min
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dedicados aos estudos
            </p>
          </CardContent>
        </Card>

        {/* Card Questões */}
        <Card className="relative overflow-hidden border-2 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questões Resolvidas</CardTitle>
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              {questoesTotal}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {percentualAcerto}% de acerto
            </p>
          </CardContent>
        </Card>

        {/* Card Simulado */}
        <Card className="relative overflow-hidden border-2 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Simulado</CardTitle>
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg shadow-purple-500/30">
              <FileText className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
              {acertosUltimoSimulado}/180
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {ultimoSimulado ? (() => {
                try {
                  let data: Date;
                  if (ultimoSimulado.data?.seconds || ultimoSimulado.data?._seconds) {
                    const seconds = ultimoSimulado.data.seconds || ultimoSimulado.data._seconds;
                    data = new Date(seconds * 1000);
                  } else if (ultimoSimulado.data?.toDate) {
                    data = ultimoSimulado.data.toDate();
                  } else {
                    data = new Date(ultimoSimulado.data);
                  }
                  return !isNaN(data.getTime()) ? data.toLocaleDateString('pt-BR') : 'Data inválida';
                } catch {
                  return 'Data inválida';
                }
              })() : "Nenhum simulado"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas com design moderno */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="relative overflow-hidden border-2 hover:border-blue-500 transition-all duration-300 cursor-pointer group hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1" 
          onClick={() => setLocation("/aluno/estudos")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                  <PlayCircle className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Iniciar Cronômetro</CardTitle>
                  <CardDescription className="text-xs">Registre seu tempo de estudo</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="relative overflow-hidden border-2 hover:border-emerald-500 transition-all duration-300 cursor-pointer group hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1" 
          onClick={() => setLocation("/aluno/estudos")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Plus className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Registrar Estudo</CardTitle>
                  <CardDescription className="text-xs">Adicione manualmente</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="relative overflow-hidden border-2 hover:border-purple-500 transition-all duration-300 cursor-pointer group hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1" 
          onClick={() => setLocation("/aluno/simulados")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Novo Simulado</CardTitle>
                  <CardDescription className="text-xs">Registre seus resultados</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Mapa de Calor com design aprimorado */}
      <Card className="border-2 hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                Atividade de Estudos
              </CardTitle>
              <CardDescription className="mt-2">Últimos 150 dias - Quanto mais escuro, mais sessões registradas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-30 gap-1.5 min-w-[800px]">
              {mapaCalor.map((dia, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-sm ${getCorIntensidade(dia.count)} hover:ring-2 hover:ring-primary hover:scale-125 transition-all cursor-pointer`}
                  title={`${dia.data.toLocaleDateString('pt-BR')}: ${dia.count} sessões`}
                />
              ))}
            </div>
            <div className="flex items-center gap-4 mt-6 text-xs text-muted-foreground">
              <span className="font-medium">Menos</span>
              <div className="flex gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-gray-100 dark:bg-gray-800 border" />
                <div className="w-4 h-4 rounded-sm bg-emerald-200 dark:bg-emerald-900" />
                <div className="w-4 h-4 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
                <div className="w-4 h-4 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
              </div>
              <span className="font-medium">Mais</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise Inteligente e Atividade Recente */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Análise Inteligente */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              Análise Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pontos Fortes */}
            {analisePorMateria.pontosFortes.length > 0 && (
              <div className="relative overflow-hidden p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                <div className="relative">
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Pontos Fortes (≥ 80%)
                  </p>
                  <div className="space-y-2">
                    {analisePorMateria.pontosFortes.map(m => (
                      <div key={m.materia} className="flex justify-between items-center text-sm bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold">{m.materia}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{m.percentual}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Pontos Fracos */}
            {analisePorMateria.pontosFracos.length > 0 && (
              <div className="relative overflow-hidden p-5 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950 dark:to-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl" />
                <div className="relative">
                  <p className="text-sm font-bold text-red-900 dark:text-red-100 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Pontos Fracos (&lt; 60%)
                  </p>
                  <div className="space-y-2">
                    {analisePorMateria.pontosFracos.map(m => (
                      <div key={m.materia} className="flex justify-between items-center text-sm bg-white/50 dark:bg-black/20 p-2 rounded-lg">
                        <span className="text-red-700 dark:text-red-300 font-semibold">{m.materia}</span>
                        <span className="text-red-600 dark:text-red-400 font-bold">{m.percentual}%</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-3 bg-white/30 dark:bg-black/20 p-3 rounded-lg">
                    💡 <strong>Dica:</strong> Foque nos tópicos de maior incidência dessas matérias
                  </p>
                </div>
              </div>
            )}
            
            {/* Sequência de estudos */}
            {streak === 0 && (
              <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950 dark:to-orange-900/30 border-2 border-orange-200 dark:border-orange-800 rounded-xl">
                <p className="text-sm font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Comece sua sequência hoje!
                </p>
                <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                  Estudar todos os dias aumenta sua retenção em até 40%
                </p>
              </div>
            )}
            
            {streak > 0 && streak < 7 && (
              <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  {streak} dias de sequência!
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Continue para formar o hábito de estudar todos os dias
                </p>
              </div>
            )}

            {streak >= 7 && (
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl">
                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  {streak} dias consecutivos!
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-2">
                  Excelente consistência! Você está no caminho certo.
                </p>
              </div>
            )}
            
            {/* Mensagem quando não há dados suficientes */}
            {analisePorMateria.pontosFortes.length === 0 && analisePorMateria.pontosFracos.length === 0 && (
              <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Dados insuficientes
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  Faça pelo menos 5 questões de cada matéria para ver sua análise detalhada
                </p>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full border-2 hover:bg-primary hover:text-white transition-all duration-300"
              onClick={() => setLocation("/aluno/metricas")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Ver Análise Completa
            </Button>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estudos && estudos.length > 0 ? (
                estudos.slice(0, 5).map((estudo, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0 hover:bg-accent/50 p-2 rounded-lg transition-colors">
                    <div className="p-2.5 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-md">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{estudo.materia}</p>
                      <p className="text-xs text-muted-foreground truncate">{estudo.conteudo}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {estudo.tempoMinutos}min
                        </span>
                        {estudo.questoesFeitas > 0 && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {estudo.questoesAcertadas}/{estudo.questoesFeitas}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum estudo registrado ainda
                  </p>
                  <Button 
                    size="sm"
                    onClick={() => setLocation("/aluno/estudos")}
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primeiro Estudo
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-15deg); }
        }
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
          transform-origin: 70% 70%;
        }
      `}</style>
    </div>
  );
}

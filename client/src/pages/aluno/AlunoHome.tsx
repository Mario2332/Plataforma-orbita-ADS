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
  Zap,
  Star,
  Award,
  TrendingDown
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
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Zap className="h-8 w-8 text-primary animate-pulse" />
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
          
          data.setHours(0, 0, 0, 0);
          return data.getTime();
        } catch (error) {
          return null;
        }
      })
      .filter((v): v is number => v !== null)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => b - a);
    
    let streak = 0;
    let dataEsperada = hoje.getTime();
    
    const ontem = hoje.getTime() - 24 * 60 * 60 * 1000;
    const estudouHoje = datasEstudo.includes(hoje.getTime());
    const estudouOntem = datasEstudo.includes(ontem);
    
    if (!estudouHoje && !estudouOntem) {
      return 0;
    }
    
    if (!estudouHoje) {
      dataEsperada = ontem;
    }
    
    for (const data of datasEstudo) {
      if (data === dataEsperada) {
        streak++;
        dataEsperada -= 24 * 60 * 60 * 1000;
      } else if (data < dataEsperada) {
        break;
      }
    }
    
    return streak;
  };

  const streak = calcularStreak();

  // Gerar dados para o mapa de calor
  const gerarMapaCalor = () => {
    const dias: { data: Date; count: number; }[] = [];
    const hoje = new Date();
    
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
        
        if (isNaN(data.getTime())) {
          return;
        }
        
        const dataStr = formatarDataBrasil(data);
        contagemPorDia.set(dataStr, (contagemPorDia.get(dataStr) || 0) + 1);
      } catch (error) {
        console.error('Erro ao processar data no mapa de calor:', error);
      }
    });
    
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
  
  // Análise por matéria
  const calcularAnalisePorMateria = () => {
    if (!estudos || estudos.length === 0) {
      return { pontosFortes: [], pontosFracos: [] };
    }
    
    const porMateria: Record<string, { questoes: number; acertos: number }> = {};
    
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
  
  const getCorIntensidade = (count: number) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count === 1) return 'bg-emerald-200 dark:bg-emerald-900';
    if (count === 2) return 'bg-emerald-400 dark:bg-emerald-700';
    if (count >= 3) return 'bg-emerald-600 dark:bg-emerald-500';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  // Componente de progresso circular
  const CircularProgress = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    const circumference = 2 * Math.PI * 36;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90 w-24 h-24">
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <circle
            cx="48"
            cy="48"
            r="36"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${color} transition-all duration-1000 ease-out`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Elementos decorativos flutuantes */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-float-delayed pointer-events-none" />

      {/* Header Premium com Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-blue-500/10 p-10 border-2 border-white/20 dark:border-white/10 backdrop-blur-xl shadow-2xl animate-slide-up">
        {/* Efeitos de luz */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        {/* Partículas decorativas */}
        <div className="absolute top-10 right-20 w-2 h-2 bg-primary rounded-full animate-ping" />
        <div className="absolute top-20 right-40 w-1.5 h-1.5 bg-purple-500 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-10 left-20 w-2 h-2 bg-blue-500 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        
        <div className="relative space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-2xl blur-xl opacity-50 animate-pulse-slow" />
              <div className="relative bg-gradient-to-br from-primary via-purple-500 to-blue-500 p-4 rounded-2xl shadow-2xl">
                <Trophy className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                Olá, {userData?.name?.split(' ')[0] || "Aluno"}!
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-6xl animate-wave inline-block">👋</span>
                {streak > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full border border-orange-500/30 backdrop-blur-sm animate-bounce-subtle">
                    <Flame className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak} dias de foco!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-xl text-muted-foreground font-medium">
            Continue sua jornada rumo à aprovação no ENEM 🎯
          </p>
        </div>
      </div>

      {/* Cards de Métricas com Progresso Circular */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card Sequência Premium */}
        <Card className="relative overflow-hidden border-2 hover:border-orange-500 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/20 group animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-500/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Sequência de Dias
                {streak >= 7 && <Star className="h-4 w-4 text-orange-500 fill-orange-500 animate-spin-slow" />}
              </CardTitle>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl blur-md opacity-50 animate-pulse-slow" />
              <div className="relative p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-xl">
                <Flame className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 bg-clip-text text-transparent">
                {streak}
              </div>
              <span className="text-lg font-bold text-muted-foreground">dias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((streak / 30) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Meta: 30</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {streak > 0 ? "🔥 Mantenha o ritmo!" : "Comece hoje!"}
            </p>
          </CardContent>
        </Card>

        {/* Card Tempo com Progresso */}
        <Card className="relative overflow-hidden border-2 hover:border-blue-500 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 group animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold">Tempo Total</CardTitle>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl blur-md opacity-50 animate-pulse-slow" />
              <div className="relative p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                {Math.floor(tempoTotal / 60)}h
              </div>
              <span className="text-2xl font-bold text-muted-foreground">{tempoTotal % 60}min</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Dedicados aos estudos 📚
            </p>
          </CardContent>
        </Card>

        {/* Card Questões com Gráfico Circular */}
        <Card className="relative overflow-hidden border-2 hover:border-emerald-500 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 group animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold">Questões</CardTitle>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{percentualAcerto}% acerto</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl blur-md opacity-50 animate-pulse-slow" />
              <div className="relative p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-xl">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 bg-clip-text text-transparent">
                {questoesTotal}
              </div>
              <span className="text-lg font-bold text-muted-foreground">resolvidas</span>
            </div>
          </CardContent>
        </Card>

        {/* Card Simulado */}
        <Card className="relative overflow-hidden border-2 hover:border-purple-500 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 group animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold">Último Simulado</CardTitle>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl blur-md opacity-50 animate-pulse-slow" />
              <div className="relative p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-black bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                {acertosUltimoSimulado}
              </div>
              <span className="text-2xl font-bold text-muted-foreground">/180</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
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
              })() : "Nenhum simulado realizado"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas Premium */}
      <div className="grid gap-5 md:grid-cols-3 animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <Card 
          className="relative overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all duration-500 cursor-pointer group hover:shadow-2xl hover:shadow-blue-500/30 hover:-translate-y-2 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20" 
          onClick={() => setLocation("/aluno/estudos")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <PlayCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Iniciar Cronômetro</CardTitle>
                  <CardDescription className="text-sm mt-1">Registre seu tempo de estudo</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-2 transition-all duration-300" />
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="relative overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-all duration-500 cursor-pointer group hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-2 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20" 
          onClick={() => setLocation("/aluno/estudos")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative p-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Plus className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Registrar Estudo</CardTitle>
                  <CardDescription className="text-sm mt-1">Adicione manualmente</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-emerald-500 group-hover:translate-x-2 transition-all duration-300" />
            </div>
          </CardHeader>
        </Card>

        <Card 
          className="relative overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all duration-500 cursor-pointer group hover:shadow-2xl hover:shadow-purple-500/30 hover:-translate-y-2 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20" 
          onClick={() => setLocation("/aluno/simulados")}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
          
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div>
                  <CardTitle className="text-xl font-black">Novo Simulado</CardTitle>
                  <CardDescription className="text-sm mt-1">Registre seus resultados</CardDescription>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-purple-500 group-hover:translate-x-2 transition-all duration-300" />
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Mapa de Calor Premium */}
      <Card className="border-2 hover:shadow-2xl transition-all duration-500 animate-slide-up" style={{ animationDelay: '0.6s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-black">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-xl blur-md opacity-50" />
                  <div className="relative p-3 bg-gradient-to-br from-primary to-purple-500 rounded-xl shadow-xl">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                </div>
                Atividade de Estudos
              </CardTitle>
              <CardDescription className="mt-3 text-base">
                Últimos 150 dias - Quanto mais escuro, mais sessões registradas
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-30 gap-2 min-w-[800px]">
              {mapaCalor.map((dia, index) => (
                <div
                  key={index}
                  className={`w-3.5 h-3.5 rounded-md ${getCorIntensidade(dia.count)} hover:ring-2 hover:ring-primary hover:scale-150 transition-all duration-300 cursor-pointer shadow-sm`}
                  title={`${dia.data.toLocaleDateString('pt-BR')}: ${dia.count} sessões`}
                />
              ))}
            </div>
            <div className="flex items-center gap-5 mt-8 text-sm font-medium text-muted-foreground">
              <span>Menos</span>
              <div className="flex gap-2">
                <div className="w-5 h-5 rounded-md bg-gray-100 dark:bg-gray-800 border-2 shadow-sm" />
                <div className="w-5 h-5 rounded-md bg-emerald-200 dark:bg-emerald-900 shadow-sm" />
                <div className="w-5 h-5 rounded-md bg-emerald-400 dark:bg-emerald-700 shadow-sm" />
                <div className="w-5 h-5 rounded-md bg-emerald-600 dark:bg-emerald-500 shadow-sm" />
              </div>
              <span>Mais</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise e Atividade */}
      <div className="grid gap-6 md:grid-cols-2 animate-slide-up" style={{ animationDelay: '0.7s' }}>
        {/* Análise Inteligente Premium */}
        <Card className="border-2 hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-black">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-xl blur-md opacity-50" />
                <div className="relative p-3 bg-gradient-to-br from-primary to-purple-500 rounded-xl shadow-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
              Análise Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {analisePorMateria.pontosFortes.length > 0 && (
              <div className="relative overflow-hidden p-6 bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-green-50/30 dark:from-emerald-950 dark:via-emerald-900/30 dark:to-green-900/20 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/20 rounded-full blur-2xl" />
                
                <div className="relative">
                  <p className="text-base font-black text-emerald-900 dark:text-emerald-100 mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5 fill-emerald-600" />
                    Pontos Fortes (≥ 80%)
                  </p>
                  <div className="space-y-3">
                    {analisePorMateria.pontosFortes.map(m => (
                      <div key={m.materia} className="flex justify-between items-center bg-white/60 dark:bg-black/30 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{m.materia}</span>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm font-black shadow-md">
                            {m.percentual}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {analisePorMateria.pontosFracos.length > 0 && (
              <div className="relative overflow-hidden p-6 bg-gradient-to-br from-red-50 via-red-100/50 to-orange-50/30 dark:from-red-950 dark:via-red-900/30 dark:to-orange-900/20 border-2 border-red-300 dark:border-red-700 rounded-2xl shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/20 rounded-full blur-2xl" />
                
                <div className="relative">
                  <p className="text-base font-black text-red-900 dark:text-red-100 mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Pontos Fracos (&lt; 60%)
                  </p>
                  <div className="space-y-3">
                    {analisePorMateria.pontosFracos.map(m => (
                      <div key={m.materia} className="flex justify-between items-center bg-white/60 dark:bg-black/30 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-sm font-bold text-red-700 dark:text-red-300">{m.materia}</span>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-black shadow-md">
                            {m.percentual}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-white/40 dark:bg-black/20 rounded-xl border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                      💡 <strong>Dica:</strong> Foque nos tópicos de maior incidência dessas matérias
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {streak === 0 && (
              <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950 dark:to-orange-900/30 border-2 border-orange-300 dark:border-orange-700 rounded-2xl shadow-lg">
                <p className="text-base font-black text-orange-900 dark:text-orange-100 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Comece sua sequência hoje!
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-2 font-medium">
                  Estudar todos os dias aumenta sua retenção em até 40%
                </p>
              </div>
            )}
            
            {streak > 0 && streak < 7 && (
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-2xl shadow-lg">
                <p className="text-base font-black text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  {streak} dias de sequência!
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 font-medium">
                  Continue para formar o hábito de estudar todos os dias
                </p>
              </div>
            )}

            {streak >= 7 && (
              <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950 dark:to-emerald-900/30 border-2 border-emerald-300 dark:border-emerald-700 rounded-2xl shadow-lg">
                <p className="text-base font-black text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                  <Trophy className="h-5 w-5 fill-emerald-600" />
                  {streak} dias consecutivos!
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2 font-medium">
                  Excelente consistência! Você está no caminho certo.
                </p>
              </div>
            )}
            
            {analisePorMateria.pontosFortes.length === 0 && analisePorMateria.pontosFracos.length === 0 && (
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/30 border-2 border-blue-300 dark:border-blue-700 rounded-2xl shadow-lg">
                <p className="text-base font-black text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Dados insuficientes
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 font-medium">
                  Faça pelo menos 5 questões de cada matéria para ver sua análise detalhada
                </p>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full border-2 hover:bg-gradient-to-r hover:from-primary hover:to-purple-500 hover:text-white hover:border-transparent transition-all duration-300 font-bold text-base py-6 shadow-lg hover:shadow-xl"
              onClick={() => setLocation("/aluno/metricas")}
            >
              <BarChart3 className="h-5 w-5 mr-2" />
              Ver Análise Completa
            </Button>
          </CardContent>
        </Card>

        {/* Atividade Recente Premium */}
        <Card className="border-2 hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-black">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-xl blur-md opacity-50" />
                <div className="relative p-3 bg-gradient-to-br from-primary to-purple-500 rounded-xl shadow-xl">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estudos && estudos.length > 0 ? (
                estudos.slice(0, 5).map((estudo, index) => (
                  <div key={index} className="group flex items-start gap-4 pb-4 border-b last:border-0 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent p-3 rounded-xl transition-all duration-300">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity" />
                      <div className="relative p-3 bg-gradient-to-br from-primary to-purple-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold truncate">{estudo.materia}</p>
                      <p className="text-sm text-muted-foreground truncate">{estudo.conteudo}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <Clock className="h-3.5 w-3.5" />
                          {estudo.tempoMinutos}min
                        </span>
                        {estudo.questoesFeitas > 0 && (
                          <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {estudo.questoesAcertadas}/{estudo.questoesFeitas}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <div className="relative mx-auto w-20 h-20 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary to-purple-500 rounded-full blur-xl opacity-30" />
                    <div className="relative p-5 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full flex items-center justify-center">
                      <BookOpen className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                  <p className="text-base text-muted-foreground mb-6 font-medium">
                    Nenhum estudo registrado ainda
                  </p>
                  <Button 
                    size="lg"
                    onClick={() => setLocation("/aluno/estudos")}
                    className="bg-gradient-to-r from-primary via-purple-500 to-blue-500 hover:from-primary/90 hover:via-purple-500/90 hover:to-blue-500/90 shadow-xl hover:shadow-2xl transition-all duration-300 font-bold"
                  >
                    <Plus className="h-5 w-5 mr-2" />
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
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
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
        
        .animate-wave {
          animation: wave 2s ease-in-out infinite;
          transform-origin: 70% 70%;
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
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
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

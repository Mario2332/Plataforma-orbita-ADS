import React, { useState, useEffect, useMemo } from "react";
import { cronogramaAnualApi } from "../../../lib/api-cronograma-anual";
import { Loader2, TrendingUp, Award, Target, Zap, BarChart3, PieChart } from "lucide-react";

type CronogramaTipo = "extensive" | "intensive";

interface Subject {
  name: string;
  topics: string[];
}

interface Cycle {
  cycle: number;
  subjects: Subject[];
}

interface CronogramaData {
  cycles: Cycle[];
}

interface Stats {
  total: number;
  completed: number;
  percentage: number;
}

interface StatsData {
  total: Stats;
  areas: Record<string, Stats>;
  cycles: Array<{
    cycle: number;
    total: number;
    completed: number;
    percentage: number;
  }>;
}

const SUBJECT_GROUPS: Record<string, string[]> = {
  'Matemática': ['Mat. Básica', 'Matemática 1', 'Matemática 2', 'Matemática 3'],
  'Física': ['Física 1', 'Física 2', 'Física 3'],
  'Química': ['Química 1', 'Quimica 1', 'Química 2', 'Quimica 2', 'Química 3', 'Quimica 3'],
  'Biologia': ['Biologia 1', 'Biologia 2', 'Biologia 3'],
  'História': ['História Geral', 'História do Brasil'],
  'Geografia': ['Geografia 1', 'Geografia 2', 'Geografia 3'],
  'Filosofia': ['Filosofia'],
  'Sociologia': ['Sociologia'],
  'Linguagens': ['Linguagens']
};

// Paleta azul padronizada
const AREA_COLORS: Record<string, string> = {
  'Matemática': 'bg-emerald-500',
  'Física': 'bg-indigo-500',
  'Química': 'bg-teal-500',
  'Biologia': 'bg-emerald-500',
  'História': 'bg-emerald-600',
  'Geografia': 'bg-teal-600',
  'Filosofia': 'bg-indigo-600',
  'Sociologia': 'bg-emerald-600',
  'Linguagens': 'bg-emerald-400'
};

export default function CronogramaEstatisticas() {
  const [tipo, setTipo] = useState<CronogramaTipo>("extensive");
  const [cronograma, setCronograma] = useState<CronogramaData | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({});
  const [activeSchedule, setActiveSchedule] = useState<string>("extensive");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCronograma();
  }, [tipo]);

  const loadCronograma = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cronogramaAnualApi.getCronograma(tipo);
      setCronograma(data.cronograma);
      setCompletedTopics(data.completedTopics || {});
      setActiveSchedule(data.activeSchedule || "extensive");
    } catch (err: any) {
      console.error("Erro ao carregar cronograma:", err);
      setError("Erro ao carregar estatísticas. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const stats: StatsData = useMemo(() => {
    if (!cronograma) {
      return {
        total: { total: 0, completed: 0, percentage: 0 },
        areas: {},
        cycles: []
      };
    }

    const areas: Record<string, Stats> = {};
    Object.keys(SUBJECT_GROUPS).forEach(area => {
      areas[area] = { total: 0, completed: 0, percentage: 0 };
    });

    let totalTopics = 0;
    let totalCompleted = 0;

    const cycles = cronograma.cycles.map(cycle => {
      let cycleTotal = 0;
      let cycleCompleted = 0;

      cycle.subjects.forEach(subject => {
        const area = Object.keys(SUBJECT_GROUPS).find(a => 
          SUBJECT_GROUPS[a].includes(subject.name)
        );

        subject.topics.forEach((topic, idx) => {
          const topicId = `${tipo}-${cycle.cycle}-${subject.name}-${idx}`;
          const isCompleted = completedTopics[topicId];

          cycleTotal++;
          totalTopics++;

          if (area) {
            areas[area].total++;
          }

          if (isCompleted) {
            cycleCompleted++;
            totalCompleted++;
            if (area) {
              areas[area].completed++;
            }
          }
        });
      });

      return {
        cycle: cycle.cycle,
        total: cycleTotal,
        completed: cycleCompleted,
        percentage: cycleTotal > 0 ? Math.round((cycleCompleted / cycleTotal) * 100) : 0
      };
    });

    Object.keys(areas).forEach(area => {
      if (areas[area].total > 0) {
        areas[area].percentage = Math.round((areas[area].completed / areas[area].total) * 100);
      }
    });

    return {
      total: {
        total: totalTopics,
        completed: totalCompleted,
        percentage: totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0
      },
      areas,
      cycles
    };
  }, [cronograma, completedTopics, tipo]);

  if (loading) {
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

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 animate-slide-up">
        <p className="text-red-800 font-semibold">{error}</p>
        <button
          onClick={loadCronograma}
          className="mt-3 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Elementos decorativos */}

      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-500/10 p-8 border-2 border-white/20 dark:border-white/10 backdrop-blur-none shadow-sm animate-slide-up">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-none animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-teal-500/20 to-transparent rounded-full blur-none animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-none opacity-50 animate-pulse-slow" />
              <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-500 p-4 rounded-lg shadow-sm">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent animate-gradient">
                Estatísticas
              </h1>
            </div>
          </div>
          <p className="text-lg text-muted-foreground font-medium">
            Visualize seu progresso por área de conhecimento 📊
          </p>
        </div>
      </div>

      {/* Toggle Extensivo/Intensivo Premium */}
      <div className="grid md:grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <button
          onClick={() => setTipo("extensive")}
          className={`relative overflow-hidden p-6 rounded-lg border-2 font-bold text-lg transition-all hover:shadow-sm hover:-translate-y-1 ${
            tipo === "extensive"
              ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/30"
              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-emerald-300"
          }`}
        >
          <div className="relative flex items-center justify-center gap-3">
            <Target className="w-6 h-6" />
            <span>Cronograma Extensivo</span>
          </div>
        </button>
        <button
          onClick={() => setTipo("intensive")}
          className={`relative overflow-hidden p-6 rounded-lg border-2 font-bold text-lg transition-all hover:shadow-sm hover:-translate-y-1 ${
            tipo === "intensive"
              ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/30"
              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-emerald-300"
          }`}
        >
          <div className="relative flex items-center justify-center gap-3">
            <Zap className="w-6 h-6" />
            <span>Cronograma Intensivo</span>
          </div>
        </button>
      </div>

      {/* Card de Progresso Total Premium */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-500 p-10 shadow-sm shadow-emerald-500/30 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-semibold text-white">Progresso Total</h3>
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Award className="w-12 h-12 text-white" />
            </div>
          </div>
          <div className="text-7xl font-semibold mb-4 text-white drop-shadow-sm">{stats.total.percentage}%</div>
          <p className="text-emerald-100 text-xl font-semibold mb-8">
            {stats.total.completed} de {stats.total.total} tópicos concluídos
          </p>
          <div className="w-full bg-white/20 rounded-full h-5 backdrop-blur-sm">
            <div
              className="bg-white h-5 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${stats.total.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Estatísticas por Área Premium */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-8 border-2 border-gray-100 dark:border-gray-800 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow">
            <PieChart className="w-6 h-6 text-white" />
          </div>
          Progresso por Área de Conhecimento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(stats.areas)
            .filter(([_, data]) => data.total > 0)
            .sort((a, b) => b[1].percentage - a[1].percentage)
            .map(([area, data], index) => (
              <div 
                key={area} 
                className="relative overflow-hidden border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-sm hover:-translate-y-1 transition-all group"
                style={{ animationDelay: `${0.4 + index * 0.05}s` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-none group-hover:scale-150 transition-transform" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-lg">{area}</h4>
                    <span className="text-3xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {data.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-3 overflow-hidden">
                    <div
                      className={`${AREA_COLORS[area]} h-4 rounded-full transition-all duration-500 shadow`}
                      style={{ width: `${data.percentage}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                    {data.completed} / {data.total} tópicos
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Estatísticas por Ciclo Premium */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-8 border-2 border-gray-100 dark:border-gray-800 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          Progresso por Ciclo
        </h3>
        <div className="space-y-4">
          {stats.cycles.map((cycle, index) => (
            <div 
              key={cycle.cycle} 
              className="relative overflow-hidden border-2 border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-sm hover:-translate-y-0.5 transition-all group"
              style={{ animationDelay: `${0.5 + index * 0.05}s` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-full blur-none group-hover:scale-150 transition-transform" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-lg">Ciclo {cycle.cycle}</span>
                  <span className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {cycle.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3.5 mb-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3.5 rounded-full transition-all duration-500 shadow"
                    style={{ width: `${cycle.percentage}%` }}
                  />
                </div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                  {cycle.completed} / {cycle.total} tópicos
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

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

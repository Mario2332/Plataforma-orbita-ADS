import React, { useState, useEffect, useMemo } from "react";
import { cronogramaAnualApi } from "../../../lib/api-cronograma-anual";
import { Loader2, TrendingUp, Award, Target } from "lucide-react";

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

// Agrupamento de matérias por área de conhecimento
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

// Cores para cada área
const AREA_COLORS: Record<string, string> = {
  'Matemática': 'bg-blue-500',
  'Física': 'bg-purple-500',
  'Química': 'bg-green-500',
  'Biologia': 'bg-emerald-500',
  'História': 'bg-amber-500',
  'Geografia': 'bg-cyan-500',
  'Filosofia': 'bg-indigo-500',
  'Sociologia': 'bg-pink-500',
  'Linguagens': 'bg-orange-500'
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

    // Inicializar estatísticas por área
    const areas: Record<string, Stats> = {};
    Object.keys(SUBJECT_GROUPS).forEach(area => {
      areas[area] = { total: 0, completed: 0, percentage: 0 };
    });

    let totalTopics = 0;
    let totalCompleted = 0;

    // Estatísticas por ciclo
    const cycles = cronograma.cycles.map(cycle => {
      let cycleTotal = 0;
      let cycleCompleted = 0;

      cycle.subjects.forEach(subject => {
        // Encontrar área da matéria
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

    // Calcular porcentagens das áreas
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={loadCronograma}
          className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Estatísticas do Cronograma</h2>
            <p className="text-sm text-gray-600 mt-1">
              Visualize seu progresso por área de conhecimento
            </p>
          </div>
        </div>

        {/* Toggle Extensivo/Intensivo */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setTipo("extensive")}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tipo === "extensive"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Cronograma Extensivo
          </button>
          <button
            onClick={() => setTipo("intensive")}
            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tipo === "intensive"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Cronograma Intensivo
          </button>
        </div>
      </div>

      {/* Card de Progresso Total */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Progresso Total</h3>
          <Award className="w-10 h-10 opacity-80" />
        </div>
        <div className="text-5xl font-bold mb-2">{stats.total.percentage}%</div>
        <p className="text-indigo-100 text-lg">
          {stats.total.completed} de {stats.total.total} tópicos concluídos
        </p>
        <div className="mt-6 w-full bg-white/20 rounded-full h-4">
          <div
            className="bg-white h-4 rounded-full transition-all duration-500"
            style={{ width: `${stats.total.percentage}%` }}
          />
        </div>
      </div>

      {/* Estatísticas por Área */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-600" />
          Progresso por Área de Conhecimento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(stats.areas)
            .filter(([_, data]) => data.total > 0)
            .sort((a, b) => b[1].percentage - a[1].percentage)
            .map(([area, data]) => (
              <div key={area} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{area}</h4>
                  <span className="text-2xl font-bold text-indigo-600">{data.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`${AREA_COLORS[area]} h-3 rounded-full transition-all duration-500`}
                    style={{ width: `${data.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {data.completed} / {data.total} tópicos
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Estatísticas por Ciclo */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Progresso por Ciclo
        </h3>
        <div className="space-y-3">
          {stats.cycles.map((cycle) => (
            <div key={cycle.cycle} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-900">Ciclo {cycle.cycle}</span>
                <span className="text-lg font-bold text-indigo-600">{cycle.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${cycle.percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                {cycle.completed} / {cycle.total} tópicos
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

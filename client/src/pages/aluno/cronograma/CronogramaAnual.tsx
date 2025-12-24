import React, { useState, useEffect, useMemo } from "react";
import { cronogramaAnualApi } from "../../../lib/api-cronograma-anual";
import { 
  Loader2, 
  CheckCircle2, 
  Circle, 
  Printer, 
  ChevronDown, 
  ChevronRight,
  Search,
  ChevronsDown,
  ChevronsUp,
  Calendar,
  Target,
  Zap,
  Sparkles
} from "lucide-react";

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

export default function CronogramaAnual() {
  const [tipo, setTipo] = useState<CronogramaTipo>("extensive");
  const [cronograma, setCronograma] = useState<CronogramaData | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({});
  const [activeSchedule, setActiveSchedule] = useState<string>("extensive");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedCycles, setExpandedCycles] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCronograma();
  }, [tipo]);

  const loadCronograma = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cronogramaAnualApi.getCronograma(tipo);
      setCronograma(data.cronograma);
      // Sempre usar os dados mais recentes do servidor
      setCompletedTopics(data.completedTopics || {});
      setActiveSchedule(data.activeSchedule || "extensive");
      
      setExpandedCycles(new Set());
      setSearchTerm("");
    } catch (err: any) {
      console.error("Erro ao carregar cronograma:", err);
      setError("Erro ao carregar cronograma. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTopico = async (topicoId: string) => {
    const newCompleted = !completedTopics[topicoId];
    
    setCompletedTopics(prev => ({
      ...prev,
      [topicoId]: newCompleted
    }));

    try {
      await cronogramaAnualApi.toggleTopico(topicoId, newCompleted);
    } catch (err) {
      console.error("Erro ao atualizar tópico:", err);
      setCompletedTopics(prev => ({
        ...prev,
        [topicoId]: !newCompleted
      }));
    }
  };

  const handleSetActiveSchedule = async (newTipo: CronogramaTipo) => {
    try {
      await cronogramaAnualApi.setActiveSchedule(newTipo);
      setActiveSchedule(newTipo);
    } catch (err) {
      console.error("Erro ao definir cronograma ativo:", err);
    }
  };

  const toggleCycle = (cycleNumber: number) => {
    setExpandedCycles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cycleNumber)) {
        newSet.delete(cycleNumber);
      } else {
        newSet.add(cycleNumber);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    if (!cronograma) return;
    const allCycles = new Set(cronograma.cycles.map(c => c.cycle));
    setExpandedCycles(allCycles);
  };

  const collapseAll = () => {
    setExpandedCycles(new Set());
  };

  const filteredCycles = useMemo(() => {
    if (!cronograma) return [];
    if (!searchTerm.trim()) return cronograma.cycles;

    const search = searchTerm.toLowerCase();
    
    return cronograma.cycles.map(cycle => {
      const filteredSubjects = cycle.subjects
        .map(subject => ({
          ...subject,
          topics: subject.topics.filter(topic => 
            topic.toLowerCase().includes(search)
          )
        }))
        .filter(subject => subject.topics.length > 0);

      return {
        ...cycle,
        subjects: filteredSubjects,
        hasMatch: filteredSubjects.length > 0
      };
    }).filter(cycle => cycle.hasMatch);
  }, [cronograma, searchTerm]);

  useEffect(() => {
    if (searchTerm.trim() && filteredCycles.length > 0) {
      const cyclesWithMatches = new Set(filteredCycles.map(c => c.cycle));
      setExpandedCycles(cyclesWithMatches);
    }
  }, [searchTerm, filteredCycles]);

  const calculateProgress = () => {
    if (!cronograma) return { completed: 0, total: 0, percentage: 0 };
    
    let total = 0;
    let completed = 0;

    cronograma.cycles.forEach(cycle => {
      cycle.subjects.forEach(subject => {
        subject.topics.forEach((topic, idx) => {
          const topicId = `${tipo}-${cycle.cycle}-${subject.name}-${idx}`;
          total++;
          if (completedTopics[topicId]) completed++;
        });
      });
    });

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const handlePrint = () => {
    window.print();
  };

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

  const progress = calculateProgress();
  const cyclesToDisplay = searchTerm.trim() ? filteredCycles : cronograma?.cycles || [];

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Elementos decorativos */}

      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-emerald-500/10 p-8 border-2 border-white/20 dark:border-white/10 backdrop-blur-none shadow-sm animate-slide-up">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-none animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-teal-500/20 to-transparent rounded-full blur-none animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        <div className="relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg blur-none opacity-50 animate-pulse-slow" />
                  <div className="relative bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-500 p-4 rounded-lg shadow-sm">
                    <Calendar className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent animate-gradient">
                    Cronograma Anual
                  </h1>
                </div>
              </div>
            </div>
            
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-3 text-sm font-bold border-2 border-emerald-500/30 rounded-xl hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 hover:shadow transition-all hover:-translate-y-0.5"
            >
              <Printer className="w-5 h-5" />
              Imprimir
            </button>
          </div>
          <p className="text-lg text-muted-foreground font-medium">
            Acompanhe seu progresso ao longo do ano 📚
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

      {/* Seletor de cronograma ativo Premium */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6 border-2 border-emerald-200/50 dark:border-emerald-800/50 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="relative">
          <p className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Qual cronograma você está seguindo ativamente?
          </p>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="activeSchedule"
                value="extensive"
                checked={activeSchedule === "extensive"}
                onChange={() => handleSetActiveSchedule("extensive")}
                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
              />
              <span className="ml-3 font-semibold group-hover:text-emerald-600 transition-colors">Extensivo</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="radio"
                name="activeSchedule"
                value="intensive"
                checked={activeSchedule === "intensive"}
                onChange={() => handleSetActiveSchedule("intensive")}
                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 focus:ring-2 cursor-pointer"
              />
              <span className="ml-3 font-semibold group-hover:text-emerald-600 transition-colors">Intensivo</span>
            </label>
          </div>
        </div>
      </div>

      {/* Barra de progresso Premium */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-500 p-8 shadow-sm shadow-emerald-500/30 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xl font-semibold text-white">Progresso Geral</span>
            <span className="text-3xl font-semibold text-white">
              {progress.percentage}%
            </span>
          </div>
          <p className="text-emerald-100 text-lg font-semibold mb-6">
            {progress.completed} / {progress.total} tópicos concluídos
          </p>
          <div className="w-full bg-white/20 rounded-full h-4 backdrop-blur-sm">
            <div
              className="bg-white h-4 rounded-full transition-all duration-500 shadow"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Barra de busca e controles Premium */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 border-2 border-gray-100 dark:border-gray-800 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-emerald-500" />
            <input
              type="text"
              placeholder="Buscar tópico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={expandAll}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold border-2 border-emerald-500/30 rounded-xl hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 hover:shadow transition-all hover:-translate-y-0.5"
            >
              <ChevronsDown className="w-4 h-4" />
              Expandir
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-2 px-5 py-3 text-sm font-bold border-2 border-emerald-500/30 rounded-xl hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-teal-500/10 hover:shadow transition-all hover:-translate-y-0.5"
            >
              <ChevronsUp className="w-4 h-4" />
              Retrair
            </button>
          </div>
        </div>
        
        {searchTerm.trim() && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border-2 border-emerald-200/50 dark:border-emerald-800/50">
            {cyclesToDisplay.length > 0 ? (
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                ✨ Encontrados {cyclesToDisplay.length} ciclo(s) com tópicos correspondentes
              </span>
            ) : (
              <span className="text-sm font-semibold text-amber-600">
                🔍 Nenhum tópico encontrado para "{searchTerm}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Lista de ciclos Premium */}
      <div className="space-y-4">
        {cyclesToDisplay.map((cycle, index) => {
          const isExpanded = expandedCycles.has(cycle.cycle);
          
          return (
            <div 
              key={cycle.cycle} 
              className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border-2 border-gray-100 dark:border-gray-800 hover:shadow-sm transition-all animate-slide-up"
              style={{ animationDelay: `${0.5 + index * 0.05}s` }}
            >
              <button
                onClick={() => toggleCycle(cycle.cycle)}
                className="w-full bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 px-6 py-5 border-b-2 border-emerald-100 dark:border-emerald-900 flex items-center justify-between hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 transition-all group"
              >
                <h3 className="text-xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Ciclo {cycle.cycle}
                </h3>
                <div className="p-2 bg-emerald-500 rounded-xl group-hover:scale-[1.01] transition-transform">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>
              
              {isExpanded && (
                <div className="p-6 space-y-6">
                  {cycle.subjects.map((subject, subjectIdx) => (
                    <div key={subjectIdx}>
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full" />
                        {subject.name}
                      </h4>
                      <ul className="space-y-3">
                        {subject.topics.map((topic, topicIdx) => {
                          const topicId = `${tipo}-${cycle.cycle}-${subject.name}-${topicIdx}`;
                          const isCompleted = completedTopics[topicId];
                          
                          const highlightedTopic = searchTerm.trim() 
                            ? topic.replace(
                                new RegExp(`(${searchTerm})`, 'gi'),
                                '<mark class="bg-yellow-200 dark:bg-yellow-900/50 px-1 rounded">$1</mark>'
                              )
                            : topic;
                          
                          return (
                            <li
                              key={topicIdx}
                              className="flex items-start gap-3 group p-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
                            >
                              <button
                                onClick={() => handleToggleTopico(topicId)}
                                className="flex-shrink-0 mt-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-full transition-transform hover:scale-[1.01]"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-600 drop-shadow" />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                                )}
                              </button>
                              <span
                                className={`text-sm flex-1 font-medium ${
                                  isCompleted
                                    ? "line-through text-gray-500"
                                    : "text-gray-700 dark:text-gray-300"
                                }`}
                                dangerouslySetInnerHTML={{ __html: highlightedTopic }}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cyclesToDisplay.length === 0 && !searchTerm.trim() && (
        <div className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full flex items-center justify-center">
            <Calendar className="w-12 h-12 text-emerald-500" />
          </div>
          <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Nenhum ciclo disponível</p>
        </div>
      )}

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

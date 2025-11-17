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
  ChevronsUp
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
  
  // Estados para ciclos retráteis
  const [expandedCycles, setExpandedCycles] = useState<Set<number>>(new Set());
  
  // Estado para busca
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
      setCompletedTopics(data.completedTopics || {});
      setActiveSchedule(data.activeSchedule || "extensive");
      
      // Resetar ciclos expandidos ao trocar de cronograma
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
    
    // Atualizar localmente primeiro (otimistic update)
    setCompletedTopics(prev => ({
      ...prev,
      [topicoId]: newCompleted
    }));

    try {
      await cronogramaAnualApi.toggleTopico(topicoId, newCompleted);
    } catch (err) {
      console.error("Erro ao atualizar tópico:", err);
      // Reverter em caso de erro
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

  // Filtrar ciclos com base na busca
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

  // Expandir automaticamente ciclos com resultados de busca
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

  const progress = calculateProgress();
  const cyclesToDisplay = searchTerm.trim() ? filteredCycles : cronograma?.cycles || [];

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Cronograma Anual</h2>
            <p className="text-sm text-gray-600 mt-1">
              Acompanhe seu progresso ao longo do ano
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
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

        {/* Seletor de cronograma ativo */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">
            Qual cronograma você está seguindo ativamente?
          </p>
          <div className="flex gap-6">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="activeSchedule"
                value="extensive"
                checked={activeSchedule === "extensive"}
                onChange={() => handleSetActiveSchedule("extensive")}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-gray-700">Extensivo</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="activeSchedule"
                value="intensive"
                checked={activeSchedule === "intensive"}
                onChange={() => handleSetActiveSchedule("intensive")}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-gray-700">Intensivo</span>
            </label>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
            <span className="text-sm font-semibold text-indigo-600">
              {progress.completed} / {progress.total} tópicos ({progress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Barra de busca e controles */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Campo de busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tópico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Botões expandir/retrair */}
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ChevronsDown className="w-4 h-4" />
              Expandir Todos
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ChevronsUp className="w-4 h-4" />
              Retrair Todos
            </button>
          </div>
        </div>

        {/* Indicador de resultados de busca */}
        {searchTerm.trim() && (
          <div className="mt-3 text-sm text-gray-600">
            {cyclesToDisplay.length > 0 ? (
              <span>
                Encontrados {cyclesToDisplay.length} ciclo(s) com tópicos correspondentes
              </span>
            ) : (
              <span className="text-amber-600">
                Nenhum tópico encontrado para "{searchTerm}"
              </span>
            )}
          </div>
        )}
      </div>

      {/* Lista de ciclos */}
      <div className="space-y-4">
        {cyclesToDisplay.map((cycle) => {
          const isExpanded = expandedCycles.has(cycle.cycle);
          
          return (
            <div key={cycle.cycle} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Header do ciclo - clicável */}
              <button
                onClick={() => toggleCycle(cycle.cycle)}
                className="w-full bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between hover:bg-indigo-100 transition-colors"
              >
                <h3 className="text-lg font-bold text-indigo-900">
                  Ciclo {cycle.cycle}
                </h3>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-indigo-700" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-indigo-700" />
                )}
              </button>

              {/* Conteúdo do ciclo - retrátil */}
              {isExpanded && (
                <div className="p-6 space-y-6">
                  {cycle.subjects.map((subject, subjectIdx) => (
                    <div key={subjectIdx}>
                      <h4 className="text-md font-semibold text-gray-900 mb-3">
                        {subject.name}
                      </h4>
                      <ul className="space-y-2">
                        {subject.topics.map((topic, topicIdx) => {
                          const topicId = `${tipo}-${cycle.cycle}-${subject.name}-${topicIdx}`;
                          const isCompleted = completedTopics[topicId];
                          
                          // Destacar termo de busca
                          const highlightedTopic = searchTerm.trim() 
                            ? topic.replace(
                                new RegExp(`(${searchTerm})`, 'gi'),
                                '<mark class="bg-yellow-200">$1</mark>'
                              )
                            : topic;

                          return (
                            <li
                              key={topicIdx}
                              className="flex items-start gap-3 group"
                            >
                              <button
                                onClick={() => handleToggleTopico(topicId)}
                                className="flex-shrink-0 mt-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                                )}
                              </button>
                              <span
                                className={`text-sm flex-1 ${
                                  isCompleted
                                    ? "line-through text-gray-500"
                                    : "text-gray-700"
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

      {/* Mensagem quando não há ciclos */}
      {cyclesToDisplay.length === 0 && !searchTerm.trim() && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Nenhum ciclo disponível</p>
        </div>
      )}
    </div>
  );
}

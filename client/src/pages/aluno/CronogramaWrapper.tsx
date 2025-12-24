import React, { useState } from "react";
import { Calendar, Zap, BarChart2, CalendarDays, RefreshCw } from "lucide-react";
import AlunoCronograma from "./AlunoCronograma";
import CronogramaAnual from "./cronograma/CronogramaAnual";
import CronogramaEstatisticas from "./cronograma/CronogramaEstatisticas";
import CronogramaDinamico from "./CronogramaDinamico";

export default function CronogramaWrapper() {
  const [activeTab, setActiveTab] = useState<"semanal" | "anual-ciclos" | "anual-dinamico">("semanal");
  const [anualSubTab, setAnualSubTab] = useState<"ciclos" | "estatisticas">("ciclos");

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      {/* Elementos decorativos */}

      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500/20 via-teal-500/10 to-emerald-500/10 p-4 border-2 border-white/20 dark:border-white/10 backdrop-blur-none shadow-sm animate-slide-up">
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-lg bg-emerald-500 shadow shadow-indigo-500/25">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-teal-600 to-emerald-600 ">
                Cronograma de Estudos
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Organize sua rotina e maximize seu aprendizado
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de navegação principal */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1.5">
        <nav className="flex flex-wrap gap-1" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("semanal")}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${
                activeTab === "semanal"
                  ? "bg-gradient-to-r from-indigo-500 to-teal-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }
            `}
          >
            <Calendar className="w-4 h-4" />
            Semanal
          </button>
          <button
            onClick={() => setActiveTab("anual-ciclos")}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${
                activeTab === "anual-ciclos"
                  ? "bg-gradient-to-r from-indigo-500 to-teal-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }
            `}
          >
            <RefreshCw className="w-4 h-4" />
            Anual - Ciclos
          </button>
          <button
            onClick={() => setActiveTab("anual-dinamico")}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
              ${
                activeTab === "anual-dinamico"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100"
              }
            `}
          >
            <Zap className="w-4 h-4" />
            Anual - Dinâmico
          </button>
        </nav>
      </div>

      {/* Sub-tabs para Anual - Ciclos */}
      {activeTab === "anual-ciclos" && (
        <div className="bg-gray-50 rounded-lg p-1 inline-flex gap-1">
          <button
            onClick={() => setAnualSubTab("ciclos")}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all
              ${
                anualSubTab === "ciclos"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <CalendarDays className="w-4 h-4" />
            Ciclos
          </button>
          <button
            onClick={() => setAnualSubTab("estatisticas")}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md font-medium text-sm transition-all
              ${
                anualSubTab === "estatisticas"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }
            `}
          >
            <BarChart2 className="w-4 h-4" />
            Estatísticas
          </button>
        </div>
      )}

      {/* Conteúdo das tabs */}
      <div>
        {activeTab === "semanal" && <AlunoCronograma />}
        {activeTab === "anual-ciclos" && (
          <>
            {anualSubTab === "ciclos" && <CronogramaAnual />}
            {anualSubTab === "estatisticas" && <CronogramaEstatisticas />}
          </>
        )}
        {activeTab === "anual-dinamico" && <CronogramaDinamico />}
      </div>
    </div>
  );
}

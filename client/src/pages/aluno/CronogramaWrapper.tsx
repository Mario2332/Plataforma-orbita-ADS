import React, { useState } from "react";
import AlunoCronograma from "./AlunoCronograma";
import CronogramaAnual from "./cronograma/CronogramaAnual";
import CronogramaEstatisticas from "./cronograma/CronogramaEstatisticas";

export default function CronogramaWrapper() {
  const [activeTab, setActiveTab] = useState<"semanal" | "anual" | "estatisticas">("semanal");

  return (
    <div className="space-y-6">
      {/* Tabs de navegação */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("semanal")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "semanal"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Semanal
          </button>
          <button
            onClick={() => setActiveTab("anual")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "anual"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Anual
          </button>
          <button
            onClick={() => setActiveTab("estatisticas")}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === "estatisticas"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            Estatísticas
          </button>
        </nav>
      </div>

      {/* Conteúdo das tabs */}
      <div>
        {activeTab === "semanal" && <AlunoCronograma />}
        {activeTab === "anual" && <CronogramaAnual />}
        {activeTab === "estatisticas" && <CronogramaEstatisticas />}
      </div>
    </div>
  );
}

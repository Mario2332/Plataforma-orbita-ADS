import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Zap } from "lucide-react";
import AlunoCronograma from "./AlunoCronograma";
import CronogramaDinamico from "./CronogramaDinamico";

export default function AlunoCronogramaPage() {
  const [activeTab, setActiveTab] = useState("semanal");

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

      {/* Tabs para alternar entre Semanal e Anual Dinâmico */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="semanal" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Semanal
          </TabsTrigger>
          <TabsTrigger value="anual-dinamico" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Anual - Dinâmico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="semanal" className="mt-0">
          <AlunoCronograma />
        </TabsContent>

        <TabsContent value="anual-dinamico" className="mt-0">
          <CronogramaDinamico />
        </TabsContent>
      </Tabs>
    </div>
  );
}

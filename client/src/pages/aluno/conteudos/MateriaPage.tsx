import { useState, useEffect, useMemo } from "react";
import { alunoApi } from "@/lib/api";
import { mentorConteudosApi } from "@/lib/api-mentor-conteudos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Loader2, FileText, Zap, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Topic {
  id: string;
  name: string;
  incidenceValue: number;
  incidenceLevel: string;
}

interface MateriaPageProps {
  materiaKey: string;
}

export default function MateriaPage({ materiaKey }: MateriaPageProps) {
  const [materia, setMateria] = useState<any>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progressoMap, setProgressoMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const loadConteudos = async () => {
    try {
      const data = await mentorConteudosApi.getConteudos(materiaKey) as any;
      setMateria(data);
      setTopics(data.topics || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar conteúdos");
    }
  };

  const loadProgresso = async () => {
    try {
      const data = await alunoApi.getProgresso(materiaKey);
      setProgressoMap(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar progresso");
    }
  };

  const loadAll = async () => {
    setIsLoading(true);
    await Promise.all([loadConteudos(), loadProgresso()]);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [materiaKey]);

  const [sortColumn, setSortColumn] = useState<"name" | "incidence">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterIncidence, setFilterIncidence] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");

  const handleSort = (column: "name" | "incidence") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
  };

  const filteredAndSortedTopics = useMemo(() => {
    let filtered = [...topics];

    if (filterIncidence !== "todos") {
      filtered = filtered.filter(topic => topic.incidenceLevel === filterIncidence);
    }

    if (filterStatus === "estudados") {
      filtered = filtered.filter(topic => progressoMap?.[topic.id]?.estudado);
    } else if (filterStatus === "nao-estudados") {
      filtered = filtered.filter(topic => !progressoMap?.[topic.id]?.estudado);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === "incidence") {
        comparison = a.incidenceValue - b.incidenceValue;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return filtered;
  }, [topics, sortColumn, sortDirection, filterIncidence, filterStatus, progressoMap]);

  const getIncidenceBadgeColor = (level: string) => {
    switch (level) {
      case "Muito alta!": return "bg-gradient-to-r from-emerald-600 to-indigo-600 text-white hover:from-emerald-700 hover:to-indigo-700 shadow";
      case "Alta!": return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow";
      case "Média": return "bg-teal-500 text-white hover:bg-teal-600 shadow-md";
      case "Baixa": return "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md";
      case "Muito baixa": return "bg-gray-400 text-white hover:bg-gray-500";
      default: return "bg-gray-300 text-black hover:bg-gray-400";
    }
  };

  const handleUpdateProgresso = async (topicoId: string, data: any) => {
    try {
      await alunoApi.updateProgresso({ topicoId, ...data });
      await loadProgresso();
      toast.success("Progresso atualizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar progresso");
    }
  };

  const handleSaveNotes = async (topicoId: string) => {
    const anotacoes = editingNotes[topicoId] || "";
    await handleUpdateProgresso(topicoId, { anotacoes });
    setOpenDialog(null);
  };

  const handleOpenDialog = (topicoId: string) => {
    const currentNotes = progressoMap?.[topicoId]?.anotacoes || "";
    setEditingNotes({ ...editingNotes, [topicoId]: currentNotes });
    setOpenDialog(topicoId);
  };

  const topicosEstudados = topics.filter(t => progressoMap?.[t.id]?.estudado).length;
  const percentualEstudado = topics.length > 0 ? ((topicosEstudados / topics.length) * 100).toFixed(1) : "0";

  if (isLoading) {
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

  return (
    <div className="container mx-auto py-6 space-y-6 pb-8 animate-fade-in">

      <Card className="border-2 hover:shadow-sm transition-shadow rounded-lg animate-slide-up">
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {materia?.displayName}
              </CardTitle>
              <p className="text-muted-foreground font-semibold mt-2">
                {topics.length} tópicos • {filteredAndSortedTopics.length} exibidos • Marque como estudado e adicione anotações
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border-2 border-emerald-200/50">
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-1">Total de Tópicos</div>
              <div className="text-3xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {topics.length}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border-2 border-emerald-200/50">
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-1">Estudados</div>
              <div className="text-3xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {topicosEstudados}
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border-2 border-emerald-200/50">
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-300 mb-1">Progresso</div>
              <div className="text-3xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {percentualEstudado}%
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                  style={{ width: `${percentualEstudado}%` }}
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-xl border-2 border-emerald-200/50">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg shadow-md">
                <Filter className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold">Filtros:</span>
            </div>
            
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Select value={filterIncidence} onValueChange={setFilterIncidence}>
                  <SelectTrigger className="w-full border-2 font-semibold">
                    <SelectValue placeholder="Incidência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as incidências</SelectItem>
                    <SelectItem value="Muito alta!">Muito Alta!</SelectItem>
                    <SelectItem value="Alta!">Alta!</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Muito baixa">Muito Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full border-2 font-semibold">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os tópicos</SelectItem>
                    <SelectItem value="estudados">Apenas estudados</SelectItem>
                    <SelectItem value="nao-estudados">Não estudados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(filterIncidence !== "todos" || filterStatus !== "todos") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterIncidence("todos");
                    setFilterStatus("todos");
                  }}
                  className="whitespace-nowrap border-2 font-bold hover:bg-emerald-100"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border-2 border-emerald-200/50">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                  <th className="text-left p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:bg-emerald-100 font-semibold"
                    >
                      Conteúdo
                      {getSortIcon("name")}
                    </Button>
                  </th>
                  <th className="text-center p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("incidence")}
                      className="flex items-center gap-1 mx-auto hover:bg-emerald-100 font-semibold"
                    >
                      Incidência
                      {getSortIcon("incidence")}
                    </Button>
                  </th>
                  <th className="text-center p-4 font-semibold w-24">Estudado</th>
                  <th className="text-center p-4 font-semibold w-32">Anotações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTopics.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-emerald-500" />
                      </div>
                      <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                        Nenhum tópico encontrado com os filtros selecionados.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedTopics.map((topic) => {
                    const progresso = progressoMap?.[topic.id];
                    const hasNotes = progresso?.anotacoes && progresso.anotacoes.trim().length > 0;

                    return (
                      <tr key={topic.id} className="border-b hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all">
                        <td className="p-4 font-semibold">{topic.name}</td>
                        <td className="p-4 text-center">
                          <Badge className={`${getIncidenceBadgeColor(topic.incidenceLevel)} font-bold px-3 py-1`}>
                            {topic.incidenceLevel}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={progresso?.estudado || false}
                              onCheckedChange={(checked) =>
                                handleUpdateProgresso(topic.id, { estudado: checked as boolean })
                              }
                              className="w-5 h-5 border-2"
                            />
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <Dialog open={openDialog === topic.id} onOpenChange={(open) => !open && setOpenDialog(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant={hasNotes ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleOpenDialog(topic.id)}
                                className={hasNotes ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold shadow" : "border-2 font-bold hover:bg-emerald-100"}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                {hasNotes ? "Ver" : "Adicionar"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl border-2 rounded-lg">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                  Anotações - {topic.name}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  value={editingNotes[topic.id] || ""}
                                  onChange={(e) => setEditingNotes({ ...editingNotes, [topic.id]: e.target.value })}
                                  placeholder="Digite suas anotações sobre este tópico..."
                                  className="min-h-[200px] border-2 font-semibold"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setOpenDialog(null)} className="border-2 font-bold">
                                    Cancelar
                                  </Button>
                                  <Button onClick={() => handleSaveNotes(topic.id)} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-bold">
                                    Salvar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes float-delayed { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-30px); } }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.8s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
      `}</style>
    </div>
  );
}

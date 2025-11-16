import { useState, useMemo, useEffect } from "react";
import { alunoApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUpDown, ArrowUp, ArrowDown, Filter, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import studyData from "@shared/study-content-data.json";

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
  const materia = (studyData as any)[materiaKey];
  const topics: Topic[] = materia?.topics || [];

  const [progressoMap, setProgressoMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<{ [key: string]: string }>({});
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const loadProgresso = async () => {
    try {
      setIsLoading(true);
      const data = await alunoApi.getProgresso(materiaKey);
      setProgressoMap(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar progresso");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProgresso();
  }, [materiaKey]);

  // Estados de ordenação
  const [sortColumn, setSortColumn] = useState<"name" | "incidence">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Estados de filtro
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
      case "Muito alta!": return "bg-red-500 text-white hover:bg-red-600";
      case "Alta!": return "bg-orange-500 text-white hover:bg-orange-600";
      case "Média": return "bg-yellow-500 text-black hover:bg-yellow-600";
      case "Baixa": return "bg-blue-500 text-white hover:bg-blue-600";
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{materia?.displayName}</CardTitle>
          <p className="text-muted-foreground">
            {topics.length} tópicos • {filteredAndSortedTopics.length} exibidos • Marque como estudado e adicione anotações
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seção de Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>
            
            <div className="flex-1 flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Select value={filterIncidence} onValueChange={setFilterIncidence}>
                  <SelectTrigger className="w-full">
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
                  <SelectTrigger className="w-full">
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
                  className="whitespace-nowrap"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          </div>

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-3 font-semibold">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 hover:bg-muted"
                    >
                      Conteúdo
                      {getSortIcon("name")}
                    </Button>
                  </th>
                  <th className="text-center p-3 font-semibold">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("incidence")}
                      className="flex items-center gap-1 mx-auto hover:bg-muted"
                    >
                      Incidência
                      {getSortIcon("incidence")}
                    </Button>
                  </th>
                  <th className="text-center p-3 font-semibold w-24">Estudado</th>
                  <th className="text-center p-3 font-semibold w-32">Anotações</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedTopics.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      Nenhum tópico encontrado com os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedTopics.map((topic) => {
                    const progresso = progressoMap?.[topic.id];
                    const hasNotes = progresso?.anotacoes && progresso.anotacoes.trim().length > 0;

                    return (
                      <tr key={topic.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3">{topic.name}</td>
                        <td className="p-3 text-center">
                          <Badge className={getIncidenceBadgeColor(topic.incidenceLevel)}>
                            {topic.incidenceLevel}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={progresso?.estudado || false}
                              onCheckedChange={(checked) =>
                                handleUpdateProgresso(topic.id, { estudado: checked as boolean })
                              }
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Dialog open={openDialog === topic.id} onOpenChange={(open) => !open && setOpenDialog(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant={hasNotes ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleOpenDialog(topic.id)}
                                className={hasNotes ? "bg-blue-500 hover:bg-blue-600" : ""}
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                {hasNotes ? "Ver" : "Adicionar"}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Anotações - {topic.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  value={editingNotes[topic.id] || ""}
                                  onChange={(e) => setEditingNotes({ ...editingNotes, [topic.id]: e.target.value })}
                                  placeholder="Digite suas anotações sobre este tópico..."
                                  className="min-h-[200px]"
                                />
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setOpenDialog(null)}>
                                    Cancelar
                                  </Button>
                                  <Button onClick={() => handleSaveNotes(topic.id)}>
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
    </div>
  );
}

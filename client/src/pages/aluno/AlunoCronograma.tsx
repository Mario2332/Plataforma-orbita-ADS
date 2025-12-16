import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Save, Copy, Palette, Download, Upload, Trash2, FolderOpen, Zap, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAlunoApi } from "@/hooks/useAlunoApi";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TimeSlot = {
  day: number;
  hour: number;
  minute: number;
  activity: string;
  color: string;
};

type Template = {
  id: string;
  name: string;
  schedule: TimeSlot[];
  createdAt: Date;
};

const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 30];

const COLORS = [
  { name: "Laranja", value: "#FFA500" },
  { name: "Azul", value: "#4A90E2" },
  { name: "Verde", value: "#50C878" },
  { name: "Rosa", value: "#FF69B4" },
  { name: "Roxo", value: "#9B59B6" },
  { name: "Amarelo", value: "#FFD700" },
  { name: "Vermelho", value: "#E74C3C" },
  { name: "Cinza", value: "#95A5A6" },
  { name: "Branco", value: "#FFFFFF" },
];

export default function AlunoCronograma() {
  const api = useAlunoApi();
  const [schedule, setSchedule] = useState<TimeSlot[]>([]);
  const [copiedCell, setCopiedCell] = useState<TimeSlot | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [draggedCell, setDraggedCell] = useState<{ day: number; hour: number; minute: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [templateName, setTemplateName] = useState("");

  useEffect(() => {
    loadSchedule();
    loadTemplates();
  }, []);

  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      const horarios = await api.getHorarios();
      console.log('Horários carregados do backend:', horarios);
      
      const slots: TimeSlot[] = [];
      horarios.forEach((h: any) => {
        const [horaInicio, minutoInicio] = h.horaInicio.split(':').map(Number);
        const [horaFim, minutoFim] = h.horaFim.split(':').map(Number);
        
        let currentHour = horaInicio;
        let currentMinute = minutoInicio;
        
        while (currentHour < horaFim || (currentHour === horaFim && currentMinute < minutoFim)) {
          slots.push({
            day: h.diaSemana,
            hour: currentHour,
            minute: currentMinute,
            activity: h.materia + (h.descricao ? ` - ${h.descricao}` : ''),
            color: h.cor || "#FFFFFF",
          });
          
          currentMinute += 30;
          if (currentMinute >= 60) {
            currentMinute = 0;
            currentHour++;
          }
        }
      });
      
      setSchedule(slots);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar cronograma");
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data.map((t: any) => {
        let createdAtDate: Date;
        if (t.createdAt?.toDate) {
          createdAtDate = t.createdAt.toDate();
        } else if (t.createdAt?.seconds || t.createdAt?._seconds) {
          const seconds = t.createdAt.seconds || t.createdAt._seconds;
          createdAtDate = new Date(seconds * 1000);
        } else if (t.createdAt) {
          createdAtDate = new Date(t.createdAt);
        } else {
          createdAtDate = new Date();
        }
        
        return {
          id: t.id,
          name: t.nome,
          schedule: t.horarios || [],
          createdAt: createdAtDate,
        };
      }));
    } catch (error: any) {
      console.error("Erro ao carregar templates:", error);
    }
  };

  const getCellKey = (day: number, hour: number, minute: number) => 
    `${day}-${hour}-${minute}`;

  const getSlot = (day: number, hour: number, minute: number): TimeSlot => {
    const existing = schedule.find(
      s => s.day === day && s.hour === hour && s.minute === minute
    );
    return existing || { day, hour, minute, activity: "", color: "#FFFFFF" };
  };

  const updateSlot = (day: number, hour: number, minute: number, updates: Partial<TimeSlot>) => {
    const existing = schedule.find(
      s => s.day === day && s.hour === hour && s.minute === minute
    );

    if (existing) {
      setSchedule(schedule.map(s => 
        s.day === day && s.hour === hour && s.minute === minute
          ? { ...s, ...updates }
          : s
      ));
    } else {
      setSchedule([...schedule, { day, hour, minute, activity: "", color: "#FFFFFF", ...updates }]);
    }
  };

  const handleCopy = (day: number, hour: number, minute: number) => {
    const slot = getSlot(day, hour, minute);
    setCopiedCell(slot);
    toast.success("Célula copiada!");
  };

  const handlePaste = (day: number, hour: number, minute: number) => {
    if (!copiedCell) {
      toast.error("Nenhuma célula copiada");
      return;
    }
    updateSlot(day, hour, minute, {
      activity: copiedCell.activity,
      color: copiedCell.color,
    });
    toast.success("Célula colada!");
  };

  const handleDragStart = (day: number, hour: number, minute: number) => {
    setDraggedCell({ day, hour, minute });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetDay: number, targetHour: number, targetMinute: number) => {
    if (!draggedCell) return;

    const sourceSlot = getSlot(draggedCell.day, draggedCell.hour, draggedCell.minute);
    const targetSlot = getSlot(targetDay, targetHour, targetMinute);

    updateSlot(targetDay, targetHour, targetMinute, {
      activity: sourceSlot.activity,
      color: sourceSlot.color,
    });

    updateSlot(draggedCell.day, draggedCell.hour, draggedCell.minute, {
      activity: targetSlot.activity,
      color: targetSlot.color,
    });

    setDraggedCell(null);
    toast.success("Atividade movida!");
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Digite um nome para o template");
      return;
    }

    try {
      setIsSaving(true);
      
      const horarios = schedule
        .filter(s => s.activity)
        .map(s => ({
          diaSemana: s.day,
          horaInicio: `${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}`,
          horaFim: `${String(s.hour).padStart(2, '0')}:${String(s.minute + 30).padStart(2, '0')}`,
          materia: s.activity.split(' - ')[0].trim(),
          descricao: s.activity.split(' - ').slice(1).join(' - ').trim() || undefined,
          cor: s.color,
        }));
      
      await api.saveTemplate({
        nome: templateName,
        horarios,
      });
      
      setTemplateName("");
      setShowSaveDialog(false);
      toast.success(`Template "${templateName}" salvo com sucesso!`);
      await loadTemplates();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadTemplate = async (template: Template) => {
    try {
      setIsSaving(true);
      await api.loadTemplate(template.id);
      setShowLoadDialog(false);
      toast.success(`Template "${template.name}" carregado!`);
      await loadSchedule();
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar template");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (confirm(`Deseja realmente excluir o template "${template?.name}"?`)) {
      try {
        await api.deleteTemplate(templateId);
        toast.success("Template excluído!");
        await loadTemplates();
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir template");
      }
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Primeiro, limpar todos os horários existentes
      await api.clearAllHorarios();
      
      const sortedSchedule = [...schedule]
        .filter(s => s.activity)
        .sort((a, b) => {
          if (a.day !== b.day) return a.day - b.day;
          if (a.hour !== b.hour) return a.hour - b.hour;
          return a.minute - b.minute;
        });
      
      const groupedSlots: Array<{ day: number; startHour: number; startMinute: number; endHour: number; endMinute: number; activity: string; color: string }> = [];
      
      sortedSchedule.forEach(slot => {
        const lastGroup = groupedSlots[groupedSlots.length - 1];
        
        if (
          lastGroup &&
          lastGroup.day === slot.day &&
          lastGroup.activity === slot.activity &&
          lastGroup.color === slot.color &&
          (
            (lastGroup.endHour === slot.hour && lastGroup.endMinute === slot.minute) ||
            (lastGroup.endHour === slot.hour - 1 && lastGroup.endMinute === 30 && slot.minute === 0)
          )
        ) {
          lastGroup.endHour = slot.hour;
          lastGroup.endMinute = slot.minute + 30;
          if (lastGroup.endMinute >= 60) {
            lastGroup.endMinute = 0;
            lastGroup.endHour++;
          }
        } else {
          groupedSlots.push({
            day: slot.day,
            startHour: slot.hour,
            startMinute: slot.minute,
            endHour: slot.hour,
            endMinute: slot.minute + 30,
            activity: slot.activity,
            color: slot.color,
          });
          
          if (groupedSlots[groupedSlots.length - 1].endMinute >= 60) {
            groupedSlots[groupedSlots.length - 1].endMinute = 0;
            groupedSlots[groupedSlots.length - 1].endHour++;
          }
        }
      });
      
      const horarios = groupedSlots.map(g => ({
        diaSemana: g.day,
        horaInicio: `${String(g.startHour).padStart(2, '0')}:${String(g.startMinute).padStart(2, '0')}`,
        horaFim: `${String(g.endHour).padStart(2, '0')}:${String(g.endMinute).padStart(2, '0')}`,
        materia: g.activity.split(' - ')[0].trim(),
        descricao: g.activity.split(' - ').slice(1).join(' - ').trim() || undefined,
        cor: g.color,
      }));
      
      console.log('Salvando horários:', horarios);
      // Salvar cada horário individualmente
      for (const horario of horarios) {
        await api.createHorario(horario);
      }
      toast.success("Cronograma salvo com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar cronograma");
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (hour: number, minute: number) => 
    `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

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

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {/* Elementos decorativos */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-float-delayed pointer-events-none" />

      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500/20 via-cyan-500/10 to-blue-500/10 p-8 border-2 border-white/20 dark:border-white/10 backdrop-blur-xl shadow-2xl animate-slide-up">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        
        <div className="relative">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur-xl opacity-50 animate-pulse-slow" />
                  <div className="relative bg-gradient-to-br from-indigo-500 via-cyan-500 to-blue-500 p-4 rounded-2xl shadow-2xl">
                    <Calendar className="h-10 w-10 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-5xl font-black tracking-tight bg-gradient-to-r from-indigo-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent animate-gradient">
                    Cronograma
                  </h1>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowSaveDialog(true)}
                variant="outline"
                className="border-2 hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-cyan-500/10 font-bold"
              >
                <Download className="h-4 w-4 mr-2" />
                Salvar Template
              </Button>
              <Button
                onClick={() => setShowLoadDialog(true)}
                variant="outline"
                className="border-2 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 font-bold"
              >
                <Upload className="h-4 w-4 mr-2" />
                Carregar Template
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-blue-500 hover:from-indigo-600 hover:via-cyan-600 hover:to-blue-600 shadow-xl hover:shadow-2xl font-bold"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
          <p className="text-lg text-muted-foreground font-medium">
            Organize sua rotina semanal com cores, drag and drop e templates salvos 📅
          </p>
        </div>
      </div>

      {/* Instruções Premium */}
      <Card className="border-2 hover:shadow-xl transition-shadow animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-black">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            Instruções
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border-2 border-indigo-500/10">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-bold text-sm">Editar</p>
              <p className="text-sm text-muted-foreground">Clique em uma célula para digitar a atividade</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-2 border-purple-500/10">
            <div className="p-2 bg-purple-500 rounded-lg">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <div>
              <p className="font-bold text-sm">Cor</p>
              <p className="text-sm text-muted-foreground">Clique no ícone de paleta para escolher a cor</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-pink-500/5 to-rose-500/5 border-2 border-pink-500/10">
            <div className="p-2 bg-pink-500 rounded-lg">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <div>
              <p className="font-bold text-sm">Copiar/Colar</p>
              <p className="text-sm text-muted-foreground">Clique com botão direito para copiar e colar</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-rose-500/5 to-orange-500/5 border-2 border-rose-500/10">
            <div className="p-2 bg-rose-500 rounded-lg">
              <span className="text-white font-bold text-sm">4</span>
            </div>
            <div>
              <p className="font-bold text-sm">Mover</p>
              <p className="text-sm text-muted-foreground">Arraste e solte células para reorganizar</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grade Semanal Premium */}
      <Card className="border-2 hover:shadow-xl transition-shadow animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-black">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl shadow-lg">
              <Clock className="h-5 w-5 text-white" />
            </div>
            Grade Semanal
          </CardTitle>
          <CardDescription className="text-base">
            Intervalos de 30 minutos • Clique para editar • Arraste para mover • Clique direito para copiar/colar
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[900px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-2 border-border bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 p-3 text-sm font-black sticky left-0 z-10">
                    Horário
                  </th>
                  {DAYS.map((day, index) => (
                    <th key={index} className="border-2 border-border bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 p-3 text-sm font-black">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(hour =>
                  MINUTES.map(minute => {
                    const timeKey = `${hour}-${minute}`;
                    return (
                      <tr key={timeKey}>
                        <td className="border-2 border-border bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 text-xs font-mono font-bold sticky left-0 z-10">
                          {formatTime(hour, minute)}
                        </td>
                        {DAYS.map((_, dayIndex) => {
                          const slot = getSlot(dayIndex, hour, minute);
                          const cellKey = getCellKey(dayIndex, hour, minute);
                          const isEditing = editingCell === cellKey;

                          return (
                            <td
                              key={cellKey}
                              className="border-2 border-border p-0 h-12 relative group transition-all hover:shadow-lg"
                              style={{ backgroundColor: slot.color }}
                              draggable={!isEditing && slot.activity !== ""}
                              onDragStart={() => handleDragStart(dayIndex, hour, minute)}
                              onDragOver={handleDragOver}
                              onDrop={() => handleDrop(dayIndex, hour, minute)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if (copiedCell) {
                                  handlePaste(dayIndex, hour, minute);
                                } else {
                                  handleCopy(dayIndex, hour, minute);
                                }
                              }}
                            >
                              {isEditing ? (
                                <Input
                                  autoFocus
                                  value={slot.activity}
                                  onChange={(e) => updateSlot(dayIndex, hour, minute, { activity: e.target.value })}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") setEditingCell(null);
                                    if (e.key === "Escape") setEditingCell(null);
                                  }}
                                  className="h-full border-0 text-xs p-2 font-semibold"
                                  style={{ backgroundColor: slot.color }}
                                />
                              ) : (
                                <div
                                  onClick={() => setEditingCell(cellKey)}
                                  className="h-full w-full p-2 text-xs cursor-pointer flex items-center justify-between font-semibold"
                                >
                                  <span className="truncate flex-1">{slot.activity}</span>
                                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                          }}
                                          className="p-1 hover:bg-black/20 dark:hover:bg-white/20 rounded transition-colors"
                                        >
                                          <Palette className="h-3.5 w-3.5" />
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-3 border-2">
                                        <div className="grid grid-cols-3 gap-2">
                                          {COLORS.map((color) => (
                                            <button
                                              key={color.value}
                                              onClick={() => {
                                                updateSlot(dayIndex, hour, minute, { color: color.value });
                                              }}
                                              className="w-10 h-10 rounded-lg border-2 border-border hover:scale-110 hover:shadow-lg transition-all"
                                              style={{ backgroundColor: color.value }}
                                              title={color.name}
                                            />
                                          ))}
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopy(dayIndex, hour, minute);
                                      }}
                                      className="p-1 hover:bg-black/20 dark:hover:bg-white/20 rounded transition-colors"
                                      title="Copiar"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Salvar Template */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Salvar como Template</DialogTitle>
            <DialogDescription className="text-base">
              Salve o cronograma atual como um template reutilizável
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="templateName" className="font-bold">Nome do Template</Label>
              <Input
                id="templateName"
                placeholder="Ex: Semana de Provas, Rotina Normal..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="border-2"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="border-2">
              Cancelar
            </Button>
            <Button onClick={handleSaveTemplate} className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 font-bold">
              <Save className="mr-2 h-4 w-4" />
              Salvar Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Carregar Template */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-2xl border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Meus Templates</DialogTitle>
            <DialogDescription className="text-base">
              Carregue um template salvo ou exclua templates antigos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative mx-auto w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full blur-xl opacity-30" />
                  <div className="relative p-6 bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 rounded-full flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-800">
                    <FolderOpen className="h-12 w-12 text-indigo-500" />
                  </div>
                </div>
                <p className="text-lg font-semibold">Nenhum template salvo ainda</p>
                <p className="text-sm text-muted-foreground mt-2">Crie seu primeiro template!</p>
              </div>
            ) : (
              templates.map((template) => (
                <Card key={template.id} className="p-4 border-2 hover:shadow-lg transition-all hover:border-indigo-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-black text-lg">{template.name}</h4>
                      <p className="text-sm text-muted-foreground font-medium">
                        {template.schedule.filter(s => s.activity).length} atividades • 
                        Criado em {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleLoadTemplate(template)}
                        className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 font-bold"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Carregar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

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

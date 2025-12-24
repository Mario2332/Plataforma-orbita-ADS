import { useState, useEffect, useMemo, useCallback } from "react";
import { InContentAd, ResponsiveAd } from "@/components/ads";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CronogramaCell from "@/components/CronogramaCell";
import { Calendar, Save, Copy, Palette, Zap, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
// Acesso direto ao Firestore (elimina cold start de ~20s)
import {
  getHorariosDirect,
  replaceAllHorarios
} from "@/lib/firestore-direct";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CronogramaSkeleton } from "@/components/ui/skeleton-loader";

type TimeSlot = {
  day: number;
  hour: number;
  minute: number;
  activity: string;
  color: string;
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
  // Removido useAlunoApi - usando acesso direto ao Firestore para eliminar cold start
  const [schedule, setSchedule] = useState<TimeSlot[]>([]);
  const [copiedCell, setCopiedCell] = useState<TimeSlot | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [draggedCell, setDraggedCell] = useState<{ day: number; hour: number; minute: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para Popover global de cores (otimização: evita 336 Popovers)
  const [colorPickerCell, setColorPickerCell] = useState<{ day: number; hour: number; minute: number } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await loadSchedule();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const loadSchedule = async () => {
    try {
      // Acesso direto ao Firestore (elimina cold start de ~20s)
      const horarios = await getHorariosDirect();
      
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
    }
  };

  const getCellKey = (day: number, hour: number, minute: number) => 
    `${day}-${hour}-${minute}`;

  // Otimização: Converter schedule para Map para lookup O(1) em vez de O(N)
  const scheduleMap = useMemo(() => {
    const map = new Map<string, TimeSlot>();
    schedule.forEach(s => map.set(getCellKey(s.day, s.hour, s.minute), s));
    return map;
  }, [schedule]);

  // Otimizado: usa Map em vez de .find()
  const getSlot = useCallback((day: number, hour: number, minute: number): TimeSlot => {
    const key = getCellKey(day, hour, minute);
    return scheduleMap.get(key) || { day, hour, minute, activity: "", color: "#FFFFFF" };
  }, [scheduleMap]);

  const updateSlot = useCallback((day: number, hour: number, minute: number, updates: Partial<TimeSlot>) => {
    const key = getCellKey(day, hour, minute);
    const existing = scheduleMap.has(key);

    if (existing) {
      setSchedule(prev => prev.map(s => 
        s.day === day && s.hour === hour && s.minute === minute
          ? { ...s, ...updates }
          : s
      ));
    } else {
      setSchedule(prev => [...prev, { day, hour, minute, activity: "", color: "#FFFFFF", ...updates }]);
    }
  }, [scheduleMap]);

  // Handlers otimizados com useCallback para evitar re-renders desnecessários
  const handleCopy = useCallback((day: number, hour: number, minute: number) => {
    const slot = getSlot(day, hour, minute);
    setCopiedCell(slot);
    toast.success("Célula copiada!");
  }, [getSlot]);

  const handlePaste = useCallback((day: number, hour: number, minute: number) => {
    if (!copiedCell) {
      toast.error("Nenhuma célula copiada");
      return;
    }
    updateSlot(day, hour, minute, {
      activity: copiedCell.activity,
      color: copiedCell.color,
    });
    toast.success("Célula colada!");
  }, [copiedCell, updateSlot]);

  const handleDragStart = useCallback((day: number, hour: number, minute: number) => {
    setDraggedCell({ day, hour, minute });
  }, []);

  const handleDrop = useCallback((targetDay: number, targetHour: number, targetMinute: number) => {
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
  }, [draggedCell, getSlot, updateSlot]);

  // Callbacks estáveis para o componente CronogramaCell
  const handleStartEdit = useCallback((cellKey: string) => {
    setEditingCell(cellKey);
  }, []);

  const handleStopEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleActivityChange = useCallback((day: number, hour: number, minute: number, activity: string) => {
    updateSlot(day, hour, minute, { activity });
  }, [updateSlot]);

  const handleColorPickerOpen = useCallback((day: number, hour: number, minute: number) => {
    setColorPickerCell({ day, hour, minute });
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
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
        descricao: g.activity.split(' - ').slice(1).join(' - ').trim() || '',
        cor: g.color,
      }));
      
      // Otimização: Limpar e salvar em UMA Única operação (delete + create no mesmo batch)
      await replaceAllHorarios(horarios);
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
      <div className="space-y-8 pb-8">
        <CronogramaSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-sm font-bold"
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {/* Instruções Premium */}
      <Card className="border-2 hover:shadow-sm transition-shadow animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
            <div className="p-2 bg-emerald-500 rounded-xl">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            Instruções
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <div>
              <p className="font-bold text-sm">Editar</p>
              <p className="text-sm text-muted-foreground">Clique em uma célula para digitar a atividade</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <div>
              <p className="font-bold text-sm">Cor</p>
              <p className="text-sm text-muted-foreground">Clique no ícone de paleta para escolher a cor</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <div>
              <p className="font-bold text-sm">Copiar/Colar</p>
              <p className="text-sm text-muted-foreground">Clique com botão direito para copiar e colar</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50">
            <div className="p-2 bg-emerald-500 rounded-lg">
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
      <Card className="border-2 hover:shadow-sm transition-shadow animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
            <div className="p-2 bg-emerald-500 rounded-xl">
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
                  <th className="border-2 border-border bg-emerald-100 dark:bg-emerald-900/30 p-3 text-sm font-semibold sticky left-0 z-10">
                    Horário
                  </th>
                  {DAYS.map((day, index) => (
                    <th key={index} className="border-2 border-border bg-emerald-100 dark:bg-emerald-900/30 p-3 text-sm font-semibold">
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
                        <td className="border-2 border-border bg-gray-50 dark:bg-gray-900 p-3 text-xs font-mono font-bold sticky left-0 z-10">
                          {formatTime(hour, minute)}
                        </td>
                        {DAYS.map((_, dayIndex) => {
                          const slot = getSlot(dayIndex, hour, minute);
                          const cellKey = getCellKey(dayIndex, hour, minute);
                          const isEditing = editingCell === cellKey;

                          return (
                            <CronogramaCell
                              key={cellKey}
                              day={dayIndex}
                              hour={hour}
                              minute={minute}
                              slot={slot}
                              isEditing={isEditing}
                              onStartEdit={() => handleStartEdit(cellKey)}
                              onStopEdit={handleStopEdit}
                              onActivityChange={(activity) => handleActivityChange(dayIndex, hour, minute, activity)}
                              onColorPickerOpen={() => handleColorPickerOpen(dayIndex, hour, minute)}
                              onCopy={() => handleCopy(dayIndex, hour, minute)}
                              onPaste={() => handlePaste(dayIndex, hour, minute)}
                              onDragStart={() => handleDragStart(dayIndex, hour, minute)}
                              onDrop={() => handleDrop(dayIndex, hour, minute)}
                              hasCopiedCell={copiedCell !== null}
                            />
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

      {/* Dialog Global para Seletor de Cores (otimização: 1 dialog em vez de 336 Popovers) */}
      <Dialog open={colorPickerCell !== null} onOpenChange={(open) => !open && setColorPickerCell(null)}>
        <DialogContent className="w-auto max-w-xs border-2">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Escolher Cor</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-2">
            {COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => {
                  if (colorPickerCell) {
                    updateSlot(colorPickerCell.day, colorPickerCell.hour, colorPickerCell.minute, { color: color.value });
                    setColorPickerCell(null);
                  }
                }}
                className="w-12 h-12 rounded-lg border-2 border-border hover:scale-[1.01] hover:shadow transition-all"
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
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

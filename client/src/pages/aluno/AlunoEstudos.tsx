import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlunoApi } from "@/hooks/useAlunoApi";
import { BookOpen, Clock, Edit, Play, Plus, Trash2, Pause, RotateCcw, Save, ArrowUpDown, Zap, Timer, CheckCircle2, Target, Maximize2, X, AlertCircle } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
import { SidebarAd, InContentAd } from "@/components/ads";
import LoginCTA from "@/components/LoginCTA";
import { useTenant } from "@/contexts/TenantContext";
import { useAuthContext } from "@/contexts/AuthContext";

const CRONOMETRO_STORAGE_KEY = "aluno_cronometro_estado";

// Matérias e atividades padronizadas do ENEM
const MATERIAS_ENEM = [
  "Matemática",
  "Biologia",
  "Física",
  "Química",
  "História",
  "Geografia",
  "Filosofia",
  "Sociologia",
  "Linguagens",
  "Redação",
  "Revisão",
  "Simulado",
  "Correção de simulado",
  "Preenchimento de lacunas",
] as const;

interface CronometroEstado {
  ativo: boolean;
  tempoInicio: number | null;
  tempoAcumulado: number;
}

type OrdenacaoColuna = "data" | "materia" | "tempo" | "questoes" | "acertos" | null;
type DirecaoOrdenacao = "asc" | "desc";

export default function AlunoEstudos() {
  const api = useAlunoApi();
  const { user } = useAuthContext();
  const { isFreePlan } = useTenant();
  const isReadOnly = isFreePlan && !user;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cronometroAtivo, setCronometroAtivo] = useState(false);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [estudos, setEstudos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [colunaOrdenacao, setColunaOrdenacao] = useState<OrdenacaoColuna>(null);
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>("desc");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Novos estados para tempo meta e modo foco
  const [tempoMeta, setTempoMeta] = useState<number | null>(null); // em segundos
  const [modoFoco, setModoFoco] = useState(false);
  const [dialogTempoOpen, setDialogTempoOpen] = useState(false);
  const [horasMeta, setHorasMeta] = useState("0");
  const [minutosMeta, setMinutosMeta] = useState("30");

  const [formData, setFormData] = useState({
    data: new Date().toISOString().split("T")[0],
    materia: "",
    conteudo: "",
    tempoMinutos: 0,
    questoesFeitas: 0,
    questoesAcertadas: 0,
    flashcardsRevisados: 0,
  });

  const tempoInicioRef = useRef<number | null>(null);
  const tempoAcumuladoRef = useRef<number>(0);

  // Carregar estado do cronômetro do localStorage
  useEffect(() => {
    const estadoSalvo = localStorage.getItem(CRONOMETRO_STORAGE_KEY);
    if (estadoSalvo) {
      try {
        const estado: CronometroEstado = JSON.parse(estadoSalvo);
        
        tempoInicioRef.current = estado.tempoInicio;
        tempoAcumuladoRef.current = estado.tempoAcumulado;
        
        if (estado.ativo && estado.tempoInicio) {
          setCronometroAtivo(true);
        } else {
          setTempoDecorrido(estado.tempoAcumulado);
          setCronometroAtivo(false);
        }
      } catch (error) {
        console.error("Erro ao carregar estado do cronômetro:", error);
      }
    }
  }, []);

  // Atualizar cronômetro a cada segundo
  useEffect(() => {
    if (cronometroAtivo) {
      intervalRef.current = setInterval(() => {
        if (tempoInicioRef.current) {
          const agora = Date.now();
          const tempoDecorridoAtual = Math.floor((agora - tempoInicioRef.current) / 1000) + tempoAcumuladoRef.current;
          setTempoDecorrido(tempoDecorridoAtual);
          
          // Verificar se atingiu o tempo meta
          if (tempoMeta && tempoDecorridoAtual >= tempoMeta) {
            pausarCronometro();
            toast.success("⏰ Tempo de estudos concluído! Parabéns!", {
              duration: 5000,
            });
            // Tocar som de notificação (opcional)
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(() => {});
            } catch {}
          }
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [cronometroAtivo, tempoMeta]);

  // Salvar estado do cronômetro no localStorage quando mudar
  useEffect(() => {
    if (cronometroAtivo || tempoDecorrido > 0) {
      const estado: CronometroEstado = {
        ativo: cronometroAtivo,
        tempoInicio: tempoInicioRef.current,
        tempoAcumulado: tempoAcumuladoRef.current,
      };
      localStorage.setItem(CRONOMETRO_STORAGE_KEY, JSON.stringify(estado));
    }
  }, [cronometroAtivo, tempoDecorrido]);

  const loadEstudos = async () => {
    // Não carregar dados se o usuário não estiver autenticado no plano Free
    if (isReadOnly) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const data = await api.getEstudos();
      setEstudos(data as any[]);
    } catch (error: any) {
      // Silenciar erro se o usuário não estiver autenticado
      if (!isReadOnly) {
        toast.error(error.message || "Erro ao carregar estudos");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEstudos();
  }, [isReadOnly]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      if (editandoId) {
        const [ano, mes, dia] = formData.data.split('-').map(Number);
        const dataLocal = new Date(ano, mes - 1, dia, 12, 0, 0);
        
        const { data: _, ...restFormData } = formData;
        await api.updateEstudo(editandoId, {
          ...restFormData,
          data: dataLocal,
        } as any);
        toast.success("Estudo atualizado com sucesso!");
      } else {
        const [ano, mes, dia] = formData.data.split('-').map(Number);
        const dataLocal = new Date(ano, mes - 1, dia, 12, 0, 0);
        
        const { data: _, ...restFormData } = formData;
        await api.createEstudo({
          ...restFormData,
          data: dataLocal,
        } as any);
        toast.success("Estudo registrado com sucesso!");
      }
      
      setDialogOpen(false);
      setEditandoId(null);
      setFormData({
        data: new Date().toISOString().split("T")[0],
        materia: "",
        conteudo: "",
        tempoMinutos: 0,
        questoesFeitas: 0,
        questoesAcertadas: 0,
        flashcardsRevisados: 0,
      });
      await loadEstudos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar estudo");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleEdit = (estudo: any) => {
    let dataFormatada: string;
    try {
      let data: Date;
      if (estudo.data?.seconds) {
        data = new Date(estudo.data.seconds * 1000);
      } else if (estudo.data?.toDate) {
        data = estudo.data.toDate();
      } else {
        data = new Date(estudo.data);
      }
      dataFormatada = data.toISOString().split('T')[0];
    } catch (error) {
      dataFormatada = new Date().toISOString().split('T')[0];
    }
    
    setFormData({
      data: dataFormatada,
      materia: estudo.materia,
      conteudo: estudo.conteudo || "",
      tempoMinutos: estudo.tempoMinutos,
      questoesFeitas: estudo.questoesFeitas || 0,
      questoesAcertadas: estudo.questoesAcertadas || 0,
      flashcardsRevisados: estudo.flashcardsRevisados || 0,
    });
    setEditandoId(estudo.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      try {
        await api.deleteEstudo(id);
        toast.success("Estudo excluído com sucesso!");
        await loadEstudos();
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir estudo");
      }
    }
  };

  const iniciarCronometro = () => {
    tempoInicioRef.current = Date.now();
    tempoAcumuladoRef.current = tempoDecorrido;
    setCronometroAtivo(true);
  };

  const pausarCronometro = () => {
    tempoAcumuladoRef.current = tempoDecorrido;
    tempoInicioRef.current = null;
    setCronometroAtivo(false);
  };

  const resetarCronometro = () => {
    setCronometroAtivo(false);
    setTempoDecorrido(0);
    tempoInicioRef.current = null;
    tempoAcumuladoRef.current = 0;
    localStorage.removeItem(CRONOMETRO_STORAGE_KEY);
  };

  const salvarCronometro = () => {
    const minutos = Math.floor(tempoDecorrido / 60);
    if (minutos === 0) {
      toast.error("O tempo deve ser maior que zero");
      return;
    }
    
    setFormData({
      ...formData,
      tempoMinutos: minutos,
    });
    setDialogOpen(true);
    resetarCronometro();
  };

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segs).padStart(2, "0")}`;
  };
  
  const definirTempoMeta = () => {
    const horas = parseInt(horasMeta) || 0;
    const minutos = parseInt(minutosMeta) || 0;
    const totalSegundos = (horas * 3600) + (minutos * 60);
    
    if (totalSegundos === 0) {
      toast.error("Defina um tempo válido");
      return;
    }
    
    setTempoMeta(totalSegundos);
    setDialogTempoOpen(false);
    toast.success(`Meta de tempo definida: ${horas}h ${minutos}min`);
  };
  
  const removerTempoMeta = () => {
    setTempoMeta(null);
    toast.info("Meta de tempo removida");
  };
  
  const ativarModoFoco = () => {
    setModoFoco(true);
    // Tentar entrar em fullscreen
    try {
      document.documentElement.requestFullscreen?.();
    } catch {}
  };
  
  const desativarModoFoco = () => {
    setModoFoco(false);
    // Sair do fullscreen
    try {
      document.exitFullscreen?.();
    } catch {}
  };
  
  const tempoRestante = tempoMeta ? Math.max(0, tempoMeta - tempoDecorrido) : 0;
  const progressoPercentual = tempoMeta ? Math.min(100, (tempoDecorrido / tempoMeta) * 100) : 0;
  
  const handleOrdenar = (coluna: OrdenacaoColuna) => {
    if (colunaOrdenacao === coluna) {
      setDirecaoOrdenacao(direcaoOrdenacao === "asc" ? "desc" : "asc");
    } else {
      setColunaOrdenacao(coluna);
      setDirecaoOrdenacao("desc");
    }
  };
  
  // useMemo para evitar re-ordenação desnecessária a cada atualização do cronômetro
  const estudosOrdenados = useMemo(() => {
    return [...estudos].sort((a, b) => {
      if (!colunaOrdenacao) return 0;
      
      let valorA: any;
      let valorB: any;
      
      switch (colunaOrdenacao) {
        case "data":
          try {
            const dataA = a.data?.seconds || a.data?._seconds ? new Date((a.data.seconds || a.data._seconds) * 1000) : new Date(a.data);
            const dataB = b.data?.seconds || b.data?._seconds ? new Date((b.data.seconds || b.data._seconds) * 1000) : new Date(b.data);
            valorA = dataA.getTime();
            valorB = dataB.getTime();
          } catch {
            return 0;
          }
          break;
        case "materia":
          valorA = a.materia?.toLowerCase() || "";
          valorB = b.materia?.toLowerCase() || "";
          break;
        case "tempo":
          valorA = a.tempoMinutos || 0;
          valorB = b.tempoMinutos || 0;
          break;
        case "questoes":
          valorA = a.questoesFeitas || 0;
          valorB = b.questoesFeitas || 0;
          break;
        case "acertos":
          valorA = a.questoesAcertadas || 0;
          valorB = b.questoesAcertadas || 0;
          break;
        default:
          return 0;
      }
      
      if (direcaoOrdenacao === "asc") {
        return valorA > valorB ? 1 : -1;
      } else {
        return valorA < valorB ? 1 : -1;
      }
    });
  }, [estudos, colunaOrdenacao, direcaoOrdenacao]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-primary"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {isReadOnly && (
        <div className="mb-6">
          <LoginCTA />
        </div>
      )}
      {/* Elementos decorativos */}

      {/* Header Premium */}
      <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 border-2 border-white/20 dark:border-white/10 backdrop-blur-none shadow-sm animate-slide-up">
        
        
        
        <div className="relative flex items-center justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative">
                
                <div className="relative bg-emerald-500 rounded-lg shadow-sm">
                  <BookOpen className="h-10 w-10 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 ">
                  Estudos
                </h1>
              </div>
            </div>
            <p className="text-lg text-muted-foreground font-medium">
              Registre e acompanhe suas sessões de estudo 📚
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="relative overflow-hidden bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setEditandoId(null);
                  setFormData({
                    data: new Date().toISOString().split("T")[0],
                    materia: "",
                    conteudo: "",
                    tempoMinutos: 0,
                    questoesFeitas: 0,
                    questoesAcertadas: 0,
                    flashcardsRevisados: 0,
                  });
                }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Registrar Estudo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold">{editandoId ? "Editar Sessão de Estudo" : "Registrar Sessão de Estudo"}</DialogTitle>
                <DialogDescription className="text-base">
                  {editandoId ? "Atualize os detalhes da sua sessão de estudo" : "Preencha os detalhes da sua sessão de estudo"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data" className="text-sm font-semibold">Data</Label>
                      <Input
                        id="data"
                        type="date"
                        value={formData.data}
                        onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                        required
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tempoMinutos" className="text-sm font-semibold">Tempo (minutos)</Label>
                      <Input
                        id="tempoMinutos"
                        type="number"
                        min="1"
                        value={formData.tempoMinutos}
                        onChange={(e) => setFormData({ ...formData, tempoMinutos: parseInt(e.target.value) || 0 })}
                        required
                        className="border-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="materia" className="text-sm font-semibold">Matéria/Atividade</Label>
                    <Select
                      value={formData.materia}
                      onValueChange={(value) => setFormData({ ...formData, materia: value })}
                      required
                    >
                      <SelectTrigger id="materia" className="border-2">
                        <SelectValue placeholder="Selecione uma opção" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATERIAS_ENEM.map((materia) => (
                          <SelectItem key={materia} value={materia}>
                            {materia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conteudo" className="text-sm font-semibold">Conteúdo Estudado <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                    <Input
                      id="conteudo"
                      value={formData.conteudo}
                      onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                      placeholder="Ex: Funções quadráticas, Análise sintática..."
                      className="border-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="questoesFeitas" className="text-sm font-semibold">Questões Feitas</Label>
                      <Input
                        id="questoesFeitas"
                        type="number"
                        min="0"
                        value={formData.questoesFeitas}
                        onChange={(e) => setFormData({ ...formData, questoesFeitas: parseInt(e.target.value) || 0 })}
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="questoesAcertadas" className="text-sm font-semibold">Questões Acertadas</Label>
                      <Input
                        id="questoesAcertadas"
                        type="number"
                        min="0"
                        value={formData.questoesAcertadas}
                        onChange={(e) => setFormData({ ...formData, questoesAcertadas: parseInt(e.target.value) || 0 })}
                        className="border-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="flashcardsRevisados" className="text-sm font-semibold">Flashcards Revisados</Label>
                      <Input
                        id="flashcardsRevisados"
                        type="number"
                        min="0"
                        value={formData.flashcardsRevisados}
                        onChange={(e) => setFormData({ ...formData, flashcardsRevisados: parseInt(e.target.value) || 0 })}
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="border-2">
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSaving}
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                  >
                    {isSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cronômetro Premium */}
      <Card className="border-2 hover:shadow-sm transition-all duration-500 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
                <div className="relative">
                  
                  <div className="relative p-3 bg-emerald-500 rounded-xl">
                    <Timer className="h-4 w-4 text-white" />
                  </div>
                </div>
                Cronômetro de Estudo
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                Inicie o cronômetro para registrar o tempo de estudo em tempo real
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {/* Display do tempo com design moderno */}
            <div className="relative">
              
              <div className="relative px-12 py-8 bg-white dark:bg-gray-900">
                <div className="text-7xl font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 ">
                  {formatarTempo(tempoDecorrido)}
                </div>
              </div>
            </div>

            {/* Botões com design premium */}
            <div className="flex flex-wrap gap-4 justify-center">
              {!cronometroAtivo ? (
                <Button 
                  onClick={iniciarCronometro} 
                  size="lg"
                  className="relative overflow-hidden bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-sm hover:shadow-sm transition-all duration-300 font-bold px-8 py-3 text-lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </Button>
              ) : (
                <Button 
                  onClick={pausarCronometro} 
                  size="lg"
                  className="relative overflow-hidden bg-emerald-600 hover:bg-emerald-700 shadow-sm hover:shadow-sm hover:shadow-sm transition-all duration-300 font-bold px-8 py-3 text-lg"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              )}
              
              <Button 
                onClick={resetarCronometro} 
                size="lg"
                variant="outline"
                className="border-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300 font-bold px-8 py-3 text-lg"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
              
              <Button 
                onClick={salvarCronometro} 
                size="lg"
                disabled={tempoDecorrido === 0}
                className="relative overflow-hidden bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Sessão
              </Button>
              
              <Button 
                onClick={() => setDialogTempoOpen(true)} 
                size="lg"
                variant="outline"
                className="border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-all duration-300 font-bold px-8 py-3 text-lg"
              >
                <Target className="h-4 w-4 mr-2" />
                Definir Tempo
              </Button>
              
              <Button 
                onClick={ativarModoFoco} 
                size="lg"
                variant="outline"
                className="border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 transition-all duration-300 font-bold px-8 py-3 text-lg"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Modo Foco
              </Button>
            </div>
            
            {/* Indicador de tempo meta */}
            {tempoMeta && (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400">Meta: {formatarTempo(tempoMeta)}</span>
                  <span className="text-teal-600 dark:text-teal-400">Restante: {formatarTempo(tempoRestante)}</span>
                  <Button 
                    onClick={removerTempoMeta} 
                    size="sm" 
                    variant="ghost"
                    className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
                <div className="relative h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progressoPercentual}%` }}
                  />
                </div>
              </div>
            )}
            
            {cronometroAtivo && (
              <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200 dark:border-emerald-800">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <p className="text-sm font-bold text-teal-700 dark:text-teal-300">
                  Cronômetro ativo - Continue estudando!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Anúncio entre seções */}
      <InContentAd className="animate-slide-up" />

      {/* Lista de Estudos Premium */}
      <Card className="border-2 hover:shadow-sm transition-shadow animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
            <div className="relative">
              
              <div className="relative p-3 bg-emerald-500 rounded-xl">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </div>
            Histórico de Estudos
          </CardTitle>
          <CardDescription className="text-base">Suas sessões de estudo registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {estudos.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mx-auto w-24 h-24 mb-6">
                
                <div className="relative p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center border border-gray-200 dark:border-gray-700 dark:border-emerald-800">
                  <BookOpen className="h-12 w-12 text-emerald-500" />
                </div>
              </div>
              <p className="text-lg font-semibold mb-2">Nenhum estudo registrado ainda</p>
              <p className="text-sm text-muted-foreground">Comece registrando sua primeira sessão de estudo!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-2">
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleOrdenar("data")} className="-ml-3 h-8 font-bold">
                        Data
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleOrdenar("materia")} className="-ml-3 h-8 font-bold">
                        Matéria
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold">Conteúdo</TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleOrdenar("tempo")} className="-ml-3 h-8 font-bold">
                        Tempo
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleOrdenar("questoes")} className="-ml-3 h-8 font-bold">
                        Questões
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleOrdenar("acertos")} className="-ml-3 h-8 font-bold">
                        Acertos
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-bold">Flashcards</TableHead>
                    <TableHead className="text-right font-bold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudosOrdenados.map((estudo) => {
                    let dataFormatada = "Data inválida";
                    
                    try {
                      if (estudo.data?.seconds || estudo.data?._seconds) {
                        const seconds = estudo.data.seconds || estudo.data._seconds;
                        const date = new Date(seconds * 1000);
                        if (!isNaN(date.getTime())) {
                          dataFormatada = date.toLocaleDateString("pt-BR");
                        }
                      } else if (estudo.data?.toDate && typeof estudo.data.toDate === 'function') {
                        const date = estudo.data.toDate();
                        if (!isNaN(date.getTime())) {
                          dataFormatada = date.toLocaleDateString("pt-BR");
                        }
                      } else if (estudo.data) {
                        const date = new Date(estudo.data);
                        if (!isNaN(date.getTime())) {
                          dataFormatada = date.toLocaleDateString("pt-BR");
                        }
                      }
                    } catch (error) {
                      console.error("Erro ao formatar data:", error);
                    }
                    
                    return (
                    <TableRow key={estudo.id} className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
                      <TableCell className="font-medium">{dataFormatada}</TableCell>
                      <TableCell>
                        <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-sm font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {estudo.materia}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{estudo.conteudo || "-"}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Clock className="h-4 w-4 text-emerald-500" />
                          {estudo.tempoMinutos} min
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">{estudo.questoesFeitas || 0}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5 font-semibold text-teal-600 dark:text-teal-400">
                          <CheckCircle2 className="h-4 w-4" />
                          {estudo.questoesAcertadas || 0}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">{estudo.flashcardsRevisados || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(estudo)}
                            title="Editar"
                            className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(estudo.id)}
                            title="Excluir"
                            className="hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Anúncio após histórico */}
      <InContentAd className="animate-slide-up" />

      {/* Dialog para definir tempo meta */}
      <Dialog open={dialogTempoOpen} onOpenChange={setDialogTempoOpen}>
        <DialogContent className="border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-500" />
              Definir Tempo de Estudos
            </DialogTitle>
            <DialogDescription className="text-base">
              Defina quanto tempo você pretende estudar nesta sessão
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="horas" className="font-bold">Horas</Label>
              <Input
                id="horas"
                type="number"
                min="0"
                max="23"
                value={horasMeta}
                onChange={(e) => setHorasMeta(e.target.value)}
                className="border-2 font-semibold text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutos" className="font-bold">Minutos</Label>
              <Input
                id="minutos"
                type="number"
                min="0"
                max="59"
                value={minutosMeta}
                onChange={(e) => setMinutosMeta(e.target.value)}
                className="border-2 font-semibold text-lg"
              />
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <AlertCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              O cronômetro irá contar até o tempo definido e você será notificado quando terminar.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogTempoOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={definirTempoMeta} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
              Definir Meta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modo Foco - Tela Cheia */}
      {modoFoco && (
        <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center">
          {/* Elementos decorativos */}
          
          <div className="relative z-10 flex flex-col items-center gap-12 p-4">
            {/* Botão fechar */}
            <Button
              onClick={desativarModoFoco}
              size="lg"
              variant="ghost"
              className="absolute top-4 right-8 text-white hover:bg-white/10 rounded-full h-14 w-14 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
            
            {/* Título */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-white">Modo Foco</h2>
              <p className="text-xl text-emerald-200 font-medium">Concentre-se nos seus estudos</p>
            </div>
            
            {/* Cronômetro gigante */}
            <div className="relative">
              
              <div className="relative px-20 py-16 bg-gray-900 rounded-[4rem] border-4 border-emerald-400/30 backdrop-blur-none">
                <div className="text-[10rem] font-mono font-semibold tabular-nums text-white drop-shadow-sm">
                  {formatarTempo(tempoDecorrido)}
                </div>
              </div>
            </div>
            
            {/* Indicador de meta (se definido) */}
            {tempoMeta && (
              <div className="w-full max-w-2xl space-y-4">
                <div className="flex items-center justify-between text-white text-xl font-bold">
                  <span>Meta: {formatarTempo(tempoMeta)}</span>
                  <span className="text-teal-300">Restante: {formatarTempo(tempoRestante)}</span>
                </div>
                <div className="relative h-6 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                  <div 
                    className="absolute h-full bg-emerald-400 transition-all duration-300 rounded-full shadow shadow-teal-500/50"
                    style={{ width: `${progressoPercentual}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Botões de controle */}
            <div className="flex gap-4">
              {!cronometroAtivo ? (
                <Button 
                  onClick={iniciarCronometro} 
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold px-12 py-8 text-2xl rounded-lg"
                >
                  <Play className="h-10 w-10 mr-3" />
                  Iniciar
                </Button>
              ) : (
                <Button 
                  onClick={pausarCronometro} 
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-sm font-bold px-12 py-8 text-2xl rounded-lg"
                >
                  <Pause className="h-10 w-10 mr-3" />
                  Pausar
                </Button>
              )}
              
              <Button 
                onClick={resetarCronometro} 
                size="lg"
                variant="outline"
                className="border-4 border-white/30 hover:bg-white/10 text-white font-bold px-12 py-8 text-2xl rounded-lg backdrop-blur-sm"
              >
                <RotateCcw className="h-10 w-10 mr-3" />
                Resetar
              </Button>
            </div>
            
            {/* Indicador de cronômetro ativo */}
            {cronometroAtivo && (
              <div className="flex items-center gap-3 px-8 py-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-200 dark:border-emerald-800">
                <div className="w-4 h-4 bg-teal-400 rounded-full animate-ping" />
                <p className="text-lg font-bold text-teal-100">
                  Cronômetro ativo - Continue estudando!
                </p>
              </div>
            )}
          </div>
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

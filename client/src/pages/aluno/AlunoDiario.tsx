import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlunoApi } from "@/hooks/useAlunoApi";
import { Heart, Battery, Calendar, Trash2, TrendingUp, TrendingDown, Minus, BarChart3, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from "recharts";

// Opções de estado emocional
const ESTADOS_EMOCIONAIS = [
  { value: "otimo", label: "Ótimo", emoji: "😄", color: "bg-green-500" },
  { value: "bom", label: "Bom", emoji: "🙂", color: "bg-blue-500" },
  { value: "neutro", label: "Neutro", emoji: "😐", color: "bg-gray-500" },
  { value: "ruim", label: "Ruim", emoji: "😟", color: "bg-orange-500" },
  { value: "pessimo", label: "Péssimo", emoji: "😢", color: "bg-red-500" },
];

// Opções de nível de cansaço
const NIVEIS_CANSACO = [
  { value: "descansado", label: "Descansado", icon: Battery, color: "bg-green-500", level: 100 },
  { value: "normal", label: "Normal", icon: Battery, color: "bg-blue-500", level: 75 },
  { value: "cansado", label: "Cansado", icon: Battery, color: "bg-yellow-500", level: 50 },
  { value: "muito_cansado", label: "Muito Cansado", icon: Battery, color: "bg-orange-500", level: 25 },
  { value: "exausto", label: "Exausto", icon: Battery, color: "bg-red-500", level: 10 },
];

export default function AlunoDiario() {
  const api = useAlunoApi();
  const [registros, setRegistros] = useState<any[]>([]);
  const [estudos, setEstudos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [periodoFiltro, setPeriodoFiltro] = useState<string>("todo");
  
  // Formulário
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    estadoEmocional: "",
    nivelCansaco: "",
    qualidadeSono: "",
    atividadeFisica: undefined as boolean | undefined,
    observacoes: "",
  });

  const loadRegistros = async () => {
    try {
      setIsLoading(true);
      const [registrosData, estudosData] = await Promise.all([
        api.getDiarioEmocional(),
        api.getEstudos()
      ]);
      setRegistros(registrosData as any[]);
      setEstudos(estudosData as any[]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRegistros();
  }, []);

  // Funções auxiliares
  const formatData = (timestamp: any) => {
    if (!timestamp) return "";
    
    let data: Date;
    
    if (timestamp.toDate) {
      data = timestamp.toDate();
    } else if (timestamp.seconds || timestamp._seconds) {
      const seconds = timestamp.seconds || timestamp._seconds;
      data = new Date(seconds * 1000);
    } else if (timestamp) {
      data = new Date(timestamp);
    } else {
      return "";
    }

    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoEmocional = (value: string) => {
    return ESTADOS_EMOCIONAIS.find(e => e.value === value);
  };

  const getNivelCansaco = (value: string) => {
    return NIVEIS_CANSACO.find(n => n.value === value);
  };

  // Preparar dados para gráficos
  const prepararDadosGrafico = () => {
    const dados = registros.map(registro => {
      const dataStr = formatData(registro.data);
      
      // Converter estado emocional em número (1-5)
      const estadoMap: any = {
        'pessimo': 1,
        'ruim': 2,
        'neutro': 3,
        'bom': 4,
        'otimo': 5
      };
      
      // Converter cansaço em número (1-5)
      const cansacoMap: any = {
        'exausto': 1,
        'muito_cansado': 2,
        'cansado': 3,
        'normal': 4,
        'descansado': 5
      };
      
      return {
        data: dataStr,
        estadoEmocional: estadoMap[registro.estadoEmocional] || 3,
        nivelEnergia: cansacoMap[registro.nivelCansaco] || 3,
        qualidadeSono: registro.qualidadeSono ? estadoMap[registro.qualidadeSono] : null,
        atividadeFisica: registro.atividadeFisica !== undefined ? (registro.atividadeFisica ? 5 : 1) : null,
      };
    }).reverse(); // Inverter para ordem cronológica
    
    return dados;
  };

  // Analisar correlação com desempenho
  const analisarCorrelacao = () => {
    if (registros.length === 0 || estudos.length === 0) return null;
    
    // Agrupar estudos por data
    const estudosPorData: any = {};
    estudos.forEach(estudo => {
      let dataEstudo: Date;
      
      if (estudo.data?.toDate) {
        dataEstudo = estudo.data.toDate();
      } else if (estudo.data?.seconds || estudo.data?._seconds) {
        const seconds = estudo.data.seconds || estudo.data._seconds;
        dataEstudo = new Date(seconds * 1000);
      } else {
        dataEstudo = new Date(estudo.data);
      }
      
      const dataStr = dataEstudo.toLocaleDateString('pt-BR');
      
      if (!estudosPorData[dataStr]) {
        estudosPorData[dataStr] = {
          tempoTotal: 0,
          questoesFeitas: 0,
          questoesAcertadas: 0,
          count: 0
        };
      }
      
      estudosPorData[dataStr].tempoTotal += estudo.tempoMinutos || 0;
      estudosPorData[dataStr].questoesFeitas += estudo.questoesFeitas || 0;
      estudosPorData[dataStr].questoesAcertadas += estudo.questoesAcertadas || 0;
      estudosPorData[dataStr].count++;
    });
    
    // Correlacionar com registros emocionais
    let diasComBaixaEnergia = 0;
    let diasComEstadoNegativo = 0;
    let alertaBurnout = false;
    
    registros.forEach(registro => {
      const dataStr = formatData(registro.data);
      
      // Verificar energia baixa
      if (['exausto', 'muito_cansado'].includes(registro.nivelCansaco)) {
        diasComBaixaEnergia++;
      }
      
      // Verificar estado negativo
      if (['pessimo', 'ruim'].includes(registro.estadoEmocional)) {
        diasComEstadoNegativo++;
      }
    });
    
    // Alerta de burnout: 3+ dias consecutivos com baixa energia OU 5+ dias com estado negativo nos últimos 7 dias
    const ultimosRegistros = registros.slice(0, 7);
    let consecutivosBaixaEnergia = 0;
    let estadosNegativosRecentes = 0;
    
    ultimosRegistros.forEach(registro => {
      if (['exausto', 'muito_cansado'].includes(registro.nivelCansaco)) {
        consecutivosBaixaEnergia++;
      } else {
        consecutivosBaixaEnergia = 0;
      }
      
      if (['pessimo', 'ruim'].includes(registro.estadoEmocional)) {
        estadosNegativosRecentes++;
      }
    });
    
    alertaBurnout = consecutivosBaixaEnergia >= 3 || estadosNegativosRecentes >= 5;
    
    return {
      diasComBaixaEnergia,
      diasComEstadoNegativo,
      alertaBurnout,
      totalRegistros: registros.length
    };
  };

  // Filtrar registros por período
  const filtrarPorPeriodo = () => {
    if (periodoFiltro === "todo") return registros;
    
    const agora = new Date();
    let dataLimite: Date;
    
    switch (periodoFiltro) {
      case "7dias":
        dataLimite = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30dias":
        dataLimite = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3meses":
        dataLimite = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "12meses":
        dataLimite = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return registros;
    }
    
    return registros.filter(registro => {
      let dataRegistro: Date;
      
      if (registro.data?.toDate) {
        dataRegistro = registro.data.toDate();
      } else if (registro.data?.seconds || registro.data?._seconds) {
        const seconds = registro.data.seconds || registro.data._seconds;
        dataRegistro = new Date(seconds * 1000);
      } else if (registro.data) {
        dataRegistro = new Date(registro.data);
      } else {
        return false;
      }
      
      return dataRegistro >= dataLimite;
    });
  };

  // Preparar dados de distribuição para gráfico de barras
  const prepararDadosDistribuicao = () => {
    const registrosFiltrados = filtrarPorPeriodo();
    
    // Contar estados emocionais
    const contagemEstados: any = {};
    ESTADOS_EMOCIONAIS.forEach(e => {
      contagemEstados[e.value] = 0;
    });
    
    // Contar níveis de cansaço
    const contagemCansaco: any = {};
    NIVEIS_CANSACO.forEach(n => {
      contagemCansaco[n.value] = 0;
    });
    
    // Contar qualidade de sono
    const contagemSono: any = {};
    ESTADOS_EMOCIONAIS.forEach(e => {
      contagemSono[e.value] = 0;
    });
    
    // Contar atividade física
    let diasComAtividade = 0;
    let diasSemAtividade = 0;
    let diasSemRegistroAtividade = 0;
    
    registrosFiltrados.forEach(registro => {
      if (registro.estadoEmocional) {
        contagemEstados[registro.estadoEmocional] = (contagemEstados[registro.estadoEmocional] || 0) + 1;
      }
      if (registro.nivelCansaco) {
        contagemCansaco[registro.nivelCansaco] = (contagemCansaco[registro.nivelCansaco] || 0) + 1;
      }
      if (registro.qualidadeSono) {
        contagemSono[registro.qualidadeSono] = (contagemSono[registro.qualidadeSono] || 0) + 1;
      }
      if (registro.atividadeFisica === true) {
        diasComAtividade++;
      } else if (registro.atividadeFisica === false) {
        diasSemAtividade++;
      } else {
        diasSemRegistroAtividade++;
      }
    });
    
    // Preparar dados para o gráfico
    const dadosEstados = ESTADOS_EMOCIONAIS.map(e => ({
      nome: e.label,
      quantidade: contagemEstados[e.value] || 0,
      cor: e.color.replace('bg-', '')
    }));
    
    const dadosCansaco = NIVEIS_CANSACO.map(n => ({
      nome: n.label,
      quantidade: contagemCansaco[n.value] || 0,
      cor: n.color.replace('bg-', '')
    }));
    
    const dadosSono = ESTADOS_EMOCIONAIS.map(e => ({
      nome: e.label,
      quantidade: contagemSono[e.value] || 0,
      cor: e.color.replace('bg-', '')
    }));
    
    const dadosAtividade = [
      { nome: 'Sim', quantidade: diasComAtividade, cor: 'green-500' },
      { nome: 'Não', quantidade: diasSemAtividade, cor: 'red-500' },
    ];
    
    return { dadosEstados, dadosCansaco, dadosSono, dadosAtividade };
  };

  const dadosGrafico = useMemo(() => prepararDadosGrafico(), [registros]);
  const analise = useMemo(() => analisarCorrelacao(), [registros, estudos]);
  const dadosDistribuicao = useMemo(() => prepararDadosDistribuicao(), [registros, periodoFiltro]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.estadoEmocional || !formData.nivelCansaco) {
      toast.error("Selecione o estado emocional e o nível de cansaço");
      return;
    }

    try {
      setIsSaving(true);
      
      // Corrigir timezone: criar data no timezone local ao meio-dia
      const [ano, mes, dia] = formData.data.split('-').map(Number);
      const dataLocal = new Date(ano, mes - 1, dia, 12, 0, 0);
      
      await api.createDiarioEmocional({
        ...formData,
        data: dataLocal.toISOString()
      });
      toast.success("Registro salvo com sucesso!");
      setFormData({
        data: new Date().toISOString().split('T')[0],
        estadoEmocional: "",
        nivelCansaco: "",
        qualidadeSono: "",
        atividadeFisica: undefined,
        observacoes: "",
      });
      await loadRegistros();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar registro");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (registroId: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;

    try {
      await api.deleteDiarioEmocional(registroId);
      toast.success("Registro excluído!");
      await loadRegistros();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir registro");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diário de Bordo Emocional</h1>
        <p className="text-muted-foreground mt-2">
          Registre como você se sentiu em relação aos estudos
        </p>
      </div>

      {/* Formulário de Registro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Novo Registro
          </CardTitle>
          <CardDescription>
            Registre seu estado emocional e nível de energia do dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data */}
            <div className="space-y-2">
              <Label htmlFor="data" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data
              </Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>

            {/* Estado Emocional */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Como você se sentiu hoje em relação aos estudos?
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ESTADOS_EMOCIONAIS.map((estado) => (
                  <button
                    key={estado.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, estadoEmocional: estado.value })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.estadoEmocional === estado.value
                        ? `${estado.color} text-white border-transparent`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-3xl mb-2">{estado.emoji}</div>
                    <div className="text-sm font-medium">{estado.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nível de Cansaço */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Battery className="h-4 w-4" />
                Qual seu nível de energia/cansaço?
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {NIVEIS_CANSACO.map((nivel) => {
                  const Icon = nivel.icon;
                  return (
                    <button
                      key={nivel.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, nivelCansaco: nivel.value })}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.nivelCansaco === nivel.value
                          ? `${nivel.color} text-white border-transparent`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm font-medium">{nivel.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Qualidade do Sono */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <span className="text-xl">😴</span>
                Como foi a qualidade do seu sono na noite anterior? (opcional)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ESTADOS_EMOCIONAIS.map((estado) => (
                  <button
                    key={estado.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, qualidadeSono: estado.value })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.qualidadeSono === estado.value
                        ? `${estado.color} text-white border-transparent`
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-3xl mb-2">{estado.emoji}</div>
                    <div className="text-sm font-medium">{estado.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Atividade Física */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <span className="text-xl">🏋️</span>
                Fez atividade física hoje? (opcional)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, atividadeFisica: true })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.atividadeFisica === true
                      ? "bg-green-500 text-white border-transparent"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-sm font-medium">Sim</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, atividadeFisica: false })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.atividadeFisica === false
                      ? "bg-red-500 text-white border-transparent"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-3xl mb-2">❌</div>
                  <div className="text-sm font-medium">Não</div>
                </button>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observacoes">
                Observações (opcional)
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Alguma observação sobre o dia? O que te deixou assim?"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? "Salvando..." : "Salvar Registro"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Análise e Gráficos */}
      {registros.length > 0 && (
        <>
          {/* Alerta de Burnout */}
          {analise?.alertaBurnout && (
            <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  Alerta: Sinais de Esgotamento
                </CardTitle>
                <CardDescription className="text-orange-600 dark:text-orange-500">
                  Identificamos sinais de esgotamento nos seus registros recentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm">
                    Você registrou <strong>{analise.diasComBaixaEnergia}</strong> dia(s) com baixa energia
                    e <strong>{analise.diasComEstadoNegativo}</strong> dia(s) com estado emocional negativo.
                  </p>
                  <div className="p-3 bg-white dark:bg-gray-900 rounded-md">
                    <p className="text-sm font-medium mb-2">💡 Recomendações:</p>
                    <ul className="text-sm space-y-1 list-disc list-inside">
                      <li>Considere fazer uma pausa nos estudos</li>
                      <li>Converse com seu mentor sobre sua rotina</li>
                      <li>Priorize o descanso e atividades relaxantes</li>
                      <li>Procure apoio de amigos e familiares</li>
                      <li>Se necessário, busque ajuda profissional</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gráficos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolução Emocional
              </CardTitle>
              <CardDescription>
                Acompanhe como seu estado emocional e energia variam ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dadosGrafico.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="data" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 12 }}
                    />
                    <RechartsTooltip 
                      formatter={(value: any, name: string) => {
                        const labelsEstado = ['', 'Péssimo', 'Ruim', 'Neutro', 'Bom', 'Ótimo'];
                        const labelsEnergia = ['', 'Exausto', 'Muito Cansado', 'Cansado', 'Normal', 'Descansado'];
                        
                        if (name === 'Estado Emocional') {
                          return labelsEstado[value] || value;
                        } else if (name === 'Nível de Energia') {
                          return labelsEnergia[value] || value;
                        }
                        return value;
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="estadoEmocional" 
                      stroke="#3b82f6" 
                      name="Estado Emocional"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="nivelEnergia" 
                      stroke="#10b981" 
                      name="Nível de Energia"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Registre mais dias para ver os gráficos
                </p>
              )}
            </CardContent>
          </Card>

          {/* Gráfico de Distribuição */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Distribuição de Estados</CardTitle>
                  <CardDescription>
                    Quantidade de dias em cada estado emocional e nível de energia
                  </CardDescription>
                </div>
                <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                    <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                    <SelectItem value="3meses">Últimos 3 meses</SelectItem>
                    <SelectItem value="12meses">Últimos 12 meses</SelectItem>
                    <SelectItem value="todo">Tempo todo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Gráfico de Estados Emocionais */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Estado Emocional</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosDistribuicao.dadosEstados}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="quantidade" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Gráfico de Nível de Energia */}
                <div>
                  <h3 className="text-sm font-medium mb-4">Nível de Energia</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosDistribuicao.dadosCansaco}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="quantidade" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Gráfico de Qualidade do Sono */}
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <span className="text-xl">😴</span>
                    Qualidade do Sono
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosDistribuicao.dadosSono}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="quantidade" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Gráfico de Atividade Física */}
                <div>
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <span className="text-xl">🏋️</span>
                    Atividade Física
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={dadosDistribuicao.dadosAtividade}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nome" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="quantidade" radius={[8, 8, 0, 0]}>
                        {dadosDistribuicao.dadosAtividade.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Histórico de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Registros</CardTitle>
          <CardDescription>
            {registros.length > 0 
              ? `${registros.length} registro${registros.length > 1 ? 's' : ''} encontrado${registros.length > 1 ? 's' : ''}`
              : "Nenhum registro ainda"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registros.length > 0 ? (
            <div className="space-y-4">
              {registros.map((registro) => {
                const estado = getEstadoEmocional(registro.estadoEmocional);
                const cansaco = getNivelCansaco(registro.nivelCansaco);

                return (
                  <div
                    key={registro.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-medium text-muted-foreground">
                            {formatData(registro.data)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Estado Emocional */}
                          {estado && (
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg ${estado.color} flex items-center justify-center text-2xl`}>
                                {estado.emoji}
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Estado Emocional</div>
                                <div className="font-medium">{estado.label}</div>
                              </div>
                            </div>
                          )}

                          {/* Nível de Cansaço */}
                          {cansaco && (
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg ${cansaco.color} flex items-center justify-center`}>
                                <Battery className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Nível de Energia</div>
                                <div className="font-medium">{cansaco.label}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Qualidade do Sono */}
                          {registro.qualidadeSono && (
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg ${getEstadoEmocional(registro.qualidadeSono)?.color} flex items-center justify-center text-2xl`}>
                                😴
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Qualidade do Sono</div>
                                <div className="font-medium">{getEstadoEmocional(registro.qualidadeSono)?.label}</div>
                              </div>
                            </div>
                          )}
                          
                          {/* Atividade Física */}
                          {registro.atividadeFisica !== undefined && registro.atividadeFisica !== null && (
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-lg ${registro.atividadeFisica ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center text-2xl`}>
                                {registro.atividadeFisica ? '✅' : '❌'}
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Atividade Física</div>
                                <div className="font-medium">{registro.atividadeFisica ? 'Sim' : 'Não'}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Observações */}
                        {registro.observacoes && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <div className="text-xs text-muted-foreground mb-1">Observações:</div>
                            <div className="text-sm">{registro.observacoes}</div>
                          </div>
                        )}
                      </div>

                      {/* Botão Deletar */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(registro.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum registro ainda.</p>
              <p className="text-sm mt-2">Comece registrando como você se sente hoje!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

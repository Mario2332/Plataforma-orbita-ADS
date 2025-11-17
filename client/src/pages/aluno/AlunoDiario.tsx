import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAlunoApi } from "@/hooks/useAlunoApi";
import { Heart, Battery, Calendar, Trash2, TrendingUp, TrendingDown, Minus, BarChart3, AlertTriangle, BookHeart, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const ESTADOS_EMOCIONAIS = [
  { value: "otimo", label: "Ótimo", emoji: "😄", color: "bg-gradient-to-br from-blue-500 to-cyan-500" },
  { value: "bom", label: "Bom", emoji: "🙂", color: "bg-blue-500" },
  { value: "neutro", label: "Neutro", emoji: "😐", color: "bg-gray-500" },
  { value: "ruim", label: "Ruim", emoji: "😟", color: "bg-blue-400" },
  { value: "pessimo", label: "Péssimo", emoji: "😢", color: "bg-blue-300" },
];

const NIVEIS_CANSACO = [
  { value: "descansado", label: "Descansado", icon: Battery, color: "bg-gradient-to-br from-blue-500 to-cyan-500", level: 100 },
  { value: "normal", label: "Normal", icon: Battery, color: "bg-blue-500", level: 75 },
  { value: "cansado", label: "Cansado", icon: Battery, color: "bg-cyan-500", level: 50 },
  { value: "muito_cansado", label: "Muito Cansado", icon: Battery, color: "bg-sky-500", level: 25 },
  { value: "exausto", label: "Exausto", icon: Battery, color: "bg-indigo-500", level: 10 },
];

export default function AlunoDiario() {
  const api = useAlunoApi();
  const [registros, setRegistros] = useState<any[]>([]);
  const [estudos, setEstudos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [periodoFiltro, setPeriodoFiltro] = useState<string>("todo");
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
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getEstadoEmocional = (value: string) => ESTADOS_EMOCIONAIS.find(e => e.value === value);
  const getNivelCansaco = (value: string) => NIVEIS_CANSACO.find(n => n.value === value);

  const prepararDadosGrafico = () => {
    const dados = registros.map(registro => {
      const dataStr = formatData(registro.data);
      const estadoMap: any = { 'pessimo': 1, 'ruim': 2, 'neutro': 3, 'bom': 4, 'otimo': 5 };
      const cansacoMap: any = { 'exausto': 1, 'muito_cansado': 2, 'cansado': 3, 'normal': 4, 'descansado': 5 };
      return {
        data: dataStr,
        estadoEmocional: estadoMap[registro.estadoEmocional] || 3,
        nivelEnergia: cansacoMap[registro.nivelCansaco] || 3,
        qualidadeSono: registro.qualidadeSono ? estadoMap[registro.qualidadeSono] : null,
        atividadeFisica: registro.atividadeFisica !== undefined ? (registro.atividadeFisica ? 5 : 1) : null,
      };
    }).reverse();
    return dados;
  };

  const analisarCorrelacao = () => {
    if (registros.length === 0 || estudos.length === 0) return null;
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
        estudosPorData[dataStr] = { tempoTotal: 0, questoesFeitas: 0, questoesAcertadas: 0, count: 0 };
      }
      estudosPorData[dataStr].tempoTotal += estudo.tempoMinutos || 0;
      estudosPorData[dataStr].questoesFeitas += estudo.questoesFeitas || 0;
      estudosPorData[dataStr].questoesAcertadas += estudo.questoesAcertadas || 0;
      estudosPorData[dataStr].count++;
    });
    let diasComBaixaEnergia = 0;
    let diasComEstadoNegativo = 0;
    let alertaBurnout = false;
    registros.forEach(registro => {
      if (['exausto', 'muito_cansado'].includes(registro.nivelCansaco)) diasComBaixaEnergia++;
      if (['pessimo', 'ruim'].includes(registro.estadoEmocional)) diasComEstadoNegativo++;
    });
    const ultimosRegistros = registros.slice(0, 7);
    let consecutivosBaixaEnergia = 0;
    let estadosNegativosRecentes = 0;
    ultimosRegistros.forEach(registro => {
      if (['exausto', 'muito_cansado'].includes(registro.nivelCansaco)) {
        consecutivosBaixaEnergia++;
      } else {
        consecutivosBaixaEnergia = 0;
      }
      if (['pessimo', 'ruim'].includes(registro.estadoEmocional)) estadosNegativosRecentes++;
    });
    alertaBurnout = consecutivosBaixaEnergia >= 3 || estadosNegativosRecentes >= 5;
    return { diasComBaixaEnergia, diasComEstadoNegativo, alertaBurnout, totalRegistros: registros.length };
  };

  const filtrarPorPeriodo = () => {
    if (periodoFiltro === "todo") return registros;
    const agora = new Date();
    let dataLimite: Date;
    switch (periodoFiltro) {
      case "7dias": dataLimite = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000); break;
      case "30dias": dataLimite = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000); break;
      case "3meses": dataLimite = new Date(agora.getTime() - 90 * 24 * 60 * 60 * 1000); break;
      case "12meses": dataLimite = new Date(agora.getTime() - 365 * 24 * 60 * 60 * 1000); break;
      default: return registros;
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

  const prepararDadosDistribuicao = () => {
    const registrosFiltrados = filtrarPorPeriodo();
    const contagemEstados: any = {};
    ESTADOS_EMOCIONAIS.forEach(e => { contagemEstados[e.value] = 0; });
    const contagemCansaco: any = {};
    NIVEIS_CANSACO.forEach(n => { contagemCansaco[n.value] = 0; });
    const contagemSono: any = {};
    ESTADOS_EMOCIONAIS.forEach(e => { contagemSono[e.value] = 0; });
    let diasComAtividade = 0;
    let diasSemAtividade = 0;
    registrosFiltrados.forEach(registro => {
      if (registro.estadoEmocional) contagemEstados[registro.estadoEmocional] = (contagemEstados[registro.estadoEmocional] || 0) + 1;
      if (registro.nivelCansaco) contagemCansaco[registro.nivelCansaco] = (contagemCansaco[registro.nivelCansaco] || 0) + 1;
      if (registro.qualidadeSono) contagemSono[registro.qualidadeSono] = (contagemSono[registro.qualidadeSono] || 0) + 1;
      if (registro.atividadeFisica === true) diasComAtividade++;
      else if (registro.atividadeFisica === false) diasSemAtividade++;
    });
    const dadosEstados = ESTADOS_EMOCIONAIS.map(e => ({ nome: e.label, quantidade: contagemEstados[e.value] || 0, cor: e.color.replace('bg-', '').replace('gradient-to-br from-', '').replace(' to-cyan-500', '') }));
    const dadosCansaco = NIVEIS_CANSACO.map(n => ({ nome: n.label, quantidade: contagemCansaco[n.value] || 0, cor: n.color.replace('bg-', '').replace('gradient-to-br from-', '').replace(' to-cyan-500', '') }));
    const dadosSono = ESTADOS_EMOCIONAIS.map(e => ({ nome: e.label, quantidade: contagemSono[e.value] || 0, cor: e.color.replace('bg-', '').replace('gradient-to-br from-', '').replace(' to-cyan-500', '') }));
    const dadosAtividade = [
      { nome: 'Sim', quantidade: diasComAtividade, cor: 'blue-500' },
      { nome: 'Não', quantidade: diasSemAtividade, cor: 'gray-400' },
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
      const [ano, mes, dia] = formData.data.split('-').map(Number);
      const dataLocal = new Date(ano, mes - 1, dia, 12, 0, 0);
      await api.createDiarioEmocional({ ...formData, data: dataLocal.toISOString() });
      toast.success("Registro salvo com sucesso!");
      setFormData({ data: new Date().toISOString().split('T')[0], estadoEmocional: "", nivelCansaco: "", qualidadeSono: "", atividadeFisica: undefined, observacoes: "" });
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
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Zap className="h-8 w-8 text-blue-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      <div className="fixed top-20 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-float-delayed pointer-events-none" />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-cyan-500 to-sky-500 p-8 text-white animate-slide-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <BookHeart className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black mb-2">Diário de Bordo Emocional</h1>
            <p className="text-blue-50 text-lg">Registre como você se sentiu em relação aos estudos</p>
          </div>
        </div>
      </div>

      <Card className="border-2 hover:shadow-2xl transition-shadow rounded-2xl animate-slide-up">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">Novo Registro</CardTitle>
              <CardDescription className="text-base">Registre seu estado emocional e nível de energia do dia</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="data" className="flex items-center gap-2 font-bold">
                <Calendar className="h-4 w-4" />
                Data
              </Label>
              <Input id="data" type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} required className="border-2" />
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-bold">
                <Heart className="h-4 w-4" />
                Como você se sentiu hoje em relação aos estudos?
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ESTADOS_EMOCIONAIS.map((estado) => (
                  <button key={estado.value} type="button" onClick={() => setFormData({ ...formData, estadoEmocional: estado.value })} className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${formData.estadoEmocional === estado.value ? `${estado.color} text-white border-transparent shadow-lg` : "border-gray-200 hover:border-blue-300"}`}>
                    <div className="text-3xl mb-2">{estado.emoji}</div>
                    <div className="text-sm font-bold">{estado.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-bold">
                <Battery className="h-4 w-4" />
                Qual seu nível de energia/cansaço?
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {NIVEIS_CANSACO.map((nivel) => {
                  const Icon = nivel.icon;
                  return (
                    <button key={nivel.value} type="button" onClick={() => setFormData({ ...formData, nivelCansaco: nivel.value })} className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${formData.nivelCansaco === nivel.value ? `${nivel.color} text-white border-transparent shadow-lg` : "border-gray-200 hover:border-blue-300"}`}>
                      <Icon className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-sm font-bold">{nivel.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-bold">
                <span className="text-xl">😴</span>
                Como foi a qualidade do seu sono na noite anterior? (opcional)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {ESTADOS_EMOCIONAIS.map((estado) => (
                  <button key={estado.value} type="button" onClick={() => setFormData({ ...formData, qualidadeSono: estado.value })} className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${formData.qualidadeSono === estado.value ? `${estado.color} text-white border-transparent shadow-lg` : "border-gray-200 hover:border-blue-300"}`}>
                    <div className="text-3xl mb-2">{estado.emoji}</div>
                    <div className="text-sm font-bold">{estado.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2 font-bold">
                <span className="text-xl">🏋️</span>
                Fez atividade física hoje? (opcional)
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setFormData({ ...formData, atividadeFisica: true })} className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${formData.atividadeFisica === true ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-transparent shadow-lg" : "border-gray-200 hover:border-blue-300"}`}>
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-sm font-bold">Sim</div>
                </button>
                <button type="button" onClick={() => setFormData({ ...formData, atividadeFisica: false })} className={`p-4 rounded-xl border-2 transition-all hover:scale-105 ${formData.atividadeFisica === false ? "bg-gray-500 text-white border-transparent shadow-lg" : "border-gray-200 hover:border-blue-300"}`}>
                  <div className="text-3xl mb-2">❌</div>
                  <div className="text-sm font-bold">Não</div>
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacoes" className="font-bold">Observações (opcional)</Label>
              <Textarea id="observacoes" placeholder="Alguma observação sobre o dia? O que te deixou assim?" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} rows={3} className="border-2" />
            </div>
            <Button type="submit" disabled={isSaving} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 font-bold text-lg py-6">
              {isSaving ? "Salvando..." : "Salvar Registro"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {registros.length > 0 && (
        <>
          {analise?.alertaBurnout && (
            <Card className="border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-xl shadow-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-orange-700 dark:text-orange-400">Alerta: Sinais de Esgotamento</CardTitle>
                    <CardDescription className="text-base text-orange-600 dark:text-orange-500">Identificamos sinais de esgotamento nos seus registros recentes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Você registrou <strong>{analise.diasComBaixaEnergia}</strong> dia(s) com baixa energia e <strong>{analise.diasComEstadoNegativo}</strong> dia(s) com estado emocional negativo.</p>
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-orange-200">
                    <p className="text-sm font-black mb-3">💡 Recomendações:</p>
                    <ul className="text-sm space-y-2 list-disc list-inside font-semibold">
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

          <Card className="border-2 hover:shadow-2xl transition-shadow rounded-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black">Evolução Emocional</CardTitle>
                    <CardDescription className="text-base">Acompanhe suas emoções e energia ao longo do tempo</CardDescription>
                  </div>
                </div>
                <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
                  <SelectTrigger className="w-[180px] border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">Todo o período</SelectItem>
                    <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                    <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                    <SelectItem value="3meses">Últimos 3 meses</SelectItem>
                    <SelectItem value="12meses">Últimos 12 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h3 className="text-sm font-black mb-4">Linha do Tempo</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dadosGrafico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="data" stroke="#6b7280" />
                      <YAxis domain={[0, 5]} stroke="#6b7280" />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', fontWeight: 'bold' }} />
                      <Legend />
                      <Line type="monotone" dataKey="estadoEmocional" stroke="#3b82f6" strokeWidth={3} name="Estado Emocional" />
                      <Line type="monotone" dataKey="nivelEnergia" stroke="#06b6d4" strokeWidth={3} name="Nível de Energia" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-black mb-4">Estado Emocional</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dadosDistribuicao.dadosEstados}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="nome" stroke="#6b7280" />
                        <YAxis allowDecimals={false} stroke="#6b7280" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', fontWeight: 'bold' }} />
                        <Bar dataKey="quantidade" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-sm font-black mb-4">Nível de Energia</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dadosDistribuicao.dadosCansaco}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="nome" stroke="#6b7280" />
                        <YAxis allowDecimals={false} stroke="#6b7280" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', fontWeight: 'bold' }} />
                        <Bar dataKey="quantidade" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                      <span className="text-xl">😴</span>
                      Qualidade do Sono
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dadosDistribuicao.dadosSono}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="nome" stroke="#6b7280" />
                        <YAxis allowDecimals={false} stroke="#6b7280" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', fontWeight: 'bold' }} />
                        <Bar dataKey="quantidade" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                      <span className="text-xl">🏋️</span>
                      Atividade Física
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={dadosDistribuicao.dadosAtividade}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="nome" stroke="#6b7280" />
                        <YAxis allowDecimals={false} stroke="#6b7280" />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', fontWeight: 'bold' }} />
                        <Bar dataKey="quantidade" radius={[8, 8, 0, 0]}>
                          {dadosDistribuicao.dadosAtividade.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#9ca3af'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="border-2 hover:shadow-2xl transition-shadow rounded-2xl animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black">Histórico de Registros</CardTitle>
              <CardDescription className="text-base">
                {registros.length > 0 ? `${registros.length} registro${registros.length > 1 ? 's' : ''} encontrado${registros.length > 1 ? 's' : ''}` : "Nenhum registro ainda"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {registros.length > 0 ? (
            <div className="space-y-4">
              {registros.map((registro) => {
                const estado = getEstadoEmocional(registro.estadoEmocional);
                const cansaco = getNivelCansaco(registro.nivelCansaco);
                return (
                  <div key={registro.id} className="p-4 rounded-xl border-2 bg-card hover:shadow-lg transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-black text-muted-foreground">{formatData(registro.data)}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {estado && (
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl ${estado.color} flex items-center justify-center text-2xl shadow-lg`}>{estado.emoji}</div>
                              <div>
                                <div className="text-xs text-muted-foreground font-semibold">Estado Emocional</div>
                                <div className="font-black">{estado.label}</div>
                              </div>
                            </div>
                          )}
                          {cansaco && (
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl ${cansaco.color} flex items-center justify-center shadow-lg`}>
                                <Battery className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground font-semibold">Nível de Energia</div>
                                <div className="font-black">{cansaco.label}</div>
                              </div>
                            </div>
                          )}
                          {registro.qualidadeSono && (
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl ${getEstadoEmocional(registro.qualidadeSono)?.color} flex items-center justify-center text-2xl shadow-lg`}>😴</div>
                              <div>
                                <div className="text-xs text-muted-foreground font-semibold">Qualidade do Sono</div>
                                <div className="font-black">{getEstadoEmocional(registro.qualidadeSono)?.label}</div>
                              </div>
                            </div>
                          )}
                          {registro.atividadeFisica !== undefined && registro.atividadeFisica !== null && (
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl ${registro.atividadeFisica ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gray-500'} flex items-center justify-center text-2xl shadow-lg`}>
                                {registro.atividadeFisica ? '✅' : '❌'}
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground font-semibold">Atividade Física</div>
                                <div className="font-black">{registro.atividadeFisica ? 'Sim' : 'Não'}</div>
                              </div>
                            </div>
                          )}
                        </div>
                        {registro.observacoes && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border border-blue-200/50">
                            <div className="text-xs text-muted-foreground mb-1 font-bold">Observações:</div>
                            <div className="text-sm font-semibold">{registro.observacoes}</div>
                          </div>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(registro.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">Nenhum registro ainda.</p>
              <p className="text-sm text-muted-foreground mt-2">Comece registrando como você se sente hoje!</p>
            </div>
          )}
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

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { alunoApi } from "@/lib/api";
import { Plus, Trash2, FileText, BarChart3, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

// Motivos de erro
const MOTIVOS_ERRO = [
  { value: "interpretacao", label: "Interpretação", color: "#ef4444" },
  { value: "atencao", label: "Atenção", color: "#f59e0b" },
  { value: "lacuna_teorica", label: "Lacuna Teórica", color: "#3b82f6" },
  { value: "nao_estudado", label: "Não Estudado", color: "#8b5cf6" },
];

interface Questao {
  numeroQuestao: string;
  macroassunto: string;
  microassunto: string;
  motivoErro: string;
}

export default function AlunoAutodiagnostico() {
  const [autodiagnosticos, setAutodiagnosticos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Formulário
  const [prova, setProva] = useState("");
  const [questoes, setQuestoes] = useState<Questao[]>([
    { numeroQuestao: "", macroassunto: "", microassunto: "", motivoErro: "" }
  ]);

  useEffect(() => {
    loadAutodiagnosticos();
  }, []);

  const loadAutodiagnosticos = async () => {
    try {
      setIsLoading(true);
      const response = await alunoApi.getAutodiagnosticos();
      setAutodiagnosticos(response || []);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar autodiagnósticos");
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestao = () => {
    setQuestoes([...questoes, { numeroQuestao: "", macroassunto: "", microassunto: "", motivoErro: "" }]);
  };

  const removeQuestao = (index: number) => {
    if (questoes.length === 1) {
      toast.error("É necessário ter pelo menos uma questão");
      return;
    }
    setQuestoes(questoes.filter((_, i) => i !== index));
  };

  const updateQuestao = (index: number, field: keyof Questao, value: string) => {
    const novasQuestoes = [...questoes];
    novasQuestoes[index][field] = value;
    setQuestoes(novasQuestoes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prova.trim()) {
      toast.error("Informe o nome da prova");
      return;
    }

    // Validar questões
    const questoesValidas = questoes.filter(q => 
      q.numeroQuestao.trim() && q.macroassunto.trim() && q.microassunto.trim() && q.motivoErro
    );

    if (questoesValidas.length === 0) {
      toast.error("Adicione pelo menos uma questão completa");
      return;
    }

    try {
      setIsSaving(true);
      await alunoApi.createAutodiagnostico({
        prova: prova.trim(),
        questoes: questoesValidas
      });
      toast.success("Autodiagnóstico salvo com sucesso!");
      
      // Limpar formulário
      setProva("");
      setQuestoes([{ numeroQuestao: "", macroassunto: "", microassunto: "", motivoErro: "" }]);
      
      await loadAutodiagnosticos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar autodiagnóstico");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (autodiagnosticoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este autodiagnóstico?")) return;

    try {
      await alunoApi.deleteAutodiagnostico(autodiagnosticoId);
      toast.success("Autodiagnóstico excluído com sucesso!");
      await loadAutodiagnosticos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir autodiagnóstico");
    }
  };

  const getMotivoErro = (value: string) => {
    return MOTIVOS_ERRO.find(m => m.value === value);
  };

  // Preparar dados para o gráfico de distribuição
  const dadosDistribuicao = useMemo(() => {
    const contagem: Record<string, number> = {};
    
    MOTIVOS_ERRO.forEach(m => {
      contagem[m.value] = 0;
    });

    autodiagnosticos.forEach(auto => {
      auto.questoes?.forEach((q: Questao) => {
        if (q.motivoErro) {
          contagem[q.motivoErro] = (contagem[q.motivoErro] || 0) + 1;
        }
      });
    });

    return MOTIVOS_ERRO.map(m => ({
      nome: m.label,
      quantidade: contagem[m.value] || 0,
      cor: m.color
    }));
  }, [autodiagnosticos]);

  const totalErros = dadosDistribuicao.reduce((sum, d) => sum + d.quantidade, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando autodiagnósticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Novo Autodiagnóstico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Novo Autodiagnóstico
          </CardTitle>
          <CardDescription>
            Registre os erros de uma prova ou simulado para identificar padrões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nome da Prova */}
            <div className="space-y-2">
              <Label htmlFor="prova">Nome da Prova/Simulado *</Label>
              <Input
                id="prova"
                placeholder="Ex: ENEM 2022, ENEM 2023, Simulado FUVEST..."
                value={prova}
                onChange={(e) => setProva(e.target.value)}
                required
              />
            </div>

            {/* Questões Erradas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Questões Erradas</Label>
                <Button type="button" onClick={addQuestao} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Questão
                </Button>
              </div>

              <div className="space-y-4">
                {questoes.map((questao, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Questão {index + 1}</span>
                        {questoes.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeQuestao(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Número da Questão *</Label>
                          <Input
                            placeholder="Ex: 45, Q12..."
                            value={questao.numeroQuestao}
                            onChange={(e) => updateQuestao(index, "numeroQuestao", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Macroassunto *</Label>
                          <Input
                            placeholder="Ex: Ecologia, Termologia..."
                            value={questao.macroassunto}
                            onChange={(e) => updateQuestao(index, "macroassunto", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Microassunto *</Label>
                          <Input
                            placeholder="Ex: Relações ecológicas, Calorimetria..."
                            value={questao.microassunto}
                            onChange={(e) => updateQuestao(index, "microassunto", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Motivo do Erro *</Label>
                          <Select
                            value={questao.motivoErro}
                            onValueChange={(value) => updateQuestao(index, "motivoErro", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o motivo" />
                            </SelectTrigger>
                            <SelectContent>
                              {MOTIVOS_ERRO.map(motivo => (
                                <SelectItem key={motivo.value} value={motivo.value}>
                                  {motivo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? "Salvando..." : "Salvar Autodiagnóstico"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Gráfico de Distribuição */}
      {autodiagnosticos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição de Tipos de Erro
            </CardTitle>
            <CardDescription>
              Análise geral de {totalErros} erros registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalErros > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosDistribuicao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="quantidade" radius={[8, 8, 0, 0]}>
                    {dadosDistribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="h-5 w-5 mr-2" />
                Nenhum erro registrado ainda
              </div>
            )}

            {/* Insights */}
            {totalErros > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="font-medium text-sm">💡 Insights:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {dadosDistribuicao
                    .filter(d => d.quantidade > 0)
                    .sort((a, b) => b.quantidade - a.quantidade)
                    .map(d => {
                      const percentual = ((d.quantidade / totalErros) * 100).toFixed(1);
                      return (
                        <div key={d.nome} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.cor }}></div>
                          <span className="text-muted-foreground">
                            <strong>{d.nome}:</strong> {d.quantidade} ({percentual}%)
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Autodiagnósticos */}
      <Card>
        <CardHeader>
          <CardTitle>Autodiagnósticos Salvos</CardTitle>
          <CardDescription>
            {autodiagnosticos.length > 0
              ? `${autodiagnosticos.length} autodiagnóstico(s) registrado(s)`
              : "Nenhum autodiagnóstico registrado ainda"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {autodiagnosticos.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {autodiagnosticos.map((auto) => (
                <AccordionItem key={auto.id} value={auto.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <div className="font-medium">{auto.prova}</div>
                          <div className="text-sm text-muted-foreground">
                            {auto.totalQuestoes || auto.questoes?.length || 0} questão(ões) errada(s)
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {/* Tabela de Questões */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3">Questão</th>
                              <th className="text-left py-2 px-3">Macroassunto</th>
                              <th className="text-left py-2 px-3">Microassunto</th>
                              <th className="text-left py-2 px-3">Motivo do Erro</th>
                            </tr>
                          </thead>
                          <tbody>
                            {auto.questoes?.map((q: Questao, idx: number) => {
                              const motivo = getMotivoErro(q.motivoErro);
                              return (
                                <tr key={idx} className="border-b last:border-0">
                                  <td className="py-2 px-3">{q.numeroQuestao}</td>
                                  <td className="py-2 px-3">{q.macroassunto}</td>
                                  <td className="py-2 px-3">{q.microassunto}</td>
                                  <td className="py-2 px-3">
                                    <span 
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                                      style={{ backgroundColor: motivo?.color }}
                                    >
                                      {motivo?.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Botão de Excluir */}
                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() => handleDelete(auto.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir Autodiagnóstico
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum autodiagnóstico registrado</p>
              <p className="text-sm mt-2">Comece criando seu primeiro autodiagnóstico acima!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

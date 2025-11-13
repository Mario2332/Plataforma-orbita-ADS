import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { alunoApi } from "@/lib/api";
import { FileText, Plus, Trash2, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AlunoAutodiagnostico from "./AlunoAutodiagnostico";

type AreaFiltro = "geral" | "linguagens" | "humanas" | "natureza" | "matematica";

export default function AlunoSimulados() {
  const [activeTab, setActiveTab] = useState("simulados");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [simulados, setSimulados] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [areaFiltro, setAreaFiltro] = useState<AreaFiltro>("geral");

  const [formData, setFormData] = useState({
    nome: "",
    data: new Date().toISOString().split("T")[0],
    linguagensAcertos: 0,
    linguagensTempo: 0,
    humanasAcertos: 0,
    humanasTempo: 0,
    naturezaAcertos: 0,
    naturezaTempo: 0,
    matematicaAcertos: 0,
    matematicaTempo: 0,
    redacaoNota: 0,
    redacaoTempo: 0,
  });

  const loadSimulados = async () => {
    try {
      setIsLoading(true);
      const data = await alunoApi.getSimulados();
      setSimulados(data as any[]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar simulados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSimulados();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      
      // Criar data no timezone local (evita problema de um dia anterior)
      const [ano, mes, dia] = formData.data.split('-').map(Number);
      const dataLocal = new Date(ano, mes - 1, dia, 12, 0, 0); // Meio-dia para evitar problemas de timezone
      
      await alunoApi.createSimulado({
        ...formData,
        data: dataLocal,
      });
      toast.success("Simulado registrado!");
      setDialogOpen(false);
      await loadSimulados();
    } catch (error: any) {
      toast.error(error.message || "Erro ao registrar simulado");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este simulado?")) {
      try {
        await alunoApi.deleteSimulado(id);
        toast.success("Simulado excluído!");
        await loadSimulados();
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir simulado");
      }
    }
  };

  // Preparar dados para o gráfico de evolução
  const prepararDadosGrafico = () => {
    if (!simulados || simulados.length === 0) return [];
    
    return simulados
      .map(s => {
        // Converter data
        let data: Date;
        try {
          if (s.data?.seconds || s.data?._seconds) {
            const seconds = s.data.seconds || s.data._seconds;
            data = new Date(seconds * 1000);
          } else if (s.data?.toDate) {
            data = s.data.toDate();
          } else {
            data = new Date(s.data);
          }
        } catch {
          return null;
        }
        
        const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const total = s.linguagensAcertos + s.humanasAcertos + s.naturezaAcertos + s.matematicaAcertos;
        
        let valor: number;
        let label: string;
        let maxValor: number;
        
        switch (areaFiltro) {
          case "linguagens":
            valor = s.linguagensAcertos;
            label = "Linguagens";
            maxValor = 45;
            break;
          case "humanas":
            valor = s.humanasAcertos;
            label = "Humanas";
            maxValor = 45;
            break;
          case "natureza":
            valor = s.naturezaAcertos;
            label = "Natureza";
            maxValor = 45;
            break;
          case "matematica":
            valor = s.matematicaAcertos;
            label = "Matemática";
            maxValor = 45;
            break;
          default: // geral
            valor = total;
            label = "Geral";
            maxValor = 180;
        }
        
        return {
          data: dataFormatada,
          [label]: valor,
          nome: s.nome,
          maxValor,
        };
      })
      .filter(Boolean)
      .reverse(); // Mais antigo para mais recente
  };
  
  const dadosGrafico = prepararDadosGrafico();
  const labelGrafico = areaFiltro === "geral" ? "Geral" : 
                       areaFiltro === "linguagens" ? "Linguagens" :
                       areaFiltro === "humanas" ? "Humanas" :
                       areaFiltro === "natureza" ? "Natureza" : "Matemática";
  const maxValorGrafico = areaFiltro === "geral" ? 180 : 45;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Simulados</h1>
        <p className="text-muted-foreground mt-2">Registre e acompanhe seus simulados do ENEM</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="simulados">Simulados</TabsTrigger>
          <TabsTrigger value="autodiagnostico">Autodiagnóstico</TabsTrigger>
        </TabsList>

        <TabsContent value="simulados" className="space-y-6 mt-6">
          <div className="flex items-center justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Registrar Simulado</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Simulado</DialogTitle>
              <DialogDescription>Preencha os resultados do seu simulado</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Simulado</Label>
                    <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={formData.data} onChange={(e) => setFormData({...formData, data: e.target.value})} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Linguagens - Acertos</Label>
                    <Input type="number" value={formData.linguagensAcertos} onChange={(e) => setFormData({...formData, linguagensAcertos: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Linguagens - Tempo (min)</Label>
                    <Input type="number" value={formData.linguagensTempo} onChange={(e) => setFormData({...formData, linguagensTempo: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Humanas - Acertos</Label>
                    <Input type="number" value={formData.humanasAcertos} onChange={(e) => setFormData({...formData, humanasAcertos: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Humanas - Tempo (min)</Label>
                    <Input type="number" value={formData.humanasTempo} onChange={(e) => setFormData({...formData, humanasTempo: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Natureza - Acertos</Label>
                    <Input type="number" value={formData.naturezaAcertos} onChange={(e) => setFormData({...formData, naturezaAcertos: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Natureza - Tempo (min)</Label>
                    <Input type="number" value={formData.naturezaTempo} onChange={(e) => setFormData({...formData, naturezaTempo: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Matemática - Acertos</Label>
                    <Input type="number" value={formData.matematicaAcertos} onChange={(e) => setFormData({...formData, matematicaAcertos: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Matemática - Tempo (min)</Label>
                    <Input type="number" value={formData.matematicaTempo} onChange={(e) => setFormData({...formData, matematicaTempo: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Redação - Nota</Label>
                    <Input type="number" value={formData.redacaoNota} onChange={(e) => setFormData({...formData, redacaoNota: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Redação - Tempo (min)</Label>
                    <Input type="number" value={formData.redacaoTempo} onChange={(e) => setFormData({...formData, redacaoTempo: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gráfico de Evolução */}
      {simulados && simulados.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle>Evolução de Desempenho</CardTitle>
              </div>
              <Select value={areaFiltro} onValueChange={(value) => setAreaFiltro(value as AreaFiltro)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral (Todas)</SelectItem>
                  <SelectItem value="linguagens">Linguagens</SelectItem>
                  <SelectItem value="humanas">Humanas</SelectItem>
                  <SelectItem value="natureza">Natureza</SelectItem>
                  <SelectItem value="matematica">Matemática</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardDescription>
              Acompanhe sua evolução ao longo dos simulados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="data" 
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  domain={[0, maxValorGrafico]}
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Acertos', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{payload[0].payload.nome}</p>
                          <p className="text-sm text-muted-foreground">{payload[0].payload.data}</p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            {labelGrafico}: {payload[0].value}/{payload[0].payload.maxValor} acertos
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={labelGrafico} 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Simulados</CardTitle>
          <CardDescription>Todos os simulados registrados</CardDescription>
        </CardHeader>
        <CardContent>
          {simulados && simulados.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Linguagens</TableHead>
                    <TableHead>Humanas</TableHead>
                    <TableHead>Natureza</TableHead>
                    <TableHead>Matemática</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Redação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simulados.map((s) => {
                    const total = s.linguagensAcertos + s.humanasAcertos + s.naturezaAcertos + s.matematicaAcertos;
                    
                    // Converter data do Firestore
                    let dataFormatada = 'Data inválida';
                    try {
                      let data: Date;
                      if (s.data?.seconds || s.data?._seconds) {
                        const seconds = s.data.seconds || s.data._seconds;
                        data = new Date(seconds * 1000);
                      } else if (s.data?.toDate) {
                        data = s.data.toDate();
                      } else {
                        data = new Date(s.data);
                      }
                      dataFormatada = !isNaN(data.getTime()) ? data.toLocaleDateString('pt-BR') : 'Data inválida';
                    } catch (error) {
                      console.error('Erro ao converter data do simulado:', error);
                    }
                    
                    return (
                      <TableRow key={s.id}>
                        <TableCell>{dataFormatada}</TableCell>
                        <TableCell className="font-medium">{s.nome}</TableCell>
                        <TableCell>{s.linguagensAcertos}/45</TableCell>
                        <TableCell>{s.humanasAcertos}/45</TableCell>
                        <TableCell>{s.naturezaAcertos}/45</TableCell>
                        <TableCell>{s.matematicaAcertos}/45</TableCell>
                        <TableCell className="font-bold">{total}/180</TableCell>
                        <TableCell>{s.redacaoNota}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} disabled={isSaving}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum simulado registrado ainda.</p>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="autodiagnostico" className="mt-6">
          <AlunoAutodiagnostico />
        </TabsContent>
      </Tabs>
    </div>
  );
}

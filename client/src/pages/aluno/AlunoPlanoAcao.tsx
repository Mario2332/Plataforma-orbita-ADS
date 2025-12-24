import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Zap, 
  Target, 
  BookOpen, 
  AlertTriangle,
  ChevronDown,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import {
  getPlanosAcaoDirect,
  createPlanoAcaoDirect,
  resolverPlanoAcaoDirect,
  reabrirPlanoAcaoDirect,
  gerarConduta,
  type PlanoAcao
} from "@/lib/firestore-direct";

export default function AlunoPlanoAcao() {
  const [planos, setPlanos] = useState<PlanoAcao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    prova: "",
    macroassunto: "",
    microassunto: "",
    motivoErro: "" as "interpretacao" | "lacuna_teorica" | "",
    quantidadeErros: 1
  });

  useEffect(() => {
    loadPlanos();
  }, []);

  const loadPlanos = async () => {
    try {
      setIsLoading(true);
      const data = await getPlanosAcaoDirect();
      setPlanos(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar planos de ação");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      prova: "",
      macroassunto: "",
      microassunto: "",
      motivoErro: "",
      quantidadeErros: 1
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.prova.trim() || !formData.macroassunto.trim() || 
        !formData.microassunto.trim() || !formData.motivoErro) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setIsSaving(true);
      const motivoErro = formData.motivoErro as "interpretacao" | "lacuna_teorica";
      
      await createPlanoAcaoDirect({
        prova: formData.prova,
        macroassunto: formData.macroassunto,
        microassunto: formData.microassunto,
        motivoErro,
        quantidadeErros: formData.quantidadeErros,
        conduta: gerarConduta(motivoErro, formData.quantidadeErros),
        resolvido: false,
        criadoManualmente: true
      });
      
      toast.success("Plano de ação adicionado!");
      setDialogOpen(false);
      resetForm();
      await loadPlanos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar plano de ação");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResolver = async (planoId: string) => {
    try {
      await resolverPlanoAcaoDirect(planoId);
      toast.success("Pendência marcada como resolvida!");
      await loadPlanos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao resolver pendência");
    }
  };

  const handleReabrir = async (planoId: string) => {
    try {
      await reabrirPlanoAcaoDirect(planoId);
      toast.success("Pendência reaberta!");
      await loadPlanos();
    } catch (error: any) {
      toast.error(error.message || "Erro ao reabrir pendência");
    }
  };

  // Separar planos por status
  const planosPendentes = planos.filter(p => !p.resolvido);
  const planosResolvidos = planos.filter(p => p.resolvido);

  // Agrupar planos pendentes por prova
  const planosPorProva: Record<string, PlanoAcao[]> = {};
  planosPendentes.forEach(plano => {
    if (!planosPorProva[plano.prova]) {
      planosPorProva[plano.prova] = [];
    }
    planosPorProva[plano.prova].push(plano);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-emerald-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Zap className="h-5 w-5 text-emerald-500 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de adicionar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Planos de Ação
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gerencie suas pendências de estudo baseadas nos autodiagnósticos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow">
              <Plus className="mr-2 h-4 w-4" />
              Nova Pendência
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Nova Pendência</DialogTitle>
              <DialogDescription>
                Adicione manualmente uma pendência de estudo
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="prova" className="font-semibold">Prova / Origem *</Label>
                <Input
                  id="prova"
                  value={formData.prova}
                  onChange={(e) => setFormData({ ...formData, prova: e.target.value })}
                  placeholder="Ex: ENEM 2024, Simulado Abril"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="macroassunto" className="font-semibold">Macroassunto *</Label>
                <Input
                  id="macroassunto"
                  value={formData.macroassunto}
                  onChange={(e) => setFormData({ ...formData, macroassunto: e.target.value })}
                  placeholder="Ex: Física, História do Brasil"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="microassunto" className="font-semibold">Microassunto *</Label>
                <Input
                  id="microassunto"
                  value={formData.microassunto}
                  onChange={(e) => setFormData({ ...formData, microassunto: e.target.value })}
                  placeholder="Ex: Cinemática, Era Vargas"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="motivoErro" className="font-semibold">Motivo do Erro *</Label>
                <Select
                  value={formData.motivoErro}
                  onValueChange={(value) => setFormData({ ...formData, motivoErro: value as "interpretacao" | "lacuna_teorica" })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interpretacao">Interpretação</SelectItem>
                    <SelectItem value="lacuna_teorica">Lacuna Teórica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantidadeErros" className="font-semibold">Quantidade de Erros</Label>
                <Input
                  id="quantidadeErros"
                  type="number"
                  min={1}
                  value={formData.quantidadeErros}
                  onChange={(e) => setFormData({ ...formData, quantidadeErros: parseInt(e.target.value) || 1 })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  3+ erros dobram a quantidade de questões recomendadas
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 mx-auto text-orange-500 mb-2" />
            <p className="text-2xl font-bold text-orange-600">{planosPendentes.length}</p>
            <p className="text-sm text-orange-700 dark:text-orange-300">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-2" />
            <p className="text-2xl font-bold text-green-600">{planosResolvidos.length}</p>
            <p className="text-sm text-green-700 dark:text-green-300">Resolvidas</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-4 text-center">
            <BookOpen className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
            <p className="text-2xl font-bold text-emerald-600">
              {planosPendentes.filter(p => p.motivoErro === "interpretacao").length}
            </p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">Interpretação</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
          <CardContent className="p-4 text-center">
            <Target className="h-5 w-5 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-purple-600">
              {planosPendentes.filter(p => p.motivoErro === "lacuna_teorica").length}
            </p>
            <p className="text-sm text-purple-700 dark:text-purple-300">Lacuna Teórica</p>
          </CardContent>
        </Card>
      </div>

      {/* Pendências por Prova */}
      {Object.keys(planosPorProva).length > 0 ? (
        <Accordion type="multiple" defaultValue={Object.keys(planosPorProva)} className="space-y-4">
          {Object.entries(planosPorProva).map(([prova, planosProva]) => (
            <AccordionItem 
              key={prova} 
              value={prova}
              className="border-2 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
            >
              <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-bold">{prova}</h4>
                    <p className="text-sm text-gray-500">
                      {planosProva.length} pendência{planosProva.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 mt-2">
                  {planosProva.map((plano) => (
                    <div
                      key={plano.id}
                      className="flex items-start gap-4 p-4 rounded-xl border-2 bg-gray-50 dark:bg-gray-800 hover:shadow-md transition-shadow"
                    >
                      <button
                        onClick={() => plano.id && handleResolver(plano.id)}
                        className="mt-1 flex-shrink-0"
                      >
                        <Circle className="h-4 w-4 text-gray-400 hover:text-green-500 transition-colors" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {plano.microassunto}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={plano.motivoErro === "interpretacao" 
                              ? "bg-emerald-100 text-emerald-700 border-emerald-300" 
                              : "bg-purple-100 text-purple-700 border-purple-300"
                            }
                          >
                            {plano.motivoErro === "interpretacao" ? "Interpretação" : "Lacuna Teórica"}
                          </Badge>
                          {plano.quantidadeErros >= 3 && (
                            <Badge variant="destructive" className="text-xs">
                              {plano.quantidadeErros}x erros
                            </Badge>
                          )}
                          {plano.criadoManualmente && (
                            <Badge variant="secondary" className="text-xs">
                              Manual
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {plano.macroassunto}
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 bg-white dark:bg-gray-700 p-2 rounded-lg border">
                          <strong>Conduta:</strong> {plano.conduta}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <Target className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-500 mb-2">
              Nenhuma pendência encontrada
            </h3>
            <p className="text-gray-400 mb-4">
              As pendências são geradas automaticamente quando você registra um autodiagnóstico
              com erros por interpretação ou lacuna teórica.
            </p>
            <Button variant="outline" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar manualmente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pendências Resolvidas */}
      {planosResolvidos.length > 0 && (
        <Card className="border-2 mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Pendências Resolvidas</CardTitle>
                <CardDescription>
                  {planosResolvidos.length} item{planosResolvidos.length !== 1 ? 's' : ''} concluído{planosResolvidos.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {planosResolvidos.map((plano) => (
                <div
                  key={plano.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                >
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-green-800 dark:text-green-200 line-through">
                      {plano.microassunto}
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                      ({plano.prova})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => plano.id && handleReabrir(plano.id)}
                    className="text-gray-500 hover:text-orange-500"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

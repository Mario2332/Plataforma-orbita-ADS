import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { trpc } from "@/lib/trpc"; // TODO: Implementar com alunoApi
import { FileText, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AlunoSimulados() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: simulados, isLoading, refetch } = trpc.aluno.getSimulados.useQuery();

  const createMutation = trpc.aluno.createSimulado.useMutation({
    onSuccess: () => {
      toast.success("Simulado registrado!");
      refetch();
      setDialogOpen(false);
    },
  });

  const deleteMutation = trpc.aluno.deleteSimulado.useMutation({
    onSuccess: () => {
      toast.success("Simulado excluído!");
      refetch();
    },
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...formData,
      data: new Date(formData.data),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Simulados</h1>
          <p className="text-muted-foreground mt-2">Registre e acompanhe seus simulados do ENEM</p>
        </div>
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                    return (
                      <TableRow key={s.id}>
                        <TableCell>{new Date(s.data).toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell className="font-medium">{s.nome}</TableCell>
                        <TableCell>{s.linguagensAcertos}/45</TableCell>
                        <TableCell>{s.humanasAcertos}/45</TableCell>
                        <TableCell>{s.naturezaAcertos}/45</TableCell>
                        <TableCell>{s.matematicaAcertos}/45</TableCell>
                        <TableCell className="font-bold">{total}/180</TableCell>
                        <TableCell>{s.redacaoNota}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({id: s.id})}>
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
    </div>
  );
}

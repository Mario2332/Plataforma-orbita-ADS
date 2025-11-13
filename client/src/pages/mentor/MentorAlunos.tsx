import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { mentorApi } from "@/lib/api";
import { Plus, Users, ArrowUpDown, Edit, Trash2, Search, TrendingUp, Eye } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function MentorAlunos() {
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [evolucao, setEvolucao] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [periodoFiltro, setPeriodoFiltro] = useState("todo");
  const [selectedAluno, setSelectedAluno] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    celular: "",
    plano: "",
  });
  const [editFormData, setEditFormData] = useState({
    nome: "",
    email: "",
    celular: "",
    plano: "",
    ativo: true,
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [alunosData, metricasData, evolucaoData] = await Promise.all([
        mentorApi.getAlunos(),
        mentorApi.getAlunosMetricas(),
        mentorApi.getEvolucaoAlunos(),
      ]);
      setAlunos(alunosData as any[]);
      setMetricas(metricasData as any[]);
      setEvolucao(evolucaoData as any[]);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSaving(true);
      await mentorApi.createAluno(formData);
      toast.success("Aluno adicionado!");
      setDialogOpen(false);
      setFormData({
        nome: "",
        email: "",
        celular: "",
        plano: "",
      });
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar aluno");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleOpenEditDialog = (aluno: any) => {
    setSelectedAluno(aluno);
    setEditFormData({
      nome: aluno.nome || "",
      email: aluno.email || "",
      celular: aluno.celular || "",
      plano: aluno.plano || "",
      ativo: aluno.ativo !== false,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAluno) return;
    
    try {
      setIsSaving(true);
      await mentorApi.updateAluno({
        alunoId: selectedAluno.id,
        ...editFormData,
      });
      toast.success("Aluno atualizado!");
      setEditDialogOpen(false);
      setSelectedAluno(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar aluno");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenDeleteDialog = (aluno: any) => {
    setSelectedAluno(aluno);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAluno) return;
    
    try {
      setIsDeleting(true);
      await mentorApi.deleteAluno(selectedAluno.id);
      toast.success("Aluno excluído!");
      setDeleteDialogOpen(false);
      setSelectedAluno(null);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir aluno");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrar evolução por período
  const evolucaoFiltrada = useMemo(() => {
    if (!evolucao || evolucao.length === 0) return [];
    
    const hoje = new Date();
    let dataLimite: Date;
    
    switch (periodoFiltro) {
      case "7d":
        dataLimite = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        dataLimite = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3m":
        dataLimite = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "6m":
        dataLimite = new Date(hoje.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case "12m":
        dataLimite = new Date(hoje.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "24m":
        dataLimite = new Date(hoje.getTime() - 730 * 24 * 60 * 60 * 1000);
        break;
      default:
        return evolucao.map(e => ({
          ...e,
          dataFormatada: new Date(e.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
        }));
    }
    
    return evolucao
      .filter(e => new Date(e.data) >= dataLimite)
      .map(e => ({
        ...e,
        dataFormatada: new Date(e.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      }));
  }, [evolucao, periodoFiltro]);

  // Filtrar e ordenar alunos com métricas
  const filteredAndSortedAlunos = useMemo(() => {
    let result = alunos.map(aluno => {
      const metrica = metricas.find(m => m.alunoId === aluno.id);
      return {
        ...aluno,
        questoesFeitas: metrica?.questoesFeitas || 0,
        desempenho: metrica?.desempenho || 0,
        horasEstudo: metrica?.horasEstudo || 0,
      };
    });
    
    // Filtrar por nome
    if (searchTerm) {
      result = result.filter(aluno => 
        aluno.nome?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Ordenar
    if (sortColumn) {
      result.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];
        
        // Tratar valores nulos
        if (aVal === null || aVal === undefined) aVal = sortColumn === 'nome' || sortColumn === 'email' ? "" : 0;
        if (bVal === null || bVal === undefined) bVal = sortColumn === 'nome' || sortColumn === 'email' ? "" : 0;
        
        // Comparar
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    return result;
  }, [alunos, metricas, searchTerm, sortColumn, sortDirection]);

  const alunosAtivos = alunos.filter(a => a.ativo !== false).length;

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alunos</h1>
          <p className="text-muted-foreground mt-2">Gerencie e acompanhe seus alunos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Adicionar Aluno</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Aluno</DialogTitle>
              <DialogDescription>Preencha os dados do aluno</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Celular</Label>
                  <Input value={formData.celular} onChange={(e) => setFormData({...formData, celular: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Input value={formData.plano} onChange={(e) => setFormData({...formData, plano: e.target.value})} />
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

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alunos.length}</div>
            <p className="text-xs text-muted-foreground">{alunosAtivos} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evolucao.length > 0 ? `+${evolucao.length}` : "0"}
            </div>
            <p className="text-xs text-muted-foreground">Alunos cadastrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Evolução de Alunos</CardTitle>
              <CardDescription>Crescimento ao longo do tempo</CardDescription>
            </div>
            <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Todo o período</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
                <SelectItem value="24m">Últimos 24 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {evolucaoFiltrada.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolucaoFiltrada}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dataFormatada" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-background border rounded-lg p-2 shadow-lg">
                          <p className="text-sm font-medium">{payload[0].payload.data}</p>
                          <p className="text-sm text-muted-foreground">
                            Total: {payload[0].value} alunos
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum dado disponível para o período selecionado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Campo de Pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar aluno por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela de Alunos */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <CardDescription>Todos os alunos cadastrados com suas métricas</CardDescription>
        </CardHeader>
        <CardContent>
          {alunos && alunos.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('nome')} className="h-8 px-2">
                        Nome
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('email')} className="h-8 px-2">
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('questoesFeitas')} className="h-8 px-2">
                        Questões
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('desempenho')} className="h-8 px-2">
                        Desempenho
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button variant="ghost" size="sm" onClick={() => handleSort('horasEstudo')} className="h-8 px-2">
                        Horas de Estudo
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedAlunos.map((aluno) => (
                    <TableRow key={aluno.id}>
                      <TableCell className="font-medium">{aluno.nome}</TableCell>
                      <TableCell>{aluno.email}</TableCell>
                      <TableCell>{aluno.questoesFeitas}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          aluno.desempenho >= 80 ? 'text-green-600' :
                          aluno.desempenho >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {aluno.desempenho}%
                        </span>
                      </TableCell>
                      <TableCell>{aluno.horasEstudo}h</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${aluno.ativo !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {aluno.ativo !== false ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLocation(`/mentor/alunos/${aluno.id}`)}
                            title="Ver como aluno"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(aluno)}
                            title="Editar aluno"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDeleteDialog(aluno)}
                            title="Excluir aluno"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum aluno cadastrado ainda
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
            <DialogDescription>Atualize os dados do aluno</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input 
                  value={editFormData.nome} 
                  onChange={(e) => setEditFormData({...editFormData, nome: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  type="email" 
                  value={editFormData.email} 
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Celular</Label>
                <Input 
                  value={editFormData.celular} 
                  onChange={(e) => setEditFormData({...editFormData, celular: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Input 
                  value={editFormData.plano} 
                  onChange={(e) => setEditFormData({...editFormData, plano: e.target.value})} 
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="ativo" 
                  checked={editFormData.ativo}
                  onCheckedChange={(checked) => setEditFormData({...editFormData, ativo: checked as boolean})}
                />
                <label
                  htmlFor="ativo"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Aluno ativo
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O aluno <strong>{selectedAluno?.nome}</strong> será excluído permanentemente, incluindo todos os seus dados de estudos, simulados e métricas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Brain, 
  Settings, 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  Loader2,
  AlertTriangle,
  Shield,
  HelpCircle,
  RefreshCw,
  Eye,
  ChevronUp,
  ChevronDown,
  GripVertical
} from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { PERGUNTAS_PADRAO, PERFIS_PADRAO, Pergunta, PerfilDefinicao } from "@/components/DiagnosticoPerfil";

// Interface para aluno com perfil
interface AlunoComPerfil {
  id: string;
  nome: string;
  email: string;
  perfilEstudante?: string;
  perfilAtualizadoEm?: Date;
}

export default function MentorDiagnosticoPerfil() {
  const [activeTab, setActiveTab] = useState("perguntas");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para perguntas
  const [perguntas, setPerguntas] = useState<Pergunta[]>(PERGUNTAS_PADRAO);
  const [editingPergunta, setEditingPergunta] = useState<Pergunta | null>(null);
  const [perguntaDialogOpen, setPerguntaDialogOpen] = useState(false);
  const [deletePerguntaDialogOpen, setDeletePerguntaDialogOpen] = useState(false);
  const [perguntaToDelete, setPerguntaToDelete] = useState<Pergunta | null>(null);
  
  // Estados para perfis
  const [perfis, setPerfis] = useState<Record<string, PerfilDefinicao>>(PERFIS_PADRAO);
  const [editingPerfil, setEditingPerfil] = useState<PerfilDefinicao | null>(null);
  const [perfilDialogOpen, setPerfilDialogOpen] = useState(false);
  const [deletePerfilDialogOpen, setDeletePerfilDialogOpen] = useState(false);
  const [perfilToDelete, setPerfilToDelete] = useState<string | null>(null);
  
  // Estados para alunos
  const [alunos, setAlunos] = useState<AlunoComPerfil[]>([]);
  const [alunoPerfilDialogOpen, setAlunoPerfilDialogOpen] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState<AlunoComPerfil | null>(null);

  // Carregar dados do Firebase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Carregar perguntas customizadas
      const perguntasRef = doc(db, "configuracoes", "diagnostico_perguntas");
      const perguntasSnap = await getDoc(perguntasRef);
      if (perguntasSnap.exists() && perguntasSnap.data()?.perguntas) {
        setPerguntas(perguntasSnap.data().perguntas);
      }

      // Carregar perfis customizados
      const perfisRef = doc(db, "configuracoes", "diagnostico_perfis");
      const perfisSnap = await getDoc(perfisRef);
      if (perfisSnap.exists() && perfisSnap.data()?.perfis) {
        setPerfis(perfisSnap.data().perfis);
      }

      // Carregar alunos com seus perfis
      const alunosRef = collection(db, "alunos");
      const alunosSnap = await getDocs(alunosRef);
      const alunosData: AlunoComPerfil[] = [];
      
      for (const docSnap of alunosSnap.docs) {
        const data = docSnap.data();
        // Buscar dados do usuário
        const userRef = doc(db, "users", docSnap.id);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        
        if (userData) {
          alunosData.push({
            id: docSnap.id,
            nome: userData.name || "Sem nome",
            email: userData.email || "",
            perfilEstudante: data.perfilEstudante,
            perfilAtualizadoEm: data.perfilAtualizadoEm?.toDate()
          });
        }
      }
      
      setAlunos(alunosData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados do diagnóstico");
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar perguntas
  const salvarPerguntas = async () => {
    setIsSaving(true);
    try {
      const perguntasRef = doc(db, "configuracoes", "diagnostico_perguntas");
      await setDoc(perguntasRef, {
        perguntas,
        atualizadoEm: Timestamp.now()
      });
      toast.success("Perguntas salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perguntas:", error);
      toast.error("Erro ao salvar perguntas");
    } finally {
      setIsSaving(false);
    }
  };

  // Salvar perfis
  const salvarPerfis = async () => {
    setIsSaving(true);
    try {
      const perfisRef = doc(db, "configuracoes", "diagnostico_perfis");
      await setDoc(perfisRef, {
        perfis,
        atualizadoEm: Timestamp.now()
      });
      toast.success("Perfis salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar perfis:", error);
      toast.error("Erro ao salvar perfis");
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers de perguntas
  const handleAddPergunta = () => {
    const maxId = Math.max(...perguntas.map(p => p.id), 0);
    setEditingPergunta({
      id: maxId + 1,
      category: 'A',
      text: ""
    });
    setPerguntaDialogOpen(true);
  };

  const handleEditPergunta = (pergunta: Pergunta) => {
    setEditingPergunta({ ...pergunta });
    setPerguntaDialogOpen(true);
  };

  const handleSavePergunta = () => {
    if (!editingPergunta || !editingPergunta.text.trim()) {
      toast.error("O texto da pergunta é obrigatório");
      return;
    }

    const existingIndex = perguntas.findIndex(p => p.id === editingPergunta.id);
    if (existingIndex >= 0) {
      const updated = [...perguntas];
      updated[existingIndex] = editingPergunta;
      setPerguntas(updated);
    } else {
      setPerguntas([...perguntas, editingPergunta]);
    }
    
    setPerguntaDialogOpen(false);
    setEditingPergunta(null);
  };

  const handleDeletePergunta = (pergunta: Pergunta) => {
    setPerguntaToDelete(pergunta);
    setDeletePerguntaDialogOpen(true);
  };

  const confirmDeletePergunta = () => {
    if (perguntaToDelete) {
      setPerguntas(perguntas.filter(p => p.id !== perguntaToDelete.id));
      setDeletePerguntaDialogOpen(false);
      setPerguntaToDelete(null);
    }
  };

  const movePergunta = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= perguntas.length) return;
    
    const updated = [...perguntas];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setPerguntas(updated);
  };

  // Handlers de perfis
  const handleAddPerfil = () => {
    const newId = `PROFILE_${Object.keys(perfis).length + 1}_NOVO`;
    setEditingPerfil({
      id: newId,
      nome: "",
      subtitulo: "",
      icon: "❓",
      cor: "gray",
      corGradient: "from-gray-500 to-slate-500",
      perigo: "",
      solucao: ""
    });
    setPerfilDialogOpen(true);
  };

  const handleEditPerfil = (perfilId: string) => {
    setEditingPerfil({ ...perfis[perfilId] });
    setPerfilDialogOpen(true);
  };

  const handleSavePerfil = () => {
    if (!editingPerfil || !editingPerfil.nome.trim()) {
      toast.error("O nome do perfil é obrigatório");
      return;
    }

    setPerfis({
      ...perfis,
      [editingPerfil.id]: editingPerfil
    });
    
    setPerfilDialogOpen(false);
    setEditingPerfil(null);
  };

  const handleDeletePerfil = (perfilId: string) => {
    setPerfilToDelete(perfilId);
    setDeletePerfilDialogOpen(true);
  };

  const confirmDeletePerfil = () => {
    if (perfilToDelete) {
      const updated = { ...perfis };
      delete updated[perfilToDelete];
      setPerfis(updated);
      setDeletePerfilDialogOpen(false);
      setPerfilToDelete(null);
    }
  };

  // Visualizar perfil do aluno
  const handleViewAlunoPerfil = (aluno: AlunoComPerfil) => {
    setSelectedAluno(aluno);
    setAlunoPerfilDialogOpen(true);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'A': return 'Ansiedade';
      case 'B': return 'Aprendizado';
      case 'C': return 'Performance';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'A': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'B': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'C': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black">Diagnóstico de Perfil</h1>
            <p className="text-muted-foreground">Gerencie perguntas, perfis e visualize os resultados dos alunos</p>
          </div>
        </div>
        <Button onClick={loadData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perguntas" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            Perguntas
          </TabsTrigger>
          <TabsTrigger value="perfis" className="gap-2">
            <Settings className="h-4 w-4" />
            Perfis
          </TabsTrigger>
          <TabsTrigger value="alunos" className="gap-2">
            <Users className="h-4 w-4" />
            Alunos
          </TabsTrigger>
        </TabsList>

        {/* Tab Perguntas */}
        <TabsContent value="perguntas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Perguntas do Questionário</CardTitle>
                <CardDescription>
                  Configure as perguntas do diagnóstico de perfil. Cada pergunta pertence a uma categoria (A = Ansiedade, B = Aprendizado, C = Performance).
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPergunta} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
                <Button onClick={salvarPerguntas} disabled={isSaving} className="gap-2 bg-green-600 hover:bg-green-700">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead className="w-24">Categoria</TableHead>
                    <TableHead>Pergunta</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perguntas.map((pergunta, index) => (
                    <TableRow key={pergunta.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(pergunta.category)}>
                          {getCategoryLabel(pergunta.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{pergunta.text}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => movePergunta(index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => movePergunta(index, 'down')}
                            disabled={index === perguntas.length - 1}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPergunta(pergunta)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePergunta(pergunta)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Perfis */}
        <TabsContent value="perfis" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Perfis de Estudante</CardTitle>
                <CardDescription>
                  Configure os perfis e as mensagens que serão exibidas para cada tipo de estudante.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddPerfil} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Perfil
                </Button>
                <Button onClick={salvarPerfis} disabled={isSaving} className="gap-2 bg-green-600 hover:bg-green-700">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(perfis).map(([id, perfil]) => (
                  <Card key={id} className="border-2 hover:shadow-lg transition-shadow">
                    <CardHeader className={`bg-gradient-to-r ${perfil.corGradient} text-white rounded-t-lg`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{perfil.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{perfil.nome}</CardTitle>
                            <CardDescription className="text-white/80 text-sm">
                              {perfil.subtitulo.substring(0, 50)}...
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPerfil(id)}
                            className="text-white hover:bg-white/20"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePerfil(id)}
                            className="text-white hover:bg-red-500/50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Onde mora o perigo
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{perfil.perigo}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                          <Shield className="h-3 w-3" /> Como resolver
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{perfil.solucao}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Alunos */}
        <TabsContent value="alunos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Perfis dos Alunos</CardTitle>
              <CardDescription>
                Visualize o perfil de cada aluno que realizou o diagnóstico.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Data do Diagnóstico</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alunos.map((aluno) => {
                    const perfilInfo = aluno.perfilEstudante ? perfis[aluno.perfilEstudante] : null;
                    return (
                      <TableRow key={aluno.id}>
                        <TableCell className="font-medium">{aluno.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{aluno.email}</TableCell>
                        <TableCell>
                          {perfilInfo ? (
                            <Badge className={`bg-gradient-to-r ${perfilInfo.corGradient} text-white`}>
                              {perfilInfo.icon} {perfilInfo.nome}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              <HelpCircle className="h-3 w-3 mr-1" />
                              Não realizado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {aluno.perfilAtualizadoEm 
                            ? aluno.perfilAtualizadoEm.toLocaleDateString('pt-BR')
                            : "-"
                          }
                        </TableCell>
                        <TableCell>
                          {perfilInfo && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewAlunoPerfil(aluno)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {alunos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum aluno encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog para editar pergunta */}
      <Dialog open={perguntaDialogOpen} onOpenChange={setPerguntaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPergunta && perguntas.find(p => p.id === editingPergunta.id) 
                ? "Editar Pergunta" 
                : "Nova Pergunta"
              }
            </DialogTitle>
            <DialogDescription>
              Configure o texto e a categoria da pergunta.
            </DialogDescription>
          </DialogHeader>
          
          {editingPergunta && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={editingPergunta.category}
                  onValueChange={(value: 'A' | 'B' | 'C') => 
                    setEditingPergunta({ ...editingPergunta, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A - Ansiedade</SelectItem>
                    <SelectItem value="B">B - Aprendizado</SelectItem>
                    <SelectItem value="C">C - Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Texto da Pergunta</Label>
                <Textarea
                  value={editingPergunta.text}
                  onChange={(e) => setEditingPergunta({ ...editingPergunta, text: e.target.value })}
                  placeholder="Digite o texto da pergunta..."
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPerguntaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePergunta}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar perfil */}
      <Dialog open={perfilDialogOpen} onOpenChange={setPerfilDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPerfil && Object.keys(perfis).includes(editingPerfil.id) 
                ? "Editar Perfil" 
                : "Novo Perfil"
              }
            </DialogTitle>
            <DialogDescription>
              Configure as informações e mensagens do perfil.
            </DialogDescription>
          </DialogHeader>
          
          {editingPerfil && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Perfil</Label>
                  <Input
                    value={editingPerfil.nome}
                    onChange={(e) => setEditingPerfil({ ...editingPerfil, nome: e.target.value })}
                    placeholder="Ex: O Perfeccionista Ansioso"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Ícone (Emoji)</Label>
                  <Input
                    value={editingPerfil.icon}
                    onChange={(e) => setEditingPerfil({ ...editingPerfil, icon: e.target.value })}
                    placeholder="Ex: ⚠️"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Subtítulo</Label>
                <Textarea
                  value={editingPerfil.subtitulo}
                  onChange={(e) => setEditingPerfil({ ...editingPerfil, subtitulo: e.target.value })}
                  placeholder="Descrição breve do perfil..."
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <Select
                    value={editingPerfil.cor}
                    onValueChange={(value) => {
                      const gradients: Record<string, string> = {
                        amber: "from-amber-500 to-orange-500",
                        yellow: "from-yellow-500 to-amber-500",
                        blue: "from-blue-500 to-cyan-500",
                        gray: "from-gray-500 to-slate-500",
                        green: "from-green-500 to-emerald-500",
                        red: "from-red-500 to-rose-500",
                        purple: "from-purple-500 to-pink-500"
                      };
                      setEditingPerfil({ 
                        ...editingPerfil, 
                        cor: value,
                        corGradient: gradients[value] || "from-gray-500 to-slate-500"
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amber">Âmbar</SelectItem>
                      <SelectItem value="yellow">Amarelo</SelectItem>
                      <SelectItem value="blue">Azul</SelectItem>
                      <SelectItem value="green">Verde</SelectItem>
                      <SelectItem value="red">Vermelho</SelectItem>
                      <SelectItem value="purple">Roxo</SelectItem>
                      <SelectItem value="gray">Cinza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>ID do Perfil</Label>
                  <Input
                    value={editingPerfil.id}
                    onChange={(e) => setEditingPerfil({ ...editingPerfil, id: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                    placeholder="PROFILE_X_NOME"
                    disabled={Object.keys(perfis).includes(editingPerfil.id)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Onde mora o perigo
                </Label>
                <Textarea
                  value={editingPerfil.perigo}
                  onChange={(e) => setEditingPerfil({ ...editingPerfil, perigo: e.target.value })}
                  placeholder="Descreva os riscos e armadilhas deste perfil..."
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-green-600">
                  <Shield className="h-4 w-4" />
                  Como vamos resolver
                </Label>
                <Textarea
                  value={editingPerfil.solucao}
                  onChange={(e) => setEditingPerfil({ ...editingPerfil, solucao: e.target.value })}
                  placeholder="Descreva as estratégias e soluções para este perfil..."
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPerfilDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePerfil}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar perfil do aluno */}
      <Dialog open={alunoPerfilDialogOpen} onOpenChange={setAlunoPerfilDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Perfil de {selectedAluno?.nome}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAluno && selectedAluno.perfilEstudante && perfis[selectedAluno.perfilEstudante] && (
            <div className="space-y-4">
              {(() => {
                const perfilInfo = perfis[selectedAluno.perfilEstudante!];
                return (
                  <>
                    <Card className={`border-2 overflow-hidden`}>
                      <div className={`p-6 text-white bg-gradient-to-r ${perfilInfo.corGradient}`}>
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{perfilInfo.icon}</span>
                          <div>
                            <h3 className="text-2xl font-black">{perfilInfo.nome}</h3>
                            <p className="mt-1 opacity-90">{perfilInfo.subtitulo}</p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    <Card className="border-2 border-red-200 dark:border-red-800">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertTriangle className="h-5 w-5" />
                          Onde mora o perigo
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">
                          {perfilInfo.perigo}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-green-200 dark:border-green-800">
                      <CardContent className="p-4">
                        <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-green-600 dark:text-green-400">
                          <Shield className="h-5 w-5" />
                          Como vamos resolver
                        </h4>
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {perfilInfo.solucao}
                        </p>
                      </CardContent>
                    </Card>
                    
                    {selectedAluno.perfilAtualizadoEm && (
                      <p className="text-sm text-muted-foreground text-center">
                        Diagnóstico realizado em {selectedAluno.perfilAtualizadoEm.toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </>
                );
              })()}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setAlunoPerfilDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog para confirmar exclusão de pergunta */}
      <AlertDialog open={deletePerguntaDialogOpen} onOpenChange={setDeletePerguntaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pergunta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta pergunta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePergunta} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para confirmar exclusão de perfil */}
      <AlertDialog open={deletePerfilDialogOpen} onOpenChange={setDeletePerfilDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Perfil</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este perfil? Alunos que possuem este perfil ficarão sem classificação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePerfil} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

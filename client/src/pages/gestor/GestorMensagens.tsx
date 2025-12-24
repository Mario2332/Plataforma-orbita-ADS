import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  Mail, 
  MessageSquare, 
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Archive,
  Reply,
  Clock,
  HelpCircle,
  Bug,
  Lightbulb,
  Building2,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type AssuntoType = 'duvida' | 'bug' | 'sugestao' | 'comercial' | 'outro';
type StatusType = 'nova' | 'lida' | 'respondida' | 'arquivada';

interface MensagemContato {
  id: string;
  nome: string;
  email: string;
  assunto: AssuntoType;
  mensagem: string;
  status: StatusType;
  criadoEm: Timestamp;
  respondidoEm?: Timestamp;
  resposta?: string;
}

const assuntoConfig: Record<AssuntoType, { label: string; icon: React.ElementType; color: string }> = {
  duvida: { label: 'Dúvida', icon: HelpCircle, color: 'bg-blue-100 text-blue-700' },
  bug: { label: 'Bug', icon: Bug, color: 'bg-red-100 text-red-700' },
  sugestao: { label: 'Sugestão', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-700' },
  comercial: { label: 'Comercial', icon: Building2, color: 'bg-purple-100 text-purple-700' },
  outro: { label: 'Outro', icon: MessageSquare, color: 'bg-gray-100 text-gray-700' },
};

const statusConfig: Record<StatusType, { label: string; color: string }> = {
  nova: { label: 'Nova', color: 'bg-emerald-100 text-emerald-700' },
  lida: { label: 'Lida', color: 'bg-blue-100 text-blue-700' },
  respondida: { label: 'Respondida', color: 'bg-green-100 text-green-700' },
  arquivada: { label: 'Arquivada', color: 'bg-gray-100 text-gray-700' },
};

export default function GestorMensagens() {
  const [mensagens, setMensagens] = useState<MensagemContato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusType | 'todas'>('todas');
  const [filterAssunto, setFilterAssunto] = useState<AssuntoType | 'todos'>('todos');
  
  // Modal de detalhes
  const [selectedMensagem, setSelectedMensagem] = useState<MensagemContato | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [resposta, setResposta] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  // Carregar mensagens em tempo real
  useEffect(() => {
    const mensagensRef = collection(db, 'mensagens_contato');
    const q = query(mensagensRef, orderBy('criadoEm', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mensagensData: MensagemContato[] = [];
      snapshot.forEach((doc) => {
        mensagensData.push({
          id: doc.id,
          ...doc.data(),
        } as MensagemContato);
      });
      setMensagens(mensagensData);
      setIsLoading(false);
    }, (error) => {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtrar mensagens
  const mensagensFiltradas = mensagens.filter((msg) => {
    const matchSearch = 
      msg.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.mensagem.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = filterStatus === 'todas' || msg.status === filterStatus;
    const matchAssunto = filterAssunto === 'todos' || msg.assunto === filterAssunto;
    
    return matchSearch && matchStatus && matchAssunto;
  });

  // Marcar como lida
  const marcarComoLida = async (mensagem: MensagemContato) => {
    if (mensagem.status === 'nova') {
      try {
        const docRef = doc(db, 'mensagens_contato', mensagem.id);
        await updateDoc(docRef, { status: 'lida' });
      } catch (error) {
        console.error('Erro ao marcar como lida:', error);
      }
    }
  };

  // Abrir detalhes
  const abrirDetalhes = (mensagem: MensagemContato) => {
    setSelectedMensagem(mensagem);
    setResposta(mensagem.resposta || '');
    setIsDetailOpen(true);
    marcarComoLida(mensagem);
  };

  // Responder mensagem
  const responderMensagem = async () => {
    if (!selectedMensagem || !resposta.trim()) return;
    
    setIsResponding(true);
    try {
      const docRef = doc(db, 'mensagens_contato', selectedMensagem.id);
      await updateDoc(docRef, { 
        status: 'respondida',
        resposta: resposta,
        respondidoEm: Timestamp.now(),
      });
      toast.success('Resposta salva com sucesso!');
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Erro ao responder:', error);
      toast.error('Erro ao salvar resposta');
    } finally {
      setIsResponding(false);
    }
  };

  // Arquivar mensagem
  const arquivarMensagem = async (mensagem: MensagemContato) => {
    try {
      const docRef = doc(db, 'mensagens_contato', mensagem.id);
      await updateDoc(docRef, { status: 'arquivada' });
      toast.success('Mensagem arquivada');
      setIsDetailOpen(false);
    } catch (error) {
      console.error('Erro ao arquivar:', error);
      toast.error('Erro ao arquivar mensagem');
    }
  };

  // Estatísticas
  const stats = {
    total: mensagens.length,
    novas: mensagens.filter(m => m.status === 'nova').length,
    pendentes: mensagens.filter(m => m.status === 'lida').length,
    respondidas: mensagens.filter(m => m.status === 'respondida').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mensagens de Contato
          </h1>
          <p className="text-muted-foreground">
            Gerencie as mensagens recebidas pelo formulário de contato
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <Mail className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.novas}</p>
                <p className="text-sm text-muted-foreground">Novas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendentes}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.respondidas}</p>
                <p className="text-sm text-muted-foreground">Respondidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou mensagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as StatusType | 'todas')}
                className="px-3 py-2 border rounded-lg bg-background text-sm"
              >
                <option value="todas">Todos os status</option>
                <option value="nova">Novas</option>
                <option value="lida">Lidas</option>
                <option value="respondida">Respondidas</option>
                <option value="arquivada">Arquivadas</option>
              </select>
              <select
                value={filterAssunto}
                onChange={(e) => setFilterAssunto(e.target.value as AssuntoType | 'todos')}
                className="px-3 py-2 border rounded-lg bg-background text-sm"
              >
                <option value="todos">Todos os assuntos</option>
                <option value="duvida">Dúvidas</option>
                <option value="bug">Bugs</option>
                <option value="sugestao">Sugestões</option>
                <option value="comercial">Comercial</option>
                <option value="outro">Outros</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Mensagens */}
      <Card>
        <CardHeader>
          <CardTitle>Mensagens ({mensagensFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : mensagensFiltradas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mensagem encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mensagensFiltradas.map((mensagem) => {
                const AssuntoIcon = assuntoConfig[mensagem.assunto].icon;
                return (
                  <div
                    key={mensagem.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      mensagem.status === 'nova' 
                        ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' 
                        : ''
                    }`}
                    onClick={() => abrirDetalhes(mensagem)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${assuntoConfig[mensagem.assunto].color}`}>
                          <AssuntoIcon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold truncate">{mensagem.nome}</span>
                            {mensagem.status === 'nova' && (
                              <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{mensagem.email}</p>
                          <p className="text-sm mt-1 line-clamp-2">{mensagem.mensagem}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className={statusConfig[mensagem.status].color}>
                          {statusConfig[mensagem.status].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {mensagem.criadoEm && format(mensagem.criadoEm.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMensagem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${assuntoConfig[selectedMensagem.assunto].color}`}>
                    {(() => {
                      const Icon = assuntoConfig[selectedMensagem.assunto].icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <DialogTitle>{selectedMensagem.nome}</DialogTitle>
                    <DialogDescription>{selectedMensagem.email}</DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge className={assuntoConfig[selectedMensagem.assunto].color}>
                    {assuntoConfig[selectedMensagem.assunto].label}
                  </Badge>
                  <Badge className={statusConfig[selectedMensagem.status].color}>
                    {statusConfig[selectedMensagem.status].label}
                  </Badge>
                  <span>•</span>
                  <span>
                    {selectedMensagem.criadoEm && format(selectedMensagem.criadoEm.toDate(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Mensagem:</h4>
                  <p className="whitespace-pre-wrap">{selectedMensagem.mensagem}</p>
                </div>

                {selectedMensagem.resposta && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <h4 className="font-semibold mb-2 text-emerald-700 dark:text-emerald-400">Resposta:</h4>
                    <p className="whitespace-pre-wrap">{selectedMensagem.resposta}</p>
                    {selectedMensagem.respondidoEm && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Respondido em {format(selectedMensagem.respondidoEm.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                )}

                {selectedMensagem.status !== 'arquivada' && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">
                      {selectedMensagem.resposta ? 'Editar resposta:' : 'Responder:'}
                    </h4>
                    <Textarea
                      placeholder="Digite sua resposta..."
                      value={resposta}
                      onChange={(e) => setResposta(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedMensagem.status !== 'arquivada' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => arquivarMensagem(selectedMensagem)}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Arquivar
                    </Button>
                    <Button
                      onClick={responderMensagem}
                      disabled={!resposta.trim() || isResponding}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isResponding ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Reply className="h-4 w-4 mr-2" />
                          Salvar Resposta
                        </>
                      )}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

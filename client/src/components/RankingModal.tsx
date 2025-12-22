import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, 
  Medal, 
  Crown, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Loader2,
  Star,
  Flame,
  Sparkles,
  Info,
  Clock,
  BookOpen,
  FileText,
  PenLine
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { calcularPontuacaoSemanal, atualizarPontuacaoRanking, getRankingAluno } from "@/lib/ranking";

// Definição dos níveis do ranking
export const NIVEIS_RANKING = [
  { id: 1, nome: "Vestibulando Bronze", cor: "from-amber-600 to-amber-800", badge: "bg-amber-600", icon: "🥉" },
  { id: 2, nome: "Vestibulando Prata", cor: "from-gray-400 to-gray-600", badge: "bg-gray-500", icon: "🥈" },
  { id: 3, nome: "Vestibulando Ouro", cor: "from-yellow-400 to-yellow-600", badge: "bg-yellow-500", icon: "🥇" },
  { id: 4, nome: "Vestibulando Diamante", cor: "from-cyan-400 to-blue-600", badge: "bg-cyan-500", icon: "💎" },
  { id: 5, nome: "Vestibulando Elite", cor: "from-purple-500 to-purple-700", badge: "bg-purple-600", icon: "👑" },
  { id: 6, nome: "Futuro Calouro", cor: "from-emerald-400 to-emerald-600", badge: "bg-emerald-500", icon: "🎓" },
];

interface RankingAluno {
  id: string;
  nome: string;
  photoURL?: string;
  nivel: number;
  pontosSemanais: number;
  posicao?: number;
}

interface RankingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alunoAtual?: {
    id: string;
    nivel: number;
    pontosSemanais: number;
    posicao: number;
  };
}

export function RankingModal({ open, onOpenChange, alunoAtual }: RankingModalProps) {
  const [nivelSelecionado, setNivelSelecionado] = useState(alunoAtual?.nivel || 1);
  const [ranking, setRanking] = useState<RankingAluno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const userId = auth.currentUser?.uid;

  // Carregar ranking do nível selecionado
  useEffect(() => {
    if (!open) return;
    
    const loadRanking = async () => {
      setIsLoading(true);
      try {
        const rankingRef = collection(db, "ranking");
        const q = query(rankingRef, orderBy("pontosSemanais", "desc"));
        const snapshot = await getDocs(q);
        
        const todosAlunos: RankingAluno[] = [];
        
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          if (data.nivel === nivelSelecionado) {
            // Buscar dados do aluno
            const alunoRef = doc(db, "alunos", docSnap.id);
            const alunoSnap = await getDoc(alunoRef);
            const alunoData = alunoSnap.data();
            
            todosAlunos.push({
              id: docSnap.id,
              nome: alunoData?.nome || alunoData?.name || "Aluno",
              photoURL: alunoData?.photoURL,
              nivel: data.nivel,
              pontosSemanais: data.pontosSemanais || 0,
            });
          }
        }
        
        // Ordenar por pontos e adicionar posição
        todosAlunos.sort((a, b) => b.pontosSemanais - a.pontosSemanais);
        todosAlunos.forEach((aluno, index) => {
          aluno.posicao = index + 1;
        });
        
        setRanking(todosAlunos);
      } catch (error) {
        console.error("Erro ao carregar ranking:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRanking();
  }, [open, nivelSelecionado]);

  const nivelAtual = NIVEIS_RANKING.find(n => n.id === nivelSelecionado);
  const totalAlunos = ranking.length;

  // Determinar zona do aluno (promoção, manutenção, rebaixamento)
  const getZona = (posicao: number) => {
    if (totalAlunos <= 5) return "promocao"; // Todos sobem se tiver 5 ou menos
    if (posicao <= 5) return "promocao";
    if (posicao > totalAlunos - 5) return "rebaixamento";
    return "manutencao";
  };

  const getZonaBadge = (posicao: number) => {
    const zona = getZona(posicao);
    if (zona === "promocao") {
      return (
        <Badge className="bg-green-500 text-white flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          Promoção
        </Badge>
      );
    }
    if (zona === "rebaixamento" && nivelSelecionado > 1) {
      return (
        <Badge className="bg-red-500 text-white flex items-center gap-1">
          <TrendingDown className="h-3 w-3" />
          Rebaixamento
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Minus className="h-3 w-3" />
        Manutenção
      </Badge>
    );
  };

  const getPosicaoIcon = (posicao: number) => {
    if (posicao === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (posicao === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (posicao === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">{posicao}º</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Ranking Semanal
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-5 w-5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Como ganhar pontos?
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Tempo de estudo:</span>
                        <span className="text-muted-foreground"> 10 pts/hora (máx. 100 pts/dia)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Questões:</span>
                        <span className="text-muted-foreground"> 2 pts por acerto, 1 pt por erro</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Simulados:</span>
                        <span className="text-muted-foreground"> 4 pts por acerto</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <PenLine className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Redação:</span>
                        <span className="text-muted-foreground"> 100 pts + 10 pts a cada 100 da nota</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Flame className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">Diário de bordo:</span>
                        <span className="text-muted-foreground"> 50 pts/dia</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <p><strong>Top 5</strong> sobem de nível | <strong>Últimos 5</strong> descem</p>
                    <p>Atualização: domingo ao meio-dia</p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs de Níveis */}
        <Tabs value={nivelSelecionado.toString()} onValueChange={(v) => setNivelSelecionado(parseInt(v))}>
          <TabsList className="grid grid-cols-6 w-full">
            {NIVEIS_RANKING.map((nivel) => (
              <TabsTrigger 
                key={nivel.id} 
                value={nivel.id.toString()}
                className="text-xs px-1"
              >
                <span className="mr-1">{nivel.icon}</span>
                <span className="hidden sm:inline">{nivel.id}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {NIVEIS_RANKING.map((nivel) => (
            <TabsContent key={nivel.id} value={nivel.id.toString()} className="mt-4">
              {/* Header do Nível */}
              <div className={`p-4 rounded-lg bg-gradient-to-r ${nivel.cor} text-white mb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{nivel.icon}</span>
                    <div>
                      <h3 className="font-bold text-lg">{nivel.nome}</h3>
                      <p className="text-sm opacity-90">{totalAlunos} alunos neste nível</p>
                    </div>
                  </div>
                  {nivel.id < 6 && (
                    <div className="text-right text-sm">
                      <p className="font-semibold">Top 5 sobem de nível</p>
                      {nivel.id > 1 && <p className="opacity-80">Últimos 5 descem</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Lista do Ranking */}
              <ScrollArea className="h-[400px] pr-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : ranking.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <Trophy className="h-12 w-12 mb-2 opacity-50" />
                    <p>Nenhum aluno neste nível ainda</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {ranking.map((aluno) => {
                      const isCurrentUser = aluno.id === userId;
                      const zona = getZona(aluno.posicao!);
                      
                      return (
                        <div
                          key={aluno.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                            isCurrentUser 
                              ? "bg-primary/10 border-2 border-primary" 
                              : zona === "promocao"
                              ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                              : zona === "rebaixamento" && nivelSelecionado > 1
                              ? "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
                              : "bg-muted/50 border border-transparent"
                          }`}
                        >
                          {/* Posição */}
                          <div className="w-10 flex justify-center">
                            {getPosicaoIcon(aluno.posicao!)}
                          </div>

                          {/* Avatar */}
                          <Avatar className="h-10 w-10 border-2 border-white shadow">
                            {aluno.photoURL ? (
                              <AvatarImage src={aluno.photoURL} alt={aluno.nome} />
                            ) : null}
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-bold">
                              {aluno.nome.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          {/* Nome e Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">
                                {aluno.nome}
                                {isCurrentUser && <span className="text-primary ml-1">(você)</span>}
                              </p>
                              {aluno.posicao === 1 && (
                                <Sparkles className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Flame className="h-3 w-3 text-orange-500" />
                              <span>{aluno.pontosSemanais} pontos</span>
                            </div>
                          </div>

                          {/* Zona */}
                          {getZonaBadge(aluno.posicao!)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 pt-4 border-t text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Zona de Promoção (Top 5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Zona de Manutenção</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Zona de Rebaixamento (Últimos 5)</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente de resumo do ranking para o box de boas-vindas
interface RankingResumoProps {
  onClick: () => void;
}

export function RankingResumo({ onClick }: RankingResumoProps) {
  const [rankingData, setRankingData] = useState<{
    nivel: number;
    pontosSemanais: number;
    posicao: number;
    totalNivel: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRankingData = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Calcular pontuação atual em tempo real
        const { total: pontosCalculados } = await calcularPontuacaoSemanal();
        
        // Buscar dados do ranking do aluno
        const rankingRef = doc(db, "ranking", userId);
        const rankingSnap = await getDoc(rankingRef);
        
        let nivel = 1;
        
        if (rankingSnap.exists()) {
          const data = rankingSnap.data();
          nivel = data.nivel || 1;
          
          // Atualizar pontuação no Firestore se mudou
          if (data.pontosSemanais !== pontosCalculados) {
            await setDoc(rankingRef, {
              ...data,
              pontosSemanais: pontosCalculados,
              ultimaAtualizacao: Timestamp.now(),
            }, { merge: true });
          }
        } else {
          // Criar registro inicial no ranking
          await setDoc(rankingRef, {
            nivel: 1,
            pontosSemanais: pontosCalculados,
            ultimaAtualizacao: Timestamp.now(),
            criadoEm: Timestamp.now(),
          });
        }
        
        // Buscar posição no nível
        const rankingCollectionRef = collection(db, "ranking");
        const q = query(rankingCollectionRef, orderBy("pontosSemanais", "desc"));
        const snapshot = await getDocs(q);
        
        let posicao = 1;
        let totalNivel = 0;
        
        snapshot.docs.forEach((docSnap) => {
          const docData = docSnap.data();
          if (docData.nivel === nivel) {
            totalNivel++;
            if (docSnap.id !== userId && docData.pontosSemanais > pontosCalculados) {
              posicao++;
            }
          }
        });
        
        setRankingData({
          nivel,
          pontosSemanais: pontosCalculados,
          posicao,
          totalNivel: Math.max(totalNivel, 1),
        });
      } catch (error) {
        console.error("Erro ao carregar dados do ranking:", error);
        // Valor padrão em caso de erro
        setRankingData({
          nivel: 1,
          pontosSemanais: 0,
          posicao: 1,
          totalNivel: 1,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadRankingData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!rankingData) {
    return null;
  }

  const nivelInfo = NIVEIS_RANKING.find(n => n.id === rankingData.nivel) || NIVEIS_RANKING[0];

  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex flex-col items-start gap-2 h-auto p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-2 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 transition-all hover:shadow-lg hover:shadow-yellow-500/20"
    >
      <div className="flex items-center gap-2 w-full">
        <Trophy className="h-5 w-5 text-yellow-500" />
        <span className="font-bold text-sm">Ranking</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-2xl">{nivelInfo.icon}</span>
        <div className="text-left">
          <p className="text-xs text-muted-foreground">Nível {rankingData.nivel}</p>
          <p className="font-semibold text-sm">{nivelInfo.nome}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between w-full text-xs">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 text-yellow-500" />
          <span>{rankingData.pontosSemanais} pts</span>
        </div>
        <div className="flex items-center gap-1">
          <Medal className="h-3 w-3 text-gray-500" />
          <span>{rankingData.posicao}º de {rankingData.totalNivel}</span>
        </div>
      </div>
    </Button>
  );
}

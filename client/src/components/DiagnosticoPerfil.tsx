import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Brain, 
  AlertTriangle, 
  Trophy, 
  BookOpen, 
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sparkles,
  Target,
  Shield,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, Timestamp, collection, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils";

// Estrutura de dados das perguntas
export interface Pergunta {
  id: number;
  category: 'A' | 'B' | 'C';
  text: string;
}

// Perguntas padrão do questionário
export const PERGUNTAS_PADRAO: Pergunta[] = [
  // BLOCO A: ANSIEDADE (ID: score_anx)
  { id: 1, category: 'A', text: "Muitas vezes, eu adio começar a estudar porque tenho medo de não entender a matéria." },
  { id: 2, category: 'A', text: "Eu me preocupo muito em tirar uma nota menor que meus colegas nos simulados." },
  { id: 3, category: 'A', text: "Sinto um 'branco' ou grande nervosismo mesmo quando estudei o conteúdo." },
  { id: 4, category: 'A', text: "Prefiro não fazer um simulado se eu sentir que não estou 100% preparado." },

  // BLOCO B: APRENDIZADO/MASTERY (ID: score_learn)
  { id: 5, category: 'B', text: "Eu gosto de matérias difíceis porque elas me desafiam a pensar." },
  { id: 6, category: 'B', text: "Quando erro uma questão, minha primeira reação é ficar curioso para saber a resposta certa." },
  { id: 7, category: 'B', text: "Para mim, entender o conteúdo é mais importante do que apenas acertar a questão pelo 'macete'." },
  { id: 8, category: 'B', text: "Sinto satisfação quando percebo que aprendi algo novo, independente da nota." },

  // BLOCO C: PERFORMANCE (ID: score_perf)
  { id: 9, category: 'C', text: "Meu principal objetivo é tirar uma nota maior que a média para passar no SISU." },
  { id: 10, category: 'C', text: "Eu me sinto muito bem quando vou melhor que os outros nos simulados." },
  { id: 11, category: 'C', text: "Se eu pudesse passar sem aprender a matéria chata, eu preferiria." },
  { id: 12, category: 'C', text: "Estudo focando no que 'cai mais' para garantir pontos, não para saber a matéria a fundo." }
];

// Definição dos perfis
export interface PerfilDefinicao {
  id: string;
  nome: string;
  subtitulo: string;
  icon: string;
  cor: string;
  corGradient: string;
  perigo: string;
  solucao: string;
}

export const PERFIS_PADRAO: Record<string, PerfilDefinicao> = {
  PROFILE_1_ANSIOSO: {
    id: "PROFILE_1_ANSIOSO",
    nome: "O Perfeccionista Ansioso",
    subtitulo: "Você tem conhecimento e capacidade, mas o medo de errar muitas vezes trava o seu potencial.",
    icon: "⚠️",
    cor: "amber",
    corGradient: "from-amber-500 to-orange-500",
    perigo: "Seu maior inimigo é a interpretação catastrófica de resultados pontuais. Se você for mal em um simulado, sua tendência é achar que \"não sabe nada\" e desanimar por dias. Você tende a procrastinar não por preguiça, mas porque teme que o resultado não saia perfeito.",
    solucao: "• Técnica do Erro Útil: Cada erro no simulado é comemorado, pois é um erro que você não cometerá no dia da prova.\n• Evite Rankings: No início, compare seus resultados apenas com você mesmo, não com a turma.\n• Comece Pequeno: Se estiver travado, estude apenas 15 minutos. A inércia é seu pior inimigo."
  },
  PROFILE_2_COMPETITIVO: {
    id: "PROFILE_2_COMPETITIVO",
    nome: "O Competidor Pragmático",
    subtitulo: "Você tem \"sangue nos olhos\". Seu foco é o resultado, a aprovação e a eficiência.",
    icon: "🏆",
    cor: "yellow",
    corGradient: "from-yellow-500 to-amber-500",
    perigo: "Seu risco é o \"Burnout de Platô\". Se sua nota estagnar por dois simulados seguidos, você tende a ficar extremamente irritado e ansioso. Além disso, cuidado para não cair na armadilha de só estudar macetes e esquecer a base teórica necessária para questões complexas.",
    solucao: "• Metas Numéricas: Trabalharemos com metas claras de acertos. Você funciona melhor vendo gráficos subindo.\n• Use a Raiva: Se for mal, use a frustração como combustível para fazer mais exercícios, não para desistir.\n• Entenda o TRI: Sua estratégia será focada em garantir as fáceis e médias para maximizar sua nota."
  },
  PROFILE_3_ACADEMICO: {
    id: "PROFILE_3_ACADEMICO",
    nome: "O Acadêmico (Deep Learner)",
    subtitulo: "Você ama aprender e tem curiosidade genuína. Gosta de entender o \"porquê\" das coisas.",
    icon: "📚",
    cor: "blue",
    corGradient: "from-blue-500 to-cyan-500",
    perigo: "Sua armadilha é se apaixonar pelo conteúdo e esquecer da prova. Você corre o risco de passar 3 horas lendo teoria e não fazer nenhum exercício. Ir bem no simulado não te motiva tanto quanto \"aprender algo interessante\", e isso pode te tirar do foco do ENEM.",
    solucao: "• Estudo Reverso: Começaremos pelas questões. Você vai aprender a teoria para resolver o problema, e não o contrário.\n• Cronômetro Rígido: Limitaremos seu tempo de leitura teórica para garantir a prática.\n• Pragmatismo: Lembre-se: O ENEM não seleciona quem sabe mais, seleciona quem faz a melhor prova."
  },
  PROFILE_4_DESMOTIVADO: {
    id: "PROFILE_4_DESMOTIVADO",
    nome: "O Cético (Em Construção)",
    subtitulo: "No momento, você parece estar desacreditado da sua própria capacidade ou do processo.",
    icon: "🔄",
    cor: "gray",
    corGradient: "from-gray-500 to-slate-500",
    perigo: "A \"Profecia Autorrealizável\". Por achar que não vai passar ou que é difícil demais, você estuda menos. Estudando menos, tira notas baixas, o que confirma sua teoria de que \"não adianta\". Precisamos quebrar esse ciclo agora.",
    solucao: "• Vitórias Rápidas (Quick Wins): Não olhe para a montanha toda. Vamos focar apenas na meta desta semana.\n• Constância > Intensidade: Não tente estudar 8 horas hoje. Estude 1 hora bem feita. O objetivo é criar o hábito.\n• Confie no Processo: Apenas siga o cronograma proposto, sem questionar o resultado final por enquanto."
  }
};

// Escala Likert
const ESCALA_LIKERT = [
  { valor: 1, label: "Discordo Totalmente" },
  { valor: 2, label: "Discordo" },
  { valor: 3, label: "Neutro" },
  { valor: 4, label: "Concordo" },
  { valor: 5, label: "Concordo Totalmente" },
];

// Função para calcular o perfil
export function calcularPerfil(respostas: Record<number, number>, perguntas: Pergunta[]): string {
  // Somar pontuações por categoria
  let scoreA = 0; // Ansiedade
  let scoreB = 0; // Aprendizado
  let scoreC = 0; // Performance

  perguntas.forEach(pergunta => {
    const resposta = respostas[pergunta.id] || 0;
    if (pergunta.category === 'A') scoreA += resposta;
    else if (pergunta.category === 'B') scoreB += resposta;
    else if (pergunta.category === 'C') scoreC += resposta;
  });

  // Definição de Limiar de Apatia (Perfil Desmotivado)
  if (scoreA < 12 && scoreB < 12 && scoreC < 12) {
    return "PROFILE_4_DESMOTIVADO";
  }

  // Encontrar a pontuação predominante
  const maxScore = Math.max(scoreA, scoreB, scoreC);

  // Lógica de Decisão com Critério de Desempate
  // Prioridade em caso de empate: A (Ansiedade) > C (Performance) > B (Aprendizado)
  if (scoreA === maxScore) {
    return scoreA > 10 ? "PROFILE_1_ANSIOSO" : "PROFILE_4_DESMOTIVADO";
  }
  
  if (scoreC === maxScore) {
    return "PROFILE_2_COMPETITIVO";
  }
  
  if (scoreB === maxScore) {
    return "PROFILE_3_ACADEMICO";
  }

  // Fallback padrão
  return "PROFILE_4_DESMOTIVADO";
}

// Props do componente
interface DiagnosticoPerfilProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (perfilId: string) => void;
}

export function DiagnosticoPerfil({ open, onOpenChange, onComplete }: DiagnosticoPerfilProps) {
  const [etapa, setEtapa] = useState<'intro' | 'questionario' | 'resultado'>('intro');
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, number>>({});
  const [perfilResultado, setPerfilResultado] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [perguntas, setPerguntas] = useState<Pergunta[]>(PERGUNTAS_PADRAO);
  const [perfis, setPerfis] = useState<Record<string, PerfilDefinicao>>(PERFIS_PADRAO);

  // Carregar perguntas e perfis customizados do Firebase
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Carregar perguntas customizadas
        const perguntasRef = doc(db, "diagnostico_perfil_config", "perguntas");
        const perguntasSnap = await getDoc(perguntasRef);
        if (perguntasSnap.exists() && perguntasSnap.data()?.perguntas) {
          setPerguntas(perguntasSnap.data().perguntas);
        }

        // Carregar perfis customizados
        const perfisRef = doc(db, "diagnostico_perfil_config", "perfis");
        const perfisSnap = await getDoc(perfisRef);
        if (perfisSnap.exists() && perfisSnap.data()?.perfis) {
          setPerfis(perfisSnap.data().perfis);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    };

    if (open) {
      loadConfig();
    }
  }, [open]);

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setEtapa('intro');
      setPerguntaAtual(0);
      setRespostas({});
      setPerfilResultado(null);
    }
  }, [open]);

  const handleResponder = (valor: number) => {
    const pergunta = perguntas[perguntaAtual];
    const novasRespostas = { ...respostas, [pergunta.id]: valor };
    setRespostas(novasRespostas);
    
    // Avançar para próxima pergunta
    if (perguntaAtual < perguntas.length - 1) {
      setPerguntaAtual(prev => prev + 1);
    }
    // Na última pergunta, não avança automaticamente - o usuário clica em "Ver Resultado"
  };

  const handleVoltar = () => {
    if (perguntaAtual > 0) {
      setPerguntaAtual(prev => prev - 1);
    }
  };

  const finalizarQuestionario = async () => {
    setIsLoading(true);
    
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("Usuário não autenticado");

      // Calcular perfil
      const perfilId = calcularPerfil(respostas, perguntas);
      setPerfilResultado(perfilId);

      // Salvar no Firebase
      const perfilRef = doc(db, "alunos", userId, "diagnostico", "perfil");
      await setDoc(perfilRef, {
        perfilId,
        respostas,
        dataRealizacao: Timestamp.now(),
        versao: 1
      });

      // Atualizar documento do aluno com o perfil
      const alunoRef = doc(db, "alunos", userId);
      await setDoc(alunoRef, {
        perfilEstudante: perfilId,
        perfilAtualizadoEm: Timestamp.now()
      }, { merge: true });

      setEtapa('resultado');
      
      if (onComplete) {
        onComplete(perfilId);
      }
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefazerTeste = () => {
    setEtapa('intro');
    setPerguntaAtual(0);
    setRespostas({});
    setPerfilResultado(null);
  };

  const progresso = perguntas.length > 0 ? ((perguntaAtual + 1) / perguntas.length) * 100 : 0;
  const perfilInfo = perfilResultado ? perfis[perfilResultado] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {etapa === 'intro' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                Diagnóstico de Perfil de Estudante
              </DialogTitle>
              <DialogDescription className="text-base mt-2">
                Descubra seu perfil de estudante e receba dicas personalizadas para maximizar seu desempenho no ENEM.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Target className="h-5 w-5 text-purple-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">12 Perguntas</p>
                      <p className="text-xs text-muted-foreground">Rápido e objetivo</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-2 border-pink-200 dark:border-pink-800">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-pink-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">4 Perfis</p>
                      <p className="text-xs text-muted-foreground">Resultado personalizado</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-500" />
                  Como funciona?
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Responda cada pergunta de forma honesta</li>
                  <li>• Use a escala de 1 (Discordo Totalmente) a 5 (Concordo Totalmente)</li>
                  <li>• Não existe resposta certa ou errada</li>
                  <li>• Você pode refazer o teste quando quiser</li>
                </ul>
              </div>

              <Button 
                onClick={() => setEtapa('questionario')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-6"
              >
                Começar Diagnóstico
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </>
        )}

        {etapa === 'questionario' && (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg">
                  Pergunta {perguntaAtual + 1} de {perguntas.length}
                </DialogTitle>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progresso)}% completo
                </span>
              </div>
              <Progress value={progresso} className="h-2 mt-2" />
            </DialogHeader>

            <div className="py-6 space-y-6">
              <p className="text-lg font-medium leading-relaxed">
                {perguntas[perguntaAtual]?.text}
              </p>

              <div className="space-y-3">
                {ESCALA_LIKERT.map((opcao) => (
                  <Button
                    key={opcao.valor}
                    variant="outline"
                    onClick={() => handleResponder(opcao.valor)}
                    className={cn(
                      "w-full justify-start py-4 px-4 h-auto text-left transition-all",
                      respostas[perguntas[perguntaAtual]?.id] === opcao.valor
                        ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                        : "hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/20"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold text-sm",
                      respostas[perguntas[perguntaAtual]?.id] === opcao.valor
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800"
                    )}>
                      {opcao.valor}
                    </div>
                    <span className="font-medium">{opcao.label}</span>
                  </Button>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button
                  variant="ghost"
                  onClick={handleVoltar}
                  disabled={perguntaAtual === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                
                {perguntaAtual === perguntas.length - 1 && respostas[perguntas[perguntaAtual]?.id] !== undefined && (
                  <Button
                    onClick={finalizarQuestionario}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculando...
                      </>
                    ) : (
                      <>
                        Ver Resultado
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {etapa === 'resultado' && perfilInfo && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <span className="text-4xl">{perfilInfo.icon}</span>
                Seu Perfil
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Card do Perfil */}
              <Card className={cn(
                "border-2 overflow-hidden",
                perfilInfo.cor === 'amber' && "border-amber-300 dark:border-amber-700",
                perfilInfo.cor === 'yellow' && "border-yellow-300 dark:border-yellow-700",
                perfilInfo.cor === 'blue' && "border-blue-300 dark:border-blue-700",
                perfilInfo.cor === 'gray' && "border-gray-300 dark:border-gray-700"
              )}>
                <div className={cn(
                  "p-6 text-white bg-gradient-to-r",
                  perfilInfo.corGradient
                )}>
                  <h3 className="text-2xl font-black">{perfilInfo.nome}</h3>
                  <p className="mt-2 opacity-90">{perfilInfo.subtitulo}</p>
                </div>
              </Card>

              {/* Onde mora o perigo */}
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

              {/* Como vamos resolver */}
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

              {/* Botões de ação */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefazerTeste}
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refazer Teste
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Entendi!
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Componente de Card Resumo do Perfil (para exibir na página inicial)
interface PerfilResumoProps {
  onClick: () => void;
}

export function PerfilResumo({ onClick }: PerfilResumoProps) {
  const [perfilData, setPerfilData] = useState<{
    perfilId: string | null;
    dataRealizacao: Date | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [perfis, setPerfis] = useState<Record<string, PerfilDefinicao>>(PERFIS_PADRAO);

  useEffect(() => {
    const loadPerfilData = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        // Carregar perfis customizados
        const perfisRef = doc(db, "diagnostico_perfil_config", "perfis");
        const perfisSnap = await getDoc(perfisRef);
        if (perfisSnap.exists() && perfisSnap.data()?.perfis) {
          setPerfis(perfisSnap.data().perfis);
        }

        // Carregar perfil do aluno
        const perfilRef = doc(db, "alunos", userId, "diagnostico", "perfil");
        const perfilSnap = await getDoc(perfilRef);
        
        if (perfilSnap.exists()) {
          const data = perfilSnap.data();
          setPerfilData({
            perfilId: data.perfilId,
            dataRealizacao: data.dataRealizacao?.toDate() || null
          });
        } else {
          setPerfilData({
            perfilId: null,
            dataRealizacao: null
          });
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        setPerfilData({
          perfilId: null,
          dataRealizacao: null
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPerfilData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
      </div>
    );
  }

  const perfilInfo = perfilData?.perfilId ? perfis[perfilData.perfilId] : null;

  // Se não fez o diagnóstico
  if (!perfilInfo) {
    return (
      <Button
        variant="outline"
        onClick={onClick}
        className="flex flex-col items-start gap-2 h-auto p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all hover:shadow-lg hover:shadow-purple-500/20"
      >
        <div className="flex items-center gap-2 w-full">
          <Brain className="h-5 w-5 text-purple-500" />
          <span className="font-bold text-sm">Perfil de Estudante</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
            <HelpCircle className="h-6 w-6 text-purple-500" />
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Ainda não descoberto</p>
            <p className="font-semibold text-sm text-purple-600 dark:text-purple-400">Faça o diagnóstico!</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
          <Sparkles className="h-3 w-3" />
          <span>12 perguntas • 3 min</span>
        </div>
      </Button>
    );
  }

  // Se já fez o diagnóstico
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 h-auto p-4 border-2 transition-all hover:shadow-lg",
        perfilInfo.cor === 'amber' && "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800 hover:border-amber-400 dark:hover:border-amber-600 hover:shadow-amber-500/20",
        perfilInfo.cor === 'yellow' && "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800 hover:border-yellow-400 dark:hover:border-yellow-600 hover:shadow-yellow-500/20",
        perfilInfo.cor === 'blue' && "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-blue-500/20",
        perfilInfo.cor === 'gray' && "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:shadow-gray-500/20"
      )}
    >
      <div className="flex items-center gap-2 w-full">
        <Brain className="h-5 w-5 text-purple-500" />
        <span className="font-bold text-sm">Seu Perfil</span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-3xl">{perfilInfo.icon}</span>
        <div className="text-left">
          <p className="font-semibold text-sm">{perfilInfo.nome}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{perfilInfo.subtitulo.substring(0, 40)}...</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <RefreshCw className="h-3 w-3" />
        <span>Clique para ver detalhes ou refazer</span>
      </div>
    </Button>
  );
}

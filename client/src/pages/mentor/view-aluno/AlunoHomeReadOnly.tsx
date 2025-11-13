import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BookOpen, Target, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

interface Props {
  data: any;
}

export default function AlunoHomeReadOnly({ data }: Props) {
  const { estudos = [], simulados = [] } = data;

  // Calcular métricas
  const tempoTotal = estudos.reduce((acc: number, e: any) => acc + (e.tempoMinutos || 0), 0);
  const questoesTotal = estudos.reduce((acc: number, e: any) => acc + (e.questoesFeitas || 0), 0);
  const acertosTotal = estudos.reduce((acc: number, e: any) => acc + (e.questoesAcertadas || 0), 0);
  const percentualAcerto = questoesTotal > 0 ? Math.round((acertosTotal / questoesTotal) * 100) : 0;

  // Último simulado
  const ultimoSimulado = simulados[0];
  const acertosUltimoSimulado = ultimoSimulado
    ? (ultimoSimulado.linguagensAcertos || 0) +
      (ultimoSimulado.humanasAcertos || 0) +
      (ultimoSimulado.naturezaAcertos || 0) +
      (ultimoSimulado.matematicaAcertos || 0)
    : 0;

  // Calcular desempenho por matéria
  const desempenhoPorMateria = estudos.reduce((acc: any, e: any) => {
    if (!e.materia) return acc;
    
    if (!acc[e.materia]) {
      acc[e.materia] = { feitas: 0, acertadas: 0 };
    }
    
    acc[e.materia].feitas += e.questoesFeitas || 0;
    acc[e.materia].acertadas += e.questoesAcertadas || 0;
    
    return acc;
  }, {});

  const analiseInteligente = Object.entries(desempenhoPorMateria).map(([materia, dados]: [string, any]) => {
    const percentual = dados.feitas > 0 ? Math.round((dados.acertadas / dados.feitas) * 100) : 0;
    return { materia, percentual, feitas: dados.feitas };
  });

  const pontosFortes = analiseInteligente.filter(a => a.percentual >= 80 && a.feitas >= 5);
  const pontosFracos = analiseInteligente.filter(a => a.percentual < 60 && a.feitas >= 5);

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Estudo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(tempoTotal / 60)}h</div>
            <p className="text-xs text-muted-foreground">{tempoTotal} minutos totais</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questões Feitas</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questoesTotal}</div>
            <p className="text-xs text-muted-foreground">{acertosTotal} acertos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Acerto</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{percentualAcerto}%</div>
            <p className="text-xs text-muted-foreground">Geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Simulado</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acertosUltimoSimulado}/180</div>
            <p className="text-xs text-muted-foreground">
              {ultimoSimulado ? Math.round((acertosUltimoSimulado / 180) * 100) : 0}% de acerto
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análise Inteligente */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Pontos Fortes
            </CardTitle>
            <CardDescription>Matérias com desempenho ≥ 80%</CardDescription>
          </CardHeader>
          <CardContent>
            {pontosFortes.length > 0 ? (
              <div className="space-y-2">
                {pontosFortes.map((item) => (
                  <div key={item.materia} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-950 rounded">
                    <span className="font-medium">{item.materia}</span>
                    <span className="text-green-600 font-bold">{item.percentual}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum ponto forte identificado ainda. Continue estudando!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-600" />
              Pontos a Melhorar
            </CardTitle>
            <CardDescription>Matérias com desempenho &lt; 60%</CardDescription>
          </CardHeader>
          <CardContent>
            {pontosFracos.length > 0 ? (
              <div className="space-y-2">
                {pontosFracos.map((item) => (
                  <div key={item.materia} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded">
                    <span className="font-medium">{item.materia}</span>
                    <span className="text-red-600 font-bold">{item.percentual}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum ponto fraco identificado. Excelente trabalho!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Estudos */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Atividades</CardTitle>
          <CardDescription>Visão geral dos estudos e simulados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium mb-2">Estudos Registrados</p>
              <p className="text-3xl font-bold">{estudos.length}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Simulados Realizados</p>
              <p className="text-3xl font-bold">{simulados.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

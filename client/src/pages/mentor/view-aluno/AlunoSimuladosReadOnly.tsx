import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useMemo } from "react";

interface Props {
  data: any;
}

export default function AlunoSimuladosReadOnly({ data }: Props) {
  const { simulados = [], autodiagnosticos = [] } = data;

  const formatarData = (dataObj: any) => {
    try {
      let date: Date;
      
      if (dataObj?.seconds || dataObj?._seconds) {
        const seconds = dataObj.seconds || dataObj._seconds;
        date = new Date(seconds * 1000);
      } else if (dataObj?.toDate) {
        date = dataObj.toDate();
      } else {
        date = new Date(dataObj);
      }
      
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
      return localDate.toLocaleDateString('pt-BR');
    } catch {
      return "Data inválida";
    }
  };

  // Dados para o gráfico de evolução
  const dadosGrafico = useMemo(() => {
    return simulados
      .map((s: any) => {
        const total = (s.linguagensAcertos || 0) + 
                     (s.humanasAcertos || 0) + 
                     (s.naturezaAcertos || 0) + 
                     (s.matematicaAcertos || 0);
        
        return {
          nome: s.nome,
          data: formatarData(s.data),
          acertos: total,
        };
      })
      .reverse();
  }, [simulados]);

  // Dados para distribuição de erros
  const distribuicaoErros = useMemo(() => {
    const contagem: Record<string, number> = {
      "Interpretação": 0,
      "Atenção": 0,
      "Lacuna Teórica": 0,
      "Não Estudado": 0,
    };

    autodiagnosticos.forEach((auto: any) => {
      auto.questoes?.forEach((q: any) => {
        if (q.motivoErro && contagem[q.motivoErro] !== undefined) {
          contagem[q.motivoErro]++;
        }
      });
    });

    return Object.entries(contagem).map(([motivo, quantidade]) => ({
      motivo,
      quantidade,
    }));
  }, [autodiagnosticos]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="simulados" className="space-y-4">
        <TabsList>
          <TabsTrigger value="simulados">Simulados</TabsTrigger>
          <TabsTrigger value="autodiagnostico">Autodiagnóstico</TabsTrigger>
        </TabsList>

        <TabsContent value="simulados" className="space-y-4">
          {/* Gráfico de Evolução */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Acertos</CardTitle>
              <CardDescription>Número de questões corretas por simulado</CardDescription>
            </CardHeader>
            <CardContent>
              {dadosGrafico.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dadosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 180]} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-lg">
                              <p className="text-sm font-medium">{payload[0].payload.nome}</p>
                              <p className="text-sm text-muted-foreground">{payload[0].payload.data}</p>
                              <p className="text-sm font-bold text-primary">
                                {payload[0].value} acertos
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="acertos" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum simulado registrado ainda
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tabela de Simulados */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Simulados</CardTitle>
              <CardDescription>
                Total de {simulados.length} {simulados.length === 1 ? 'simulado' : 'simulados'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {simulados.length > 0 ? (
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {simulados.map((simulado: any) => {
                        const total = (simulado.linguagensAcertos || 0) + 
                                     (simulado.humanasAcertos || 0) + 
                                     (simulado.naturezaAcertos || 0) + 
                                     (simulado.matematicaAcertos || 0);
                        
                        return (
                          <TableRow key={simulado.id}>
                            <TableCell>{formatarData(simulado.data)}</TableCell>
                            <TableCell className="font-medium">{simulado.nome}</TableCell>
                            <TableCell>{simulado.linguagensAcertos || 0}/45</TableCell>
                            <TableCell>{simulado.humanasAcertos || 0}/45</TableCell>
                            <TableCell>{simulado.naturezaAcertos || 0}/45</TableCell>
                            <TableCell>{simulado.matematicaAcertos || 0}/45</TableCell>
                            <TableCell className="font-bold">{total}/180</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum simulado registrado ainda
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="autodiagnostico" className="space-y-4">
          {/* Gráfico de Distribuição de Erros */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Erros</CardTitle>
              <CardDescription>Análise dos motivos de erro</CardDescription>
            </CardHeader>
            <CardContent>
              {distribuicaoErros.some(d => d.quantidade > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={distribuicaoErros}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="motivo" tick={{ fontSize: 12 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum erro registrado ainda
                </p>
              )}
            </CardContent>
          </Card>

          {/* Lista de Autodiagnósticos */}
          <Card>
            <CardHeader>
              <CardTitle>Autodiagnósticos Registrados</CardTitle>
              <CardDescription>
                Total de {autodiagnosticos.length} {autodiagnosticos.length === 1 ? 'registro' : 'registros'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {autodiagnosticos.length > 0 ? (
                <div className="space-y-4">
                  {autodiagnosticos.map((auto: any) => (
                    <div key={auto.id} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">{auto.prova}</h4>
                      <div className="space-y-2">
                        {auto.questoes?.map((q: any, idx: number) => (
                          <div key={idx} className="text-sm bg-muted p-2 rounded">
                            <p><strong>Questão:</strong> {q.numeroQuestao}</p>
                            <p><strong>Macroassunto:</strong> {q.macroassunto}</p>
                            <p><strong>Microassunto:</strong> {q.microassunto}</p>
                            <p><strong>Motivo:</strong> {q.motivoErro}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum autodiagnóstico registrado ainda
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useMemo } from "react";

interface Props {
  data: any;
}

export default function AlunoDiarioBordoReadOnly({ data }: Props) {
  const { diarioEmocional = [] } = data;

  const formatarData = (dataStr: string) => {
    try {
      const [ano, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dataStr;
    }
  };

  // Distribuição de estados emocionais
  const distribuicaoEstados = useMemo(() => {
    const contagem: Record<string, number> = {};
    
    diarioEmocional.forEach((registro: any) => {
      const estado = registro.estadoEmocional || "Não informado";
      contagem[estado] = (contagem[estado] || 0) + 1;
    });
    
    return Object.entries(contagem).map(([estado, quantidade]) => ({
      estado,
      quantidade,
    }));
  }, [diarioEmocional]);

  // Distribuição de níveis de cansaço
  const distribuicaoCansaco = useMemo(() => {
    const contagem: Record<string, number> = {};
    
    diarioEmocional.forEach((registro: any) => {
      const nivel = registro.nivelCansaco || "Não informado";
      contagem[nivel] = (contagem[nivel] || 0) + 1;
    });
    
    return Object.entries(contagem).map(([nivel, quantidade]) => ({
      nivel,
      quantidade,
    }));
  }, [diarioEmocional]);

  const getEmojiEstado = (estado: string) => {
    const emojis: Record<string, string> = {
      "Motivado": "😊",
      "Neutro": "😐",
      "Ansioso": "😰",
      "Cansado": "😴",
      "Frustrado": "😞",
    };
    return emojis[estado] || "📝";
  };

  const getEmojiCansaco = (nivel: string) => {
    const emojis: Record<string, string> = {
      "Descansado": "💪",
      "Normal": "👍",
      "Cansado": "😴",
      "Exausto": "🥱",
    };
    return emojis[nivel] || "📊";
  };

  return (
    <div className="space-y-6">
      {/* Gráficos de Distribuição */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estados Emocionais</CardTitle>
            <CardDescription>Distribuição dos estados registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {distribuicaoEstados.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={distribuicaoEstados}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="estado" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum registro ainda
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Níveis de Energia</CardTitle>
            <CardDescription>Distribuição dos níveis de cansaço</CardDescription>
          </CardHeader>
          <CardContent>
            {distribuicaoCansaco.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={distribuicaoCansaco}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nivel" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum registro ainda
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Registros */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico do Diário de Bordo</CardTitle>
          <CardDescription>
            Total de {diarioEmocional.length} {diarioEmocional.length === 1 ? 'registro' : 'registros'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {diarioEmocional.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Estado Emocional</TableHead>
                    <TableHead>Nível de Energia</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {diarioEmocional.map((registro: any) => (
                    <TableRow key={registro.id}>
                      <TableCell>{formatarData(registro.data)}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span>{getEmojiEstado(registro.estadoEmocional)}</span>
                          <span>{registro.estadoEmocional}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span>{getEmojiCansaco(registro.nivelCansaco)}</span>
                          <span>{registro.nivelCansaco}</span>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {registro.observacoes || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro no diário de bordo ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

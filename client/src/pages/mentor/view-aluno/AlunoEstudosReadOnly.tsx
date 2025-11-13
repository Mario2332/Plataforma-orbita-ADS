import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  data: any;
}

export default function AlunoEstudosReadOnly({ data }: Props) {
  const { estudos = [] } = data;

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
      
      // Criar data no meio-dia para evitar problemas de timezone
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
      return localDate.toLocaleDateString('pt-BR');
    } catch {
      return "Data inválida";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Estudos</CardTitle>
          <CardDescription>
            Total de {estudos.length} {estudos.length === 1 ? 'registro' : 'registros'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {estudos.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Matéria</TableHead>
                    <TableHead>Conteúdo</TableHead>
                    <TableHead>Tempo</TableHead>
                    <TableHead>Questões</TableHead>
                    <TableHead>Acertos</TableHead>
                    <TableHead>Taxa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estudos.map((estudo: any) => {
                    const taxa = estudo.questoesFeitas > 0 
                      ? Math.round((estudo.questoesAcertadas / estudo.questoesFeitas) * 100)
                      : 0;
                    
                    return (
                      <TableRow key={estudo.id}>
                        <TableCell>{formatarData(estudo.data)}</TableCell>
                        <TableCell className="font-medium">{estudo.materia || "-"}</TableCell>
                        <TableCell>{estudo.conteudo || "-"}</TableCell>
                        <TableCell>{estudo.tempoMinutos || 0} min</TableCell>
                        <TableCell>{estudo.questoesFeitas || 0}</TableCell>
                        <TableCell>{estudo.questoesAcertadas || 0}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            taxa >= 80 ? 'text-green-600' :
                            taxa >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {taxa}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhum estudo registrado ainda
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

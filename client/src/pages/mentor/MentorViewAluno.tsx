import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mentorApi } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Importar componentes do aluno (vamos criar versões read-only)
import AlunoHomeReadOnly from "./view-aluno/AlunoHomeReadOnly";
import AlunoEstudosReadOnly from "./view-aluno/AlunoEstudosReadOnly";
import AlunoSimuladosReadOnly from "./view-aluno/AlunoSimuladosReadOnly";
import AlunoDiarioBordoReadOnly from "./view-aluno/AlunoDiarioBordoReadOnly";

export default function MentorViewAluno() {
  const [match, params] = useRoute("/mentor/alunos/:alunoId");
  const [, setLocation] = useLocation();
  const alunoId = params?.alunoId;
  const [isLoading, setIsLoading] = useState(true);
  const [alunoData, setAlunoData] = useState<any>(null);

  useEffect(() => {
    loadAlunoData();
  }, [alunoId]);

  const loadAlunoData = async () => {
    if (!alunoId) {
      toast.error("ID do aluno não fornecido");
      setLocation("/mentor/alunos");
      return;
    }

    try {
      setIsLoading(true);
      const data = await mentorApi.getAlunoAreaCompleta(alunoId);
      setAlunoData(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar dados do aluno");
      setLocation("/mentor/alunos");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!alunoData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">Aluno não encontrado</p>
        <Button onClick={() => navigate("/mentor/alunos")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com informações do aluno */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/mentor/alunos")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{alunoData.aluno.nome}</h1>
          <p className="text-muted-foreground mt-1">
            Visualizando como aluno • {alunoData.aluno.email}
          </p>
        </div>
      </div>

      {/* Alerta informativo */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            ℹ️ Você está visualizando a área do aluno em modo somente leitura. 
            Todas as informações exibidas são as mesmas que o aluno vê em sua própria área.
          </p>
        </CardContent>
      </Card>

      {/* Tabs com as áreas do aluno */}
      <Tabs defaultValue="inicio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inicio">Início</TabsTrigger>
          <TabsTrigger value="estudos">Estudos</TabsTrigger>
          <TabsTrigger value="simulados">Simulados</TabsTrigger>
          <TabsTrigger value="diario">Diário de Bordo</TabsTrigger>
        </TabsList>

        <TabsContent value="inicio">
          <AlunoHomeReadOnly data={alunoData} />
        </TabsContent>

        <TabsContent value="estudos">
          <AlunoEstudosReadOnly data={alunoData} />
        </TabsContent>

        <TabsContent value="simulados">
          <AlunoSimuladosReadOnly data={alunoData} />
        </TabsContent>

        <TabsContent value="diario">
          <AlunoDiarioBordoReadOnly data={alunoData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

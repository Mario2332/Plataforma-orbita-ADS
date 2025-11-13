import { useMentorView } from "@/pages/mentor/MentorViewAluno";
import { alunoApi, mentorApi } from "@/lib/api";

/**
 * Hook que retorna a API correta dependendo se está em modo mentor ou aluno
 */
export function useAlunoApi() {
  const mentorView = useMentorView();
  
  if (mentorView?.isMentorView && mentorView?.alunoId) {
    // Modo mentor: usar funções do mentor com alunoId
    return {
      // Estudos
      getEstudos: () => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "estudos" }),
      createEstudo: (data: any) => mentorApi.createAlunoEstudo({ ...data, alunoId: mentorView.alunoId }),
      updateEstudo: (estudoId: string, data: any) => mentorApi.updateAlunoEstudo({ ...data, alunoId: mentorView.alunoId, estudoId }),
      deleteEstudo: (estudoId: string) => mentorApi.deleteAlunoEstudo({ alunoId: mentorView.alunoId, estudoId }),
      
      // Simulados
      getSimulados: () => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "simulados" }),
      createSimulado: (data: any) => mentorApi.createAlunoSimulado({ ...data, alunoId: mentorView.alunoId }),
      updateSimulado: (data: any) => mentorApi.updateAlunoSimulado({ ...data, alunoId: mentorView.alunoId }),
      deleteSimulado: (simuladoId: string) => mentorApi.deleteAlunoSimulado({ alunoId: mentorView.alunoId, simuladoId }),
      
      // Métricas
      getMetricas: () => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "metricas" }),
      
      // Cronograma
      getCronograma: () => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "cronogramas" }),
      getTarefas: (cronogramaId: string) => {
        // Implementar se necessário
        return Promise.resolve([]);
      },
      
      // Horários
      getHorarios: () => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "horarios" }),
      createHorario: (data: any) => {
        // Por enquanto retorna erro - implementar função no backend se necessário
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      updateHorario: (data: any) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      deleteHorario: (horarioId: string) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      
      // Templates
      getTemplates: () => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "templates" }),
      saveTemplate: (data: any) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      loadTemplate: (templateId: string) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      deleteTemplate: (templateId: string) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      
      // Diário Emocional
      getDiarioEmocional: (data?: any) => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "diario_emocional" }),
      createDiarioEmocional: (data: any) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      deleteDiarioEmocional: (registroId: string) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      
      // Autodiagnóstico
      getAutodiagnosticos: () => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "autodiagnosticos" }),
      createAutodiagnostico: (data: any) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      deleteAutodiagnostico: (autodiagnosticoId: string) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      
      // Progresso (conteúdos ENEM)
      getProgresso: (materia?: string) => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "progresso" }),
      updateProgresso: (data: any) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      
      // Profile
      getMe: () => mentorApi.getAlunoById(mentorView.alunoId),
      updateProfile: (data: any) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      
      // Cronograma (funções adicionais)
      createCronograma: (data: any) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      updateCronograma: (data: any) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      deleteCronograma: (cronogramaId: string) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      createTarefa: (data: any) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      updateTarefa: (data: any) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
      deleteTarefa: (tarefaId: string) => {
        return Promise.reject(new Error("Função não implementada para mentor"));
      },
    };
  }
  
  // Modo aluno: usar API normal do aluno
  return alunoApi;
}

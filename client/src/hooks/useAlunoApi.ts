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
      createCronograma: (data: any) => mentorApi.createAlunoCronograma({ ...data, alunoId: mentorView.alunoId }),
      updateCronograma: (data: any) => mentorApi.updateAlunoCronograma({ ...data, alunoId: mentorView.alunoId }),
      deleteCronograma: (cronogramaId: string) => mentorApi.deleteAlunoCronograma({ alunoId: mentorView.alunoId, cronogramaId }),
      
      // Tarefas
      getTarefas: (cronogramaId: string) => {
        // Implementar se necessário
        return Promise.resolve([]);
      },
      createTarefa: (data: any) => mentorApi.createAlunoTarefa({ ...data, alunoId: mentorView.alunoId }),
      updateTarefa: (data: any) => mentorApi.updateAlunoTarefa({ ...data, alunoId: mentorView.alunoId }),
      deleteTarefa: (tarefaId: string, cronogramaId: string) => mentorApi.deleteAlunoTarefa({ alunoId: mentorView.alunoId, cronogramaId, tarefaId }),
      
      // Horários
      getHorarios: () => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "horarios" }),
      createHorario: (data: any) => mentorApi.createAlunoHorario({ ...data, alunoId: mentorView.alunoId }),
      updateHorario: (data: any) => mentorApi.updateAlunoHorario({ ...data, alunoId: mentorView.alunoId }),
      deleteHorario: (horarioId: string) => mentorApi.deleteAlunoHorario({ alunoId: mentorView.alunoId, horarioId }),
      clearAllHorarios: () => mentorApi.clearAlunoHorarios({ alunoId: mentorView.alunoId }),
      
      // Templates
      getTemplates: () => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "templates" }),
      saveTemplate: (data: any) => mentorApi.saveAlunoTemplate({ ...data, alunoId: mentorView.alunoId }),
      loadTemplate: (templateId: string) => mentorApi.loadAlunoTemplate({ alunoId: mentorView.alunoId, templateId }),
      deleteTemplate: (templateId: string) => mentorApi.deleteAlunoTemplate({ alunoId: mentorView.alunoId, templateId }),
      
      // Diário Emocional
      getDiarioEmocional: (data?: any) => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "diario_emocional" }),
      createDiarioEmocional: (data: any) => mentorApi.createAlunoDiarioEmocional({ ...data, alunoId: mentorView.alunoId }),
      deleteDiarioEmocional: (registroId: string) => mentorApi.deleteAlunoDiarioEmocional({ alunoId: mentorView.alunoId, registroId }),
      
      // Autodiagnóstico
      getAutodiagnosticos: () => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "autodiagnosticos" }),
      createAutodiagnostico: (data: any) => mentorApi.createAlunoAutodiagnostico({ ...data, alunoId: mentorView.alunoId }),
      deleteAutodiagnostico: (autodiagnosticoId: string) => mentorApi.deleteAlunoAutodiagnostico({ alunoId: mentorView.alunoId, autodiagnosticoId }),
      
      // Progresso (conteúdos ENEM)
      getProgresso: (materia?: string) => mentorApi.getAlunoData({ alunoId: mentorView.alunoId, collection: "progresso" }),
      updateProgresso: (data: any) => mentorApi.updateAlunoProgresso({ ...data, alunoId: mentorView.alunoId }),
      
      // Profile
      getMe: () => mentorApi.getAlunoById(mentorView.alunoId),
      updateProfile: (data: any) => mentorApi.updateAlunoProfile({ ...data, alunoId: mentorView.alunoId }),
    };
  }
  
  // Modo aluno: usar API normal do aluno
  return alunoApi;
}

import { useMentorView } from "@/pages/mentor/MentorViewAluno";
import { mentorApi } from "@/lib/api";
import { cachedAlunoApi, cachedMentorApi } from "@/lib/cachedApi";
import { cache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

/**
 * Hook que retorna a API correta dependendo se está em modo mentor ou aluno
 * Usa cache em memória para melhorar performance
 */
export function useAlunoApi() {
  const mentorView = useMentorView();
  
  if (mentorView?.isMentorView && mentorView?.alunoId) {
    const alunoId = mentorView.alunoId;
    
    // Modo mentor: usar funções do mentor com alunoId e cache
    return {
      // Estudos
      getEstudos: () => cache.getOrFetch(
        CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "estudos"),
        () => mentorApi.getAlunoData({ alunoId, collection: "estudos" }),
        CACHE_TTL.MEDIUM
      ),
      createEstudo: async (data: any) => {
        const result = await mentorApi.createAlunoEstudo({ ...data, alunoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "estudos"));
        return result;
      },
      updateEstudo: async (estudoId: string, data: any) => {
        const result = await mentorApi.updateAlunoEstudo({ ...data, alunoId, estudoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "estudos"));
        return result;
      },
      deleteEstudo: async (estudoId: string) => {
        const result = await mentorApi.deleteAlunoEstudo({ alunoId, estudoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "estudos"));
        return result;
      },
      
      // Simulados
      getSimulados: () => cache.getOrFetch(
        CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "simulados"),
        () => mentorApi.getAlunoData({ alunoId, collection: "simulados" }),
        CACHE_TTL.MEDIUM
      ),
      createSimulado: async (data: any) => {
        const result = await mentorApi.createAlunoSimulado({ ...data, alunoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "simulados"));
        return result;
      },
      updateSimulado: async (data: any) => {
        const result = await mentorApi.updateAlunoSimulado({ ...data, alunoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "simulados"));
        return result;
      },
      deleteSimulado: async (simuladoId: string) => {
        const result = await mentorApi.deleteAlunoSimulado({ alunoId, simuladoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "simulados"));
        return result;
      },
      
      // Métricas
      getMetricas: () => cache.getOrFetch(
        CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "metricas"),
        () => mentorApi.getAlunoData({ alunoId, collection: "metricas" }),
        CACHE_TTL.MEDIUM
      ),
      
      // Cronograma
      getCronograma: () => cache.getOrFetch(
        CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "cronogramas"),
        () => mentorApi.getAlunoData({ alunoId, collection: "cronogramas" }),
        CACHE_TTL.MEDIUM
      ),
      createCronograma: (data: any) => mentorApi.createAlunoCronograma({ ...data, alunoId }),
      updateCronograma: (data: any) => mentorApi.updateAlunoCronograma({ ...data, alunoId }),
      deleteCronograma: (cronogramaId: string) => mentorApi.deleteAlunoCronograma({ alunoId, cronogramaId }),
      
      // Tarefas
      getTarefas: (cronogramaId: string) => {
        return Promise.resolve([]);
      },
      createTarefa: (data: any) => mentorApi.createAlunoTarefa({ ...data, alunoId }),
      updateTarefa: (data: any) => mentorApi.updateAlunoTarefa({ ...data, alunoId }),
      deleteTarefa: (tarefaId: string, cronogramaId: string) => mentorApi.deleteAlunoTarefa({ alunoId, cronogramaId, tarefaId }),
      
      // Horários
      getHorarios: () => cache.getOrFetch(
        CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "horarios"),
        () => mentorApi.getAlunoData({ alunoId, collection: "horarios" }),
        CACHE_TTL.MEDIUM
      ),
      createHorario: async (data: any) => {
        const result = await mentorApi.createAlunoHorario({ ...data, alunoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "horarios"));
        return result;
      },
      updateHorario: async (data: any) => {
        const result = await mentorApi.updateAlunoHorario({ ...data, alunoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "horarios"));
        return result;
      },
      deleteHorario: async (horarioId: string) => {
        const result = await mentorApi.deleteAlunoHorario({ alunoId, horarioId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "horarios"));
        return result;
      },
      clearAllHorarios: async () => {
        const result = await mentorApi.clearAlunoHorarios({ alunoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "horarios"));
        return result;
      },
      
      // Templates
      getTemplates: () => cache.getOrFetch(
        CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "templates"),
        () => mentorApi.getAlunoData({ alunoId, collection: "templates" }),
        CACHE_TTL.LONG
      ),
      saveTemplate: async (data: any) => {
        const result = await mentorApi.saveAlunoTemplate({ ...data, alunoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "templates"));
        return result;
      },
      loadTemplate: (templateId: string) => mentorApi.loadAlunoTemplate({ alunoId, templateId }),
      deleteTemplate: async (templateId: string) => {
        const result = await mentorApi.deleteAlunoTemplate({ alunoId, templateId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "templates"));
        return result;
      },
      
      // Diário Emocional
      getDiarioEmocional: (data?: any) => cache.getOrFetch(
        CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "diario_emocional"),
        () => mentorApi.getAlunoData({ alunoId, collection: "diario_emocional" }),
        CACHE_TTL.MEDIUM
      ),
      createDiarioEmocional: async (data: any) => {
        const result = await mentorApi.createAlunoDiarioEmocional({ ...data, alunoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "diario_emocional"));
        return result;
      },
      deleteDiarioEmocional: async (registroId: string) => {
        const result = await mentorApi.deleteAlunoDiarioEmocional({ alunoId, registroId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "diario_emocional"));
        return result;
      },
      
      // Autodiagnóstico
      getAutodiagnosticos: () => cache.getOrFetch(
        CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "autodiagnosticos"),
        () => mentorApi.getAlunoData({ alunoId, collection: "autodiagnosticos" }),
        CACHE_TTL.MEDIUM
      ),
      createAutodiagnostico: async (data: any) => {
        const result = await mentorApi.createAlunoAutodiagnostico({ ...data, alunoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "autodiagnosticos"));
        return result;
      },
      deleteAutodiagnostico: async (autodiagnosticoId: string) => {
        const result = await mentorApi.deleteAlunoAutodiagnostico({ alunoId, autodiagnosticoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "autodiagnosticos"));
        return result;
      },
      
      // Progresso (conteúdos ENEM)
      getProgresso: (materia?: string) => cache.getOrFetch(
        CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, `progresso:${materia || 'all'}`),
        () => mentorApi.getAlunoData({ alunoId, collection: "progresso" }),
        CACHE_TTL.MEDIUM
      ),
      updateProgresso: async (data: any) => {
        const result = await mentorApi.updateAlunoProgresso({ ...data, alunoId });
        cache.deleteByPrefix(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "progresso"));
        return result;
      },
      
      // Profile
      getMe: () => cache.getOrFetch(
        CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "profile"),
        () => mentorApi.getAlunoById(alunoId),
        CACHE_TTL.LONG
      ),
      updateProfile: async (data: any) => {
        const result = await mentorApi.updateAlunoProfile({ ...data, alunoId });
        cache.delete(CACHE_KEYS.MENTOR_ALUNO_DATA(alunoId, "profile"));
        return result;
      },
    };
  }
  
  // Modo aluno: usar API com cache
  return cachedAlunoApi;
}

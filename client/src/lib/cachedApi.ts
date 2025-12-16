/**
 * API com cache integrado para melhorar performance
 * Usa o sistema de cache em memória para evitar chamadas repetidas ao backend
 */

import { alunoApi, mentorApi } from "./api";
import { cache, CACHE_KEYS, CACHE_TTL, invalidateEstudosCache, invalidateSimuladosCache, invalidateHorariosCache, invalidateMetasCache } from "./cache";

/**
 * API do Aluno com cache
 */
export const cachedAlunoApi = {
  // ========== LEITURA COM CACHE ==========
  
  getMe: () => cache.getOrFetch(
    CACHE_KEYS.ALUNO_ME,
    () => alunoApi.getMe(),
    CACHE_TTL.LONG
  ),

  getEstudos: () => cache.getOrFetch(
    CACHE_KEYS.ALUNO_ESTUDOS,
    () => alunoApi.getEstudos(),
    CACHE_TTL.MEDIUM
  ),

  getSimulados: () => cache.getOrFetch(
    CACHE_KEYS.ALUNO_SIMULADOS,
    () => alunoApi.getSimulados(),
    CACHE_TTL.MEDIUM
  ),

  getHorarios: () => cache.getOrFetch(
    CACHE_KEYS.ALUNO_HORARIOS,
    () => alunoApi.getHorarios(),
    CACHE_TTL.MEDIUM
  ),

  getTemplates: () => cache.getOrFetch(
    CACHE_KEYS.ALUNO_TEMPLATES,
    () => alunoApi.getTemplates(),
    CACHE_TTL.LONG
  ),

  getMetas: () => cache.getOrFetch(
    CACHE_KEYS.ALUNO_METAS,
    () => alunoApi.getMetas(),
    CACHE_TTL.MEDIUM
  ),

  getProgresso: (materia?: string) => cache.getOrFetch(
    `${CACHE_KEYS.ALUNO_PROGRESSO}:${materia || 'all'}`,
    () => alunoApi.getProgresso(materia),
    CACHE_TTL.MEDIUM
  ),

  getAutodiagnosticos: () => cache.getOrFetch(
    CACHE_KEYS.ALUNO_AUTODIAGNOSTICOS,
    () => alunoApi.getAutodiagnosticos(),
    CACHE_TTL.MEDIUM
  ),

  getDiarioEmocional: (data?: { dataInicio?: string; dataFim?: string }) => cache.getOrFetch(
    `${CACHE_KEYS.ALUNO_DIARIO}:${data?.dataInicio || ''}:${data?.dataFim || ''}`,
    () => alunoApi.getDiarioEmocional(data),
    CACHE_TTL.MEDIUM
  ),

  // ========== ESCRITA COM INVALIDAÇÃO DE CACHE ==========

  createEstudo: async (data: Parameters<typeof alunoApi.createEstudo>[0]) => {
    const result = await alunoApi.createEstudo(data);
    invalidateEstudosCache();
    return result;
  },

  updateEstudo: async (estudoId: string, data: Parameters<typeof alunoApi.updateEstudo>[1]) => {
    const result = await alunoApi.updateEstudo(estudoId, data);
    invalidateEstudosCache();
    return result;
  },

  deleteEstudo: async (estudoId: string) => {
    const result = await alunoApi.deleteEstudo(estudoId);
    invalidateEstudosCache();
    return result;
  },

  createSimulado: async (data: Parameters<typeof alunoApi.createSimulado>[0]) => {
    const result = await alunoApi.createSimulado(data);
    invalidateSimuladosCache();
    return result;
  },

  updateSimulado: async (data: Parameters<typeof alunoApi.updateSimulado>[0]) => {
    const result = await alunoApi.updateSimulado(data);
    invalidateSimuladosCache();
    return result;
  },

  deleteSimulado: async (simuladoId: string) => {
    const result = await alunoApi.deleteSimulado(simuladoId);
    invalidateSimuladosCache();
    return result;
  },

  createHorario: async (data: Parameters<typeof alunoApi.createHorario>[0]) => {
    const result = await alunoApi.createHorario(data);
    invalidateHorariosCache();
    return result;
  },

  updateHorario: async (data: Parameters<typeof alunoApi.updateHorario>[0]) => {
    const result = await alunoApi.updateHorario(data);
    invalidateHorariosCache();
    return result;
  },

  deleteHorario: async (horarioId: string) => {
    const result = await alunoApi.deleteHorario(horarioId);
    invalidateHorariosCache();
    return result;
  },

  clearAllHorarios: async () => {
    const result = await alunoApi.clearAllHorarios();
    invalidateHorariosCache();
    return result;
  },

  saveTemplate: async (data: Parameters<typeof alunoApi.saveTemplate>[0]) => {
    const result = await alunoApi.saveTemplate(data);
    cache.delete(CACHE_KEYS.ALUNO_TEMPLATES);
    return result;
  },

  deleteTemplate: async (templateId: string) => {
    const result = await alunoApi.deleteTemplate(templateId);
    cache.delete(CACHE_KEYS.ALUNO_TEMPLATES);
    return result;
  },

  createMeta: async (data: Parameters<typeof alunoApi.createMeta>[0]) => {
    const result = await alunoApi.createMeta(data);
    invalidateMetasCache();
    return result;
  },

  updateMeta: async (data: Parameters<typeof alunoApi.updateMeta>[0]) => {
    const result = await alunoApi.updateMeta(data);
    invalidateMetasCache();
    return result;
  },

  deleteMeta: async (metaId: string) => {
    const result = await alunoApi.deleteMeta(metaId);
    invalidateMetasCache();
    return result;
  },

  updateMetaProgress: async (data: Parameters<typeof alunoApi.updateMetaProgress>[0]) => {
    const result = await alunoApi.updateMetaProgress(data);
    invalidateMetasCache();
    return result;
  },

  createAutodiagnostico: async (data: Parameters<typeof alunoApi.createAutodiagnostico>[0]) => {
    const result = await alunoApi.createAutodiagnostico(data);
    cache.delete(CACHE_KEYS.ALUNO_AUTODIAGNOSTICOS);
    return result;
  },

  updateAutodiagnostico: async (autodiagnosticoId: string, data: Parameters<typeof alunoApi.updateAutodiagnostico>[1]) => {
    const result = await alunoApi.updateAutodiagnostico(autodiagnosticoId, data);
    cache.delete(CACHE_KEYS.ALUNO_AUTODIAGNOSTICOS);
    return result;
  },

  deleteAutodiagnostico: async (autodiagnosticoId: string) => {
    const result = await alunoApi.deleteAutodiagnostico(autodiagnosticoId);
    cache.delete(CACHE_KEYS.ALUNO_AUTODIAGNOSTICOS);
    return result;
  },

  createDiarioEmocional: async (data: Parameters<typeof alunoApi.createDiarioEmocional>[0]) => {
    const result = await alunoApi.createDiarioEmocional(data);
    cache.deleteByPrefix(CACHE_KEYS.ALUNO_DIARIO);
    return result;
  },

  deleteDiarioEmocional: async (registroId: string) => {
    const result = await alunoApi.deleteDiarioEmocional(registroId);
    cache.deleteByPrefix(CACHE_KEYS.ALUNO_DIARIO);
    return result;
  },

  // ========== FUNÇÕES SEM CACHE (passthrough) ==========
  
  updateProfile: alunoApi.updateProfile,
  loadTemplate: alunoApi.loadTemplate,
  updateProgresso: async (data: Parameters<typeof alunoApi.updateProgresso>[0]) => {
    const result = await alunoApi.updateProgresso(data);
    cache.deleteByPrefix(CACHE_KEYS.ALUNO_PROGRESSO);
    return result;
  },
  getMetricas: alunoApi.getMetricas,
  getCronograma: alunoApi.getCronograma,
  createCronograma: alunoApi.createCronograma,
  updateCronograma: alunoApi.updateCronograma,
  deleteCronograma: alunoApi.deleteCronograma,
  getTarefas: alunoApi.getTarefas,
  createTarefa: alunoApi.createTarefa,
  updateTarefa: alunoApi.updateTarefa,
  deleteTarefa: alunoApi.deleteTarefa,
  checkExpiredMetas: alunoApi.checkExpiredMetas,
};

/**
 * API do Mentor com cache
 */
export const cachedMentorApi = {
  getMe: () => cache.getOrFetch(
    CACHE_KEYS.MENTOR_ME,
    () => mentorApi.getMe(),
    CACHE_TTL.LONG
  ),

  getAlunos: () => cache.getOrFetch(
    CACHE_KEYS.MENTOR_ALUNOS,
    () => mentorApi.getAlunos(),
    CACHE_TTL.MEDIUM
  ),

  getAlunosMetricas: () => cache.getOrFetch(
    CACHE_KEYS.MENTOR_METRICAS,
    () => mentorApi.getAlunosMetricas(),
    CACHE_TTL.MEDIUM
  ),

  getAlunoData: (data: { alunoId: string; collection: string }) => cache.getOrFetch(
    CACHE_KEYS.MENTOR_ALUNO_DATA(data.alunoId, data.collection),
    () => mentorApi.getAlunoData(data),
    CACHE_TTL.MEDIUM
  ),

  // Funções de escrita com invalidação
  createAluno: async (data: Parameters<typeof mentorApi.createAluno>[0]) => {
    const result = await mentorApi.createAluno(data);
    cache.delete(CACHE_KEYS.MENTOR_ALUNOS);
    return result;
  },

  updateAluno: async (data: Parameters<typeof mentorApi.updateAluno>[0]) => {
    const result = await mentorApi.updateAluno(data);
    cache.delete(CACHE_KEYS.MENTOR_ALUNOS);
    return result;
  },

  deleteAluno: async (alunoId: string) => {
    const result = await mentorApi.deleteAluno(alunoId);
    cache.delete(CACHE_KEYS.MENTOR_ALUNOS);
    cache.deleteByPrefix(`mentor:aluno:${alunoId}`);
    return result;
  },

  // Passthrough para outras funções
  toggleAlunoStatus: mentorApi.toggleAlunoStatus,
  getConfig: mentorApi.getConfig,
  updateConfig: mentorApi.updateConfig,
  getAlunoEstudos: mentorApi.getAlunoEstudos,
  getAlunoSimulados: mentorApi.getAlunoSimulados,
  getAlunoDashboard: mentorApi.getAlunoDashboard,
  getAlunoAreaCompleta: mentorApi.getAlunoAreaCompleta,
  getEvolucaoAlunos: mentorApi.getEvolucaoAlunos,
  createAlunoEstudo: mentorApi.createAlunoEstudo,
  updateAlunoEstudo: mentorApi.updateAlunoEstudo,
  deleteAlunoEstudo: mentorApi.deleteAlunoEstudo,
  createAlunoSimulado: mentorApi.createAlunoSimulado,
  updateAlunoSimulado: mentorApi.updateAlunoSimulado,
  deleteAlunoSimulado: mentorApi.deleteAlunoSimulado,
  createAlunoHorario: mentorApi.createAlunoHorario,
  updateAlunoHorario: mentorApi.updateAlunoHorario,
  deleteAlunoHorario: mentorApi.deleteAlunoHorario,
  clearAlunoHorarios: mentorApi.clearAlunoHorarios,
  saveAlunoTemplate: mentorApi.saveAlunoTemplate,
  loadAlunoTemplate: mentorApi.loadAlunoTemplate,
  deleteAlunoTemplate: mentorApi.deleteAlunoTemplate,
  createAlunoDiarioEmocional: mentorApi.createAlunoDiarioEmocional,
  deleteAlunoDiarioEmocional: mentorApi.deleteAlunoDiarioEmocional,
  createAlunoAutodiagnostico: mentorApi.createAlunoAutodiagnostico,
  deleteAlunoAutodiagnostico: mentorApi.deleteAlunoAutodiagnostico,
  updateAlunoProgresso: mentorApi.updateAlunoProgresso,
  updateAlunoProfile: mentorApi.updateAlunoProfile,
  createAlunoCronograma: mentorApi.createAlunoCronograma,
  updateAlunoCronograma: mentorApi.updateAlunoCronograma,
  deleteAlunoCronograma: mentorApi.deleteAlunoCronograma,
  createAlunoTarefa: mentorApi.createAlunoTarefa,
  updateAlunoTarefa: mentorApi.updateAlunoTarefa,
  deleteAlunoTarefa: mentorApi.deleteAlunoTarefa,
  createAlunoMeta: mentorApi.createAlunoMeta,
  updateAlunoMeta: mentorApi.updateAlunoMeta,
  deleteAlunoMeta: mentorApi.deleteAlunoMeta,
};

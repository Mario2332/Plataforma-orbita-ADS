import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./firebase";

const functions = getFunctions(app);

// Helper para chamar Cloud Functions
async function callFunction<T = any, R = any>(functionName: string, data?: T): Promise<R> {
  const callable = httpsCallable<T, R>(functions, functionName);
  const result = await callable(data);
  return result.data;
}

// ============================================
// GESTOR API
// ============================================

export const gestorApi = {
  // Mentores
  getMentores: () => callFunction("gestor_getMentores"),
  createMentor: (data: {
    nome: string;
    email: string;
    nomePlataforma: string;
    logoUrl?: string;
    corPrincipal?: string;
  }) => callFunction("gestor_createMentor", data),
  
  updateMentor: (data: {
    mentorId: string;
    nome?: string;
    email?: string;
    nomePlataforma?: string;
    logoUrl?: string;
    corPrincipal?: string;
  }) => callFunction("gestor_updateMentor", data),
  
  deleteMentor: (mentorId: string) => callFunction("gestor_deleteMentor", { mentorId }),
  
  toggleMentorStatus: (mentorId: string) => callFunction("gestor_toggleMentorStatus", { mentorId }),

  // Alunos
  getAllAlunos: () => callFunction("gestor_getAllAlunos"),
  updateAluno: (data: {
    alunoId: string;
    nome?: string;
    email?: string;
    mentorId?: string;
  }) => callFunction("gestor_updateAluno", data),
  deleteAluno: (alunoId: string) => callFunction("gestor_deleteAluno", { alunoId }),
};

// ============================================
// MENTOR API
// ============================================

export const mentorApi = {
  // Alunos
  getAlunos: () => callFunction("mentor_getAlunos"),
  createAluno: (data: {
    nome: string;
    email: string;
    celular?: string;
    plano?: string;
  }) => callFunction("mentor_createAluno", data),
  
  updateAluno: (data: {
    alunoId: string;
    nome?: string;
    email?: string;
    celular?: string;
    plano?: string;
  }) => callFunction("mentor_updateAluno", data),
  
  deleteAluno: (alunoId: string) => callFunction("mentor_deleteAluno", { alunoId }),
  
  toggleAlunoStatus: (alunoId: string) => callFunction("mentor_toggleAlunoStatus", { alunoId }),

  // Configurações
  getConfig: () => callFunction("mentor_getConfig"),
  updateConfig: (data: {
    nomePlataforma?: string;
    logoUrl?: string;
    corPrincipal?: string;
  }) => callFunction("mentor_updateConfig", data),
};

// ============================================
// ALUNO API
// ============================================

export const alunoApi = {
  // Estudos
  getEstudos: () => callFunction("aluno_getEstudos"),
  createEstudo: (data: {
    materia: string;
    topico: string;
    tempoMinutos: number;
    observacoes?: string;
  }) => callFunction("aluno_createEstudo", data),
  
  updateEstudo: (data: {
    estudoId: string;
    materia?: string;
    topico?: string;
    tempoMinutos?: number;
    observacoes?: string;
  }) => callFunction("aluno_updateEstudo", data),
  
  deleteEstudo: (estudoId: string) => callFunction("aluno_deleteEstudo", { estudoId }),

  // Simulados
  getSimulados: () => callFunction("aluno_getSimulados"),
  createSimulado: (data: {
    nome: string;
    data: Date;
    notaTotal: number;
    notaRedacao?: number;
    notaMatematica?: number;
    notaLinguagens?: number;
    notaCienciasNatureza?: number;
    notaCienciasHumanas?: number;
    observacoes?: string;
  }) => callFunction("aluno_createSimulado", data),
  
  updateSimulado: (data: {
    simuladoId: string;
    nome?: string;
    data?: Date;
    notaTotal?: number;
    notaRedacao?: number;
    notaMatematica?: number;
    notaLinguagens?: number;
    notaCienciasNatureza?: number;
    notaCienciasHumanas?: number;
    observacoes?: string;
  }) => callFunction("aluno_updateSimulado", data),
  
  deleteSimulado: (simuladoId: string) => callFunction("aluno_deleteSimulado", { simuladoId }),

  // Métricas
  getMetricas: () => callFunction("aluno_getMetricas"),

  // Cronograma
  getCronograma: () => callFunction("aluno_getCronograma"),
  createCronograma: (data: {
    nome: string;
    descricao?: string;
    dataInicio: Date;
    dataFim: Date;
    templateId?: string;
  }) => callFunction("aluno_createCronograma", data),
  
  updateCronograma: (data: {
    cronogramaId: string;
    nome?: string;
    descricao?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) => callFunction("aluno_updateCronograma", data),
  
  deleteCronograma: (cronogramaId: string) => callFunction("aluno_deleteCronograma", { cronogramaId }),

  // Tarefas do Cronograma
  getTarefas: (cronogramaId: string) => callFunction("aluno_getTarefas", { cronogramaId }),
  createTarefa: (data: {
    cronogramaId: string;
    titulo: string;
    descricao?: string;
    data: Date;
    materia?: string;
  }) => callFunction("aluno_createTarefa", data),
  
  updateTarefa: (data: {
    tarefaId: string;
    titulo?: string;
    descricao?: string;
    data?: Date;
    materia?: string;
    concluida?: boolean;
  }) => callFunction("aluno_updateTarefa", data),
  
  deleteTarefa: (tarefaId: string) => callFunction("aluno_deleteTarefa", { tarefaId }),

  // Conteúdos ENEM
  getProgresso: (materia?: string) => callFunction("aluno_getProgresso", { materia }),
  updateProgresso: (data: {
    materia: string;
    topico: string;
    concluido: boolean;
  }) => callFunction("aluno_updateProgresso", data),
};

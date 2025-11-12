import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

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
  getMentores: () => callFunction("gestorFunctions-getMentores"),
  createMentor: (data: {
    nome: string;
    email: string;
    password: string;
    nomePlataforma: string;
    logoUrl?: string;
    corPrincipal?: string;
  }) => callFunction("gestorFunctions-createMentor", data),
  
  updateMentor: (data: {
    mentorId: string;
    nome?: string;
    email?: string;
    nomePlataforma?: string;
    logoUrl?: string;
    corPrincipal?: string;
  }) => callFunction("gestorFunctions-updateMentor", data),
  
  deleteMentor: (mentorId: string) => callFunction("gestorFunctions-deleteMentor", { mentorId }),
  
  toggleMentorStatus: (mentorId: string) => callFunction("gestorFunctions-toggleMentorStatus", { mentorId }),

  // Alunos
  getAllAlunos: () => callFunction("gestorFunctions-getAllAlunos"),
  updateAluno: (data: {
    alunoId: string;
    nome?: string;
    email?: string;
    mentorId?: string;
  }) => callFunction("gestorFunctions-updateAluno", data),
  deleteAluno: (alunoId: string) => callFunction("gestorFunctions-deleteAluno", { alunoId }),
};

// ============================================
// MENTOR API
// ============================================

export const mentorApi = {
  // Alunos
  getAlunos: () => callFunction("mentorFunctions-getAlunos"),
  createAluno: (data: {
    nome: string;
    email: string;
    celular?: string;
    plano?: string;
  }) => callFunction("mentorFunctions-createAluno", data),
  
  updateAluno: (data: {
    alunoId: string;
    nome?: string;
    email?: string;
    celular?: string;
    plano?: string;
  }) => callFunction("mentorFunctions-updateAluno", data),
  
  deleteAluno: (alunoId: string) => callFunction("mentorFunctions-deleteAluno", { alunoId }),
  
  toggleAlunoStatus: (alunoId: string) => callFunction("mentorFunctions-toggleAlunoStatus", { alunoId }),

  // Configurações
  getConfig: () => callFunction("mentorFunctions-getConfig"),
  updateConfig: (data: {
    nomePlataforma?: string;
    logoUrl?: string;
    corPrincipal?: string;
  }) => callFunction("mentorFunctions-updateConfig", data),
};

// ============================================
// ALUNO API
// ============================================

export const alunoApi = {
  // Profile
  getMe: () => callFunction("alunoFunctions-getMe"),
  updateProfile: (data: {
    nome?: string;
    celular?: string;
  }) => callFunction("alunoFunctions-updateProfile", data),
  // Estudos
  getEstudos: () => callFunction("alunoFunctions-getEstudos"),
  createEstudo: (data: {
    materia: string;
    topico: string;
    tempoMinutos: number;
    observacoes?: string;
  }) => callFunction("alunoFunctions-createEstudo", data),
  
  updateEstudo: (data: {
    estudoId: string;
    materia?: string;
    topico?: string;
    tempoMinutos?: number;
    observacoes?: string;
  }) => callFunction("alunoFunctions-updateEstudo", data),
  
  deleteEstudo: (estudoId: string) => callFunction("alunoFunctions-deleteEstudo", { estudoId }),

  // Simulados
  getSimulados: () => callFunction("alunoFunctions-getSimulados"),
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
  }) => callFunction("alunoFunctions-createSimulado", data),
  
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
  }) => callFunction("alunoFunctions-updateSimulado", data),
  
  deleteSimulado: (simuladoId: string) => callFunction("alunoFunctions-deleteSimulado", { simuladoId }),

  // Métricas
  getMetricas: () => callFunction("alunoFunctions-getMetricas"),

  // Cronograma
  getCronograma: () => callFunction("alunoFunctions-getCronograma"),
  createCronograma: (data: {
    nome: string;
    descricao?: string;
    dataInicio: Date;
    dataFim: Date;
    templateId?: string;
  }) => callFunction("alunoFunctions-createCronograma", data),
  
  updateCronograma: (data: {
    cronogramaId: string;
    nome?: string;
    descricao?: string;
    dataInicio?: Date;
    dataFim?: Date;
  }) => callFunction("alunoFunctions-updateCronograma", data),
  
  deleteCronograma: (cronogramaId: string) => callFunction("alunoFunctions-deleteCronograma", { cronogramaId }),

  // Tarefas do Cronograma
  getTarefas: (cronogramaId: string) => callFunction("alunoFunctions-getTarefas", { cronogramaId }),
  createTarefa: (data: {
    cronogramaId: string;
    titulo: string;
    descricao?: string;
    data: Date;
    materia?: string;
  }) => callFunction("alunoFunctions-createTarefa", data),
  
  updateTarefa: (data: {
    tarefaId: string;
    titulo?: string;
    descricao?: string;
    data?: Date;
    materia?: string;
    concluida?: boolean;
  }) => callFunction("alunoFunctions-updateTarefa", data),
  
  deleteTarefa: (tarefaId: string) => callFunction("alunoFunctions-deleteTarefa", { tarefaId }),

  // Conteúdos ENEM
  getProgresso: (materia?: string) => callFunction("getProgresso", { materia }),
  updateProgresso: (data: {
    materia: string;
    topico: string;
    concluido: boolean;
  }) => callFunction("updateProgresso", data),
};

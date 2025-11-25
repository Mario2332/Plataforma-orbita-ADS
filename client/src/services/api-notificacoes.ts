import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

export interface Notificacao {
  id: string;
  alunoId: string;
  tipo: 'meta_concluida' | 'meta_criada' | 'meta_expirada' | 'meta_proxima_expirar' | 'progresso_25' | 'progresso_50' | 'progresso_75' | 'sequencia_mantida';
  titulo: string;
  mensagem: string;
  metaId?: string;
  metaNome?: string;
  lida: boolean;
  createdAt: { seconds: number; nanoseconds: number };
}

/**
 * Listar notificações do aluno
 */
export const getNotificacoes = async (limite: number = 50, apenasNaoLidas: boolean = false): Promise<Notificacao[]> => {
  const callable = httpsCallable(functions, 'notificacoesFunctions-getNotificacoes');
  const result = await callable({ limite, apenasNaoLidas });
  return result.data as Notificacao[];
};

/**
 * Marcar notificação como lida
 */
export const marcarNotificacaoLida = async (notificacaoId: string): Promise<void> => {
  const callable = httpsCallable(functions, 'notificacoesFunctions-marcarNotificacaoLida');
  await callable({ notificacaoId });
};

/**
 * Marcar todas as notificações como lidas
 */
export const marcarTodasNotificacoesLidas = async (): Promise<{ count: number }> => {
  const callable = httpsCallable(functions, 'notificacoesFunctions-marcarTodasNotificacoesLidas');
  const result = await callable({});
  return result.data as { count: number };
};

/**
 * Deletar notificação
 */
export const deletarNotificacao = async (notificacaoId: string): Promise<void> => {
  const callable = httpsCallable(functions, 'notificacoesFunctions-deletarNotificacao');
  await callable({ notificacaoId });
};

/**
 * Contar notificações não lidas
 */
export const contarNotificacoesNaoLidas = async (): Promise<number> => {
  const callable = httpsCallable(functions, 'notificacoesFunctions-contarNotificacoesNaoLidas');
  const result = await callable({});
  return (result.data as { count: number }).count;
};

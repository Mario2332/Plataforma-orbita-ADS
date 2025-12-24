import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getAuthContext, requireRole } from "../utils/auth";

const db = admin.firestore();

/**
 * Tipos de notificações disponíveis
 */
export type TipoNotificacao = 
  | 'meta_concluida'
  | 'meta_criada'
  | 'meta_expirada'
  | 'meta_proxima_expirar'
  | 'progresso_25'
  | 'progresso_50'
  | 'progresso_75'
  | 'sequencia_mantida';

/**
 * Interface da Notificação
 */
export interface Notificacao {
  id?: string;
  alunoId: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  metaId?: string;
  metaNome?: string;
  lida: boolean;
  createdAt: admin.firestore.Timestamp;
}

/**
 * Criar notificação
 */
export async function criarNotificacao(
  alunoId: string,
  tipo: TipoNotificacao,
  titulo: string,
  mensagem: string,
  metaId?: string,
  metaNome?: string
): Promise<void> {
  try {
    const notificacaoData: Omit<Notificacao, 'id'> = {
      alunoId,
      tipo,
      titulo,
      mensagem,
      lida: false,
      createdAt: admin.firestore.Timestamp.now(),
    };

    if (metaId) notificacaoData.metaId = metaId;
    if (metaNome) notificacaoData.metaNome = metaNome;

    await db
      .collection("alunos")
      .doc(alunoId)
      .collection("notificacoes")
      .add(notificacaoData);

    functions.logger.info(`Notificação criada para aluno ${alunoId}: ${tipo}`);
  } catch (error: any) {
    functions.logger.error("Erro ao criar notificação:", error);
  }
}

/**
 * Listar notificações do aluno
 */
const getNotificacoes = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { limite = 50, apenasNaoLidas = false } = data;

    try {
      let query = db
        .collection("alunos")
        .doc(auth.uid)
        .collection("notificacoes")
        .orderBy("createdAt", "desc")
        .limit(limite);

      if (apenasNaoLidas) {
        query = query.where("lida", "==", false) as any;
      }

      const snapshot = await query.get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error: any) {
      functions.logger.error("Erro ao listar notificações:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Marcar notificação como lida
 */
const marcarNotificacaoLida = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { notificacaoId } = data;

    if (!notificacaoId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID da notificação é obrigatório"
      );
    }

    try {
      await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("notificacoes")
        .doc(notificacaoId)
        .update({
          lida: true,
        });

      return { success: true };
    } catch (error: any) {
      functions.logger.error("Erro ao marcar notificação como lida:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Marcar todas as notificações como lidas
 */
const marcarTodasNotificacoesLidas = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    try {
      const snapshot = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("notificacoes")
        .where("lida", "==", false)
        .get();

      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { lida: true });
      });

      await batch.commit();

      return { success: true, count: snapshot.size };
    } catch (error: any) {
      functions.logger.error("Erro ao marcar todas notificações como lidas:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Deletar notificação
 */
const deletarNotificacao = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { notificacaoId } = data;

    if (!notificacaoId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "ID da notificação é obrigatório"
      );
    }

    try {
      await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("notificacoes")
        .doc(notificacaoId)
        .delete();

      return { success: true };
    } catch (error: any) {
      functions.logger.error("Erro ao deletar notificação:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Contar notificações não lidas
 */
const contarNotificacoesNaoLidas = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    try {
      const snapshot = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("notificacoes")
        .where("lida", "==", false)
        .get();

      return { count: snapshot.size };
    } catch (error: any) {
      functions.logger.error("Erro ao contar notificações não lidas:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

export const notificacoesFunctions = {
  getNotificacoes,
  marcarNotificacaoLida,
  marcarTodasNotificacoesLidas,
  deletarNotificacao,
  contarNotificacoesNaoLidas,
};

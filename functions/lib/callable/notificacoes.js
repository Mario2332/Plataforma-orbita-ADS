"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificacoesFunctions = void 0;
exports.criarNotificacao = criarNotificacao;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const db = admin.firestore();
/**
 * Criar notificação
 */
async function criarNotificacao(alunoId, tipo, titulo, mensagem, metaId, metaNome) {
    try {
        const notificacaoData = {
            alunoId,
            tipo,
            titulo,
            mensagem,
            lida: false,
            createdAt: admin.firestore.Timestamp.now(),
        };
        if (metaId)
            notificacaoData.metaId = metaId;
        if (metaNome)
            notificacaoData.metaNome = metaNome;
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("notificacoes")
            .add(notificacaoData);
        functions.logger.info(`Notificação criada para aluno ${alunoId}: ${tipo}`);
    }
    catch (error) {
        functions.logger.error("Erro ao criar notificação:", error);
    }
}
/**
 * Listar notificações do aluno
 */
const getNotificacoes = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const { limite = 50, apenasNaoLidas = false } = data;
    try {
        let query = db
            .collection("alunos")
            .doc(auth.uid)
            .collection("notificacoes")
            .orderBy("createdAt", "desc")
            .limit(limite);
        if (apenasNaoLidas) {
            query = query.where("lida", "==", false);
        }
        const snapshot = await query.get();
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    }
    catch (error) {
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
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const { notificacaoId } = data;
    if (!notificacaoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID da notificação é obrigatório");
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
    }
    catch (error) {
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
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
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
    }
    catch (error) {
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
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const { notificacaoId } = data;
    if (!notificacaoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID da notificação é obrigatório");
    }
    try {
        await db
            .collection("alunos")
            .doc(auth.uid)
            .collection("notificacoes")
            .doc(notificacaoId)
            .delete();
        return { success: true };
    }
    catch (error) {
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
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    try {
        const snapshot = await db
            .collection("alunos")
            .doc(auth.uid)
            .collection("notificacoes")
            .where("lida", "==", false)
            .get();
        return { count: snapshot.size };
    }
    catch (error) {
        functions.logger.error("Erro ao contar notificações não lidas:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
exports.notificacoesFunctions = {
    getNotificacoes,
    marcarNotificacaoLida,
    marcarTodasNotificacoesLidas,
    deletarNotificacao,
    contarNotificacoesNaoLidas,
};
//# sourceMappingURL=notificacoes.js.map
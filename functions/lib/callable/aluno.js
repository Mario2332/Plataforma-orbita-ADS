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
exports.alunoFunctions = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const db = admin.firestore();
/**
 * Obter dados do aluno logado
 */
const getMe = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const alunoDoc = await db.collection("alunos").doc(auth.uid).get();
    if (!alunoDoc.exists) {
        // Se documento aluno não existe, buscar dados básicos do users
        const userDoc = await db.collection("users").doc(auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Usuário não encontrado");
        }
        const userData = userDoc.data();
        return {
            id: auth.uid,
            userId: auth.uid,
            nome: userData.name || "",
            email: userData.email || "",
            mentorId: null,
            celular: null,
            plano: null,
            ativo: true,
        };
    }
    // Buscar photoURL do documento users
    const userDoc = await db.collection("users").doc(auth.uid).get();
    const photoURL = userDoc.exists ? userDoc.data()?.photoURL : null;
    functions.logger.info(`📸 getMe: photoURL do usuário ${auth.uid}: ${photoURL || 'null'}`);
    return { id: alunoDoc.id, ...alunoDoc.data(), photoURL };
});
/**
 * Obter dados do dashboard
 */
const getDashboardData = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    // Buscar estudos e simulados em PARALELO para melhor performance
    const [estudosSnapshot, simuladosSnapshot, estudosCountSnapshot] = await Promise.all([
        // Últimos 30 estudos para cálculo de streak e métricas recentes
        db.collection("alunos")
            .doc(auth.uid)
            .collection("estudos")
            .orderBy("data", "desc")
            .limit(100) // Limitar para performance
            .get(),
        // Últimos 10 simulados
        db.collection("alunos")
            .doc(auth.uid)
            .collection("simulados")
            .orderBy("data", "desc")
            .limit(10)
            .get(),
        // Contagem total de estudos (query leve)
        db.collection("alunos")
            .doc(auth.uid)
            .collection("estudos")
            .count()
            .get()
    ]);
    const estudos = estudosSnapshot.docs.map((doc) => ({
        ...doc.data(),
        data: doc.data().data.toDate(),
    }));
    const simulados = simuladosSnapshot.docs.map((doc) => ({
        ...doc.data(),
        data: doc.data().data.toDate(),
    }));
    // Calcular streak (dias consecutivos de estudo)
    const datasEstudo = [...new Set(estudos.map((e) => e.data.toISOString().split('T')[0]))].sort().reverse();
    let streak = 0;
    const hoje = new Date().toISOString().split('T')[0];
    if (datasEstudo.length > 0) {
        let dataAtual = new Date(hoje);
        for (const dataStr of datasEstudo) {
            const dataEstudo = new Date(dataStr);
            const diffDias = Math.floor((dataAtual.getTime() - dataEstudo.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDias === 0 || diffDias === 1) {
                streak++;
                dataAtual = dataEstudo;
            }
            else {
                break;
            }
        }
    }
    // Calcular métricas
    const tempoTotal = estudos.reduce((acc, e) => acc + (e.tempoMinutos || 0), 0);
    const questoesFeitas = estudos.reduce((acc, e) => acc + (e.questoesFeitas || 0), 0);
    const questoesAcertadas = estudos.reduce((acc, e) => acc + (e.questoesAcertadas || 0), 0);
    // Último simulado
    const ultimoSimulado = simulados.length > 0 ? simulados[0] : null;
    return {
        streak,
        tempoTotal,
        questoesFeitas,
        questoesAcertadas,
        ultimoSimulado,
        totalEstudos: estudosCountSnapshot.data().count,
        totalSimulados: simulados.length,
    };
});
/**
 * Listar estudos do aluno
 */
const getEstudos = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    // Limitar a 200 estudos mais recentes para melhor performance
    // Usuários com muitos estudos terão carregamento mais rápido
    const limit = data?.limit || 200;
    const estudosSnapshot = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("estudos")
        .orderBy("data", "desc")
        .limit(limit)
        .get();
    return estudosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
});
/**
 * Criar novo estudo
 */
const createEstudo = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const { data: dataEstudo, materia, conteudo, tempoMinutos, questoesFeitas, questoesAcertadas, flashcardsRevisados, } = data;
    if (!dataEstudo || !materia || !conteudo) {
        throw new functions.https.HttpsError("invalid-argument", "Data, matéria e conteúdo são obrigatórios");
    }
    try {
        const estudoRef = await db
            .collection("alunos")
            .doc(auth.uid)
            .collection("estudos")
            .add({
            data: admin.firestore.Timestamp.fromDate(new Date(dataEstudo)),
            materia,
            conteudo,
            tempoMinutos: tempoMinutos || 0,
            questoesFeitas: questoesFeitas || 0,
            questoesAcertadas: questoesAcertadas || 0,
            flashcardsRevisados: flashcardsRevisados || 0,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, estudoId: estudoRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao criar estudo:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Atualizar estudo existente
 */
const updateEstudo = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const { estudoId, data: dataEstudo, materia, conteudo, tempoMinutos, questoesFeitas, questoesAcertadas, flashcardsRevisados, } = data;
    if (!estudoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do estudo é obrigatório");
    }
    try {
        const estudoRef = db
            .collection("alunos")
            .doc(auth.uid)
            .collection("estudos")
            .doc(estudoId);
        // Verificar se o estudo existe
        const estudoDoc = await estudoRef.get();
        if (!estudoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Estudo não encontrado");
        }
        // Preparar dados para atualização (apenas campos fornecidos)
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (dataEstudo !== undefined) {
            updateData.data = admin.firestore.Timestamp.fromDate(new Date(dataEstudo));
        }
        if (materia !== undefined)
            updateData.materia = materia;
        if (conteudo !== undefined)
            updateData.conteudo = conteudo;
        if (tempoMinutos !== undefined)
            updateData.tempoMinutos = tempoMinutos;
        if (questoesFeitas !== undefined)
            updateData.questoesFeitas = questoesFeitas;
        if (questoesAcertadas !== undefined)
            updateData.questoesAcertadas = questoesAcertadas;
        if (flashcardsRevisados !== undefined)
            updateData.flashcardsRevisados = flashcardsRevisados;
        await estudoRef.update(updateData);
        return { success: true, estudoId };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar estudo:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Deletar estudo
 */
const deleteEstudo = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const { estudoId } = data;
    if (!estudoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do estudo é obrigatório");
    }
    try {
        await db
            .collection("alunos")
            .doc(auth.uid)
            .collection("estudos")
            .doc(estudoId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar estudo:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Listar simulados do aluno
 */
const getSimulados = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    // Limitar a 100 simulados mais recentes para melhor performance
    const limit = data?.limit || 100;
    const simuladosSnapshot = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("simulados")
        .orderBy("data", "desc")
        .limit(limit)
        .get();
    return simuladosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
});
/**
 * Criar novo simulado
 */
const createSimulado = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const { nome, data: dataSimulado, linguagensAcertos, linguagensTempo, humanasAcertos, humanasTempo, naturezaAcertos, naturezaTempo, matematicaAcertos, matematicaTempo, redacaoNota, redacaoTempo, dificuldadeDia1, dificuldadeDia2, anotacoes, } = data;
    if (!nome || !dataSimulado) {
        throw new functions.https.HttpsError("invalid-argument", "Nome e data são obrigatórios");
    }
    try {
        const simuladoRef = await db
            .collection("alunos")
            .doc(auth.uid)
            .collection("simulados")
            .add({
            nome,
            data: admin.firestore.Timestamp.fromDate(new Date(dataSimulado)),
            linguagensAcertos: linguagensAcertos || 0,
            linguagensTempo: linguagensTempo || 0,
            humanasAcertos: humanasAcertos || 0,
            humanasTempo: humanasTempo || 0,
            naturezaAcertos: naturezaAcertos || 0,
            naturezaTempo: naturezaTempo || 0,
            matematicaAcertos: matematicaAcertos || 0,
            matematicaTempo: matematicaTempo || 0,
            redacaoNota: redacaoNota || 0,
            redacaoTempo: redacaoTempo || 0,
            dificuldadeDia1: dificuldadeDia1 || "nao_informado",
            dificuldadeDia2: dificuldadeDia2 || "nao_informado",
            anotacoes: anotacoes || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, simuladoId: simuladoRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao criar simulado:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Atualizar simulado
 */
const updateSimulado = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const { simuladoId, nome, data: dataSimulado, linguagensAcertos, linguagensTempo, humanasAcertos, humanasTempo, naturezaAcertos, naturezaTempo, matematicaAcertos, matematicaTempo, redacaoNota, redacaoTempo, dificuldadeDia1, dificuldadeDia2, anotacoes, } = data;
    if (!simuladoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do simulado é obrigatório");
    }
    try {
        const updateData = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        // Adicionar apenas campos que foram fornecidos
        if (nome !== undefined)
            updateData.nome = nome;
        if (dataSimulado !== undefined)
            updateData.data = admin.firestore.Timestamp.fromDate(new Date(dataSimulado));
        if (linguagensAcertos !== undefined)
            updateData.linguagensAcertos = linguagensAcertos;
        if (linguagensTempo !== undefined)
            updateData.linguagensTempo = linguagensTempo;
        if (humanasAcertos !== undefined)
            updateData.humanasAcertos = humanasAcertos;
        if (humanasTempo !== undefined)
            updateData.humanasTempo = humanasTempo;
        if (naturezaAcertos !== undefined)
            updateData.naturezaAcertos = naturezaAcertos;
        if (naturezaTempo !== undefined)
            updateData.naturezaTempo = naturezaTempo;
        if (matematicaAcertos !== undefined)
            updateData.matematicaAcertos = matematicaAcertos;
        if (matematicaTempo !== undefined)
            updateData.matematicaTempo = matematicaTempo;
        if (redacaoNota !== undefined)
            updateData.redacaoNota = redacaoNota;
        if (redacaoTempo !== undefined)
            updateData.redacaoTempo = redacaoTempo;
        if (dificuldadeDia1 !== undefined)
            updateData.dificuldadeDia1 = dificuldadeDia1;
        if (dificuldadeDia2 !== undefined)
            updateData.dificuldadeDia2 = dificuldadeDia2;
        if (anotacoes !== undefined)
            updateData.anotacoes = anotacoes;
        await db
            .collection("alunos")
            .doc(auth.uid)
            .collection("simulados")
            .doc(simuladoId)
            .update(updateData);
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar simulado:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Deletar simulado
 */
const deleteSimulado = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const { simuladoId } = data;
    if (!simuladoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do simulado é obrigatório");
    }
    try {
        await db
            .collection("alunos")
            .doc(auth.uid)
            .collection("simulados")
            .doc(simuladoId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar simulado:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Obter métricas por matéria
 */
const getMetricasPorMateria = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const estudosSnapshot = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("estudos")
        .get();
    const estudos = estudosSnapshot.docs.map((doc) => doc.data());
    // Agrupar por matéria
    const metricasPorMateria = {};
    estudos.forEach((estudo) => {
        const materia = estudo.materia;
        if (!metricasPorMateria[materia]) {
            metricasPorMateria[materia] = {
                materia,
                tempoTotal: 0,
                questoesFeitas: 0,
                questoesAcertadas: 0,
                totalEstudos: 0,
            };
        }
        metricasPorMateria[materia].tempoTotal += estudo.tempoMinutos || 0;
        metricasPorMateria[materia].questoesFeitas += estudo.questoesFeitas || 0;
        metricasPorMateria[materia].questoesAcertadas += estudo.questoesAcertadas || 0;
        metricasPorMateria[materia].totalEstudos += 1;
    });
    // Calcular percentual de acerto
    Object.values(metricasPorMateria).forEach((metrica) => {
        metrica.percentualAcerto =
            metrica.questoesFeitas > 0
                ? (metrica.questoesAcertadas / metrica.questoesFeitas) * 100
                : 0;
    });
    return Object.values(metricasPorMateria);
});
/**
 * Atualizar perfil do aluno
 */
const updateProfile = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "aluno");
    const { nome, celular } = data;
    try {
        const updates = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (nome !== undefined)
            updates.nome = nome;
        if (celular !== undefined)
            updates.celular = celular;
        await db.collection("alunos").doc(auth.uid).update(updates);
        // Atualizar nome no documento users
        if (nome !== undefined) {
            await db.collection("users").doc(auth.uid).update({
                name: nome,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar perfil:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
// Exportar todas as funções do aluno
exports.alunoFunctions = {
    getMe,
    getDashboardData,
    getEstudos,
    createEstudo,
    updateEstudo,
    deleteEstudo,
    getSimulados,
    createSimulado,
    updateSimulado,
    deleteSimulado,
    getMetricasPorMateria,
    updateProfile,
};
//# sourceMappingURL=aluno.js.map
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
exports.mentorFunctions = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const auth_1 = require("../utils/auth");
const db = admin.firestore();
/**
 * Obter dados do mentor logado
 */
const getMe = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const mentorDoc = await db.collection("mentores").doc(auth.uid).get();
    if (!mentorDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Mentor não encontrado");
    }
    return { id: mentorDoc.id, ...mentorDoc.data() };
});
/**
 * Listar alunos do mentor
 */
const getAlunos = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    // Retornar todos os alunos (sem filtro de mentorId)
    const alunosSnapshot = await db
        .collection("alunos")
        .get();
    return alunosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
});
/**
 * Obter aluno específico
 */
const getAlunoById = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    const alunoDoc = await db.collection("alunos").doc(alunoId).get();
    if (!alunoDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
    }
    // Permitir acesso a qualquer aluno (sem verificação de mentorId)
    return { id: alunoDoc.id, ...alunoDoc.data() };
});
/**
 * Criar novo aluno
 */
const createAluno = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { email, password, nome, celular, plano } = data;
    if (!email || !password || !nome) {
        throw new functions.https.HttpsError("invalid-argument", "Email, senha e nome são obrigatórios");
    }
    try {
        // Criar usuário no Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: nome,
        });
        // Criar documento do usuário
        await db.collection("users").doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            name: nome,
            role: "aluno",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastSignedIn: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Criar documento do aluno
        await db.collection("alunos").doc(userRecord.uid).set({
            userId: userRecord.uid,
            mentorId: auth.uid,
            nome,
            email,
            celular: celular || null,
            plano: plano || null,
            ativo: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, alunoId: userRecord.uid };
    }
    catch (error) {
        functions.logger.error("Erro ao criar aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Atualizar dados do aluno
 */
const updateAluno = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, nome, email, celular, plano, ativo } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        // Verificar se o aluno existe
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        const updates = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (nome !== undefined)
            updates.nome = nome;
        if (email !== undefined)
            updates.email = email;
        if (celular !== undefined)
            updates.celular = celular;
        if (plano !== undefined)
            updates.plano = plano;
        if (ativo !== undefined)
            updates.ativo = ativo;
        await db.collection("alunos").doc(alunoId).update(updates);
        // Atualizar email no Firebase Auth se necessário
        if (email !== undefined) {
            await admin.auth().updateUser(alunoId, { email });
        }
        // Atualizar nome no documento users
        if (nome !== undefined) {
            await db.collection("users").doc(alunoId).update({
                name: nome,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Deletar aluno
 */
const deleteAluno = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        // Verificar se o aluno existe
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        // Deletar documento do aluno
        await db.collection("alunos").doc(alunoId).delete();
        // Deletar documento do usuário
        await db.collection("users").doc(alunoId).delete();
        // Deletar usuário do Firebase Auth
        await admin.auth().deleteUser(alunoId);
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Obter estudos de um aluno
 */
const getAlunoEstudos = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    // Verificar se o aluno existe
    const alunoDoc = await db.collection("alunos").doc(alunoId).get();
    if (!alunoDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
    }
    const estudosSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("estudos")
        .orderBy("data", "desc")
        .get();
    return estudosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
});
/**
 * Obter simulados de um aluno
 */
const getAlunoSimulados = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    // Verificar se o aluno existe
    const alunoDoc = await db.collection("alunos").doc(alunoId).get();
    if (!alunoDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
    }
    const simuladosSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("simulados")
        .orderBy("data", "desc")
        .get();
    return simuladosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
});
/**
 * Obter dashboard completo de um aluno
 */
const getAlunoDashboard = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    // Verificar se o aluno existe
    const alunoDoc = await db.collection("alunos").doc(alunoId).get();
    if (!alunoDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
    }
    // Buscar estudos
    const estudosSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("estudos")
        .get();
    // Buscar simulados
    const simuladosSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("simulados")
        .get();
    const estudos = estudosSnapshot.docs.map((doc) => doc.data());
    const simulados = simuladosSnapshot.docs.map((doc) => doc.data());
    // Calcular métricas (similar ao código original)
    const tempoTotal = estudos.reduce((acc, e) => acc + (e.tempoMinutos || 0), 0);
    const questoesFeitas = estudos.reduce((acc, e) => acc + (e.questoesFeitas || 0), 0);
    const questoesAcertadas = estudos.reduce((acc, e) => acc + (e.questoesAcertadas || 0), 0);
    return {
        aluno: { id: alunoDoc.id, ...alunoDoc.data() },
        metricas: {
            tempoTotal,
            questoesFeitas,
            questoesAcertadas,
            totalEstudos: estudos.length,
            totalSimulados: simulados.length,
        },
    };
});
/**
 * Obter configurações da plataforma do mentor
 */
const getConfig = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const mentorDoc = await db.collection("mentores").doc(auth.uid).get();
    if (!mentorDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Mentor não encontrado");
    }
    const mentorData = mentorDoc.data();
    return {
        nomePlataforma: mentorData.nomePlataforma || "",
        logoUrl: mentorData.logoUrl || "",
        corPrincipal: mentorData.corPrincipal || "#3b82f6",
    };
});
/**
 * Atualizar configurações da plataforma do mentor
 */
const updateConfig = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { nomePlataforma, logoUrl, corPrincipal } = data;
    try {
        const updates = {
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (nomePlataforma !== undefined)
            updates.nomePlataforma = nomePlataforma;
        if (logoUrl !== undefined)
            updates.logoUrl = logoUrl;
        if (corPrincipal !== undefined)
            updates.corPrincipal = corPrincipal;
        await db.collection("mentores").doc(auth.uid).update(updates);
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar configurações do mentor:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Obter métricas de todos os alunos
 */
const getAlunosMetricas = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    try {
        const alunosSnapshot = await db.collection("alunos").get();
        const metricas = await Promise.all(alunosSnapshot.docs.map(async (alunoDoc) => {
            const alunoId = alunoDoc.id;
            // Buscar estudos
            const estudosSnapshot = await db
                .collection("alunos")
                .doc(alunoId)
                .collection("estudos")
                .get();
            const estudos = estudosSnapshot.docs.map((doc) => doc.data());
            // Calcular métricas
            const questoesFeitas = estudos.reduce((acc, e) => acc + (e.questoesFeitas || 0), 0);
            const questoesAcertadas = estudos.reduce((acc, e) => acc + (e.questoesAcertadas || 0), 0);
            const tempoMinutos = estudos.reduce((acc, e) => acc + (e.tempoMinutos || 0), 0);
            const horasEstudo = Math.round((tempoMinutos / 60) * 10) / 10;
            const desempenho = questoesFeitas > 0 ? Math.round((questoesAcertadas / questoesFeitas) * 100) : 0;
            return {
                alunoId,
                questoesFeitas,
                desempenho,
                horasEstudo,
            };
        }));
        return metricas;
    }
    catch (error) {
        functions.logger.error("Erro ao buscar métricas dos alunos:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Obter evolução do número de alunos ao longo do tempo
 */
const getEvolucaoAlunos = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    try {
        const alunosSnapshot = await db
            .collection("alunos")
            .orderBy("createdAt", "asc")
            .get();
        const evolucao = [];
        let contador = 0;
        alunosSnapshot.docs.forEach((doc) => {
            const data = doc.data();
            contador++;
            let dataFormatada = "Data desconhecida";
            if (data.createdAt) {
                const timestamp = data.createdAt;
                let date;
                if (timestamp.toDate) {
                    date = timestamp.toDate();
                }
                else if (timestamp.seconds || timestamp._seconds) {
                    const seconds = timestamp.seconds || timestamp._seconds;
                    date = new Date(seconds * 1000);
                }
                else {
                    date = new Date(timestamp);
                }
                dataFormatada = date.toISOString().split("T")[0];
            }
            evolucao.push({
                data: dataFormatada,
                total: contador,
            });
        });
        return evolucao;
    }
    catch (error) {
        functions.logger.error("Erro ao buscar evolução de alunos:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Obter dados completos do aluno para visualização pelo mentor
 */
const getAlunoAreaCompleta = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        // Buscar estudos
        const estudosSnapshot = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("estudos")
            .orderBy("data", "desc")
            .get();
        // Buscar simulados
        const simuladosSnapshot = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("simulados")
            .orderBy("data", "desc")
            .get();
        // Buscar diário emocional
        const diarioSnapshot = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("diario_emocional")
            .orderBy("data", "desc")
            .get();
        // Buscar autodiagnósticos
        const autodiagnosticosSnapshot = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("autodiagnosticos")
            .orderBy("createdAt", "desc")
            .get();
        return {
            aluno: { id: alunoDoc.id, ...alunoDoc.data() },
            estudos: estudosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            simulados: simuladosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            diarioEmocional: diarioSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
            autodiagnosticos: autodiagnosticosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        };
    }
    catch (error) {
        functions.logger.error("Erro ao buscar área completa do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Funções para o mentor gerenciar estudos do aluno
 */
const createAlunoEstudo = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, ...estudoData } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        const estudoRef = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("estudos")
            .add({
            ...estudoData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, estudoId: estudoRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao criar estudo do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const updateAlunoEstudo = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, estudoId, ...updates } = data;
    if (!alunoId || !estudoId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e estudo são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("estudos")
            .doc(estudoId)
            .update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar estudo do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const deleteAlunoEstudo = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, estudoId } = data;
    if (!alunoId || !estudoId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e estudo são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("estudos")
            .doc(estudoId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar estudo do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Funções para o mentor gerenciar simulados do aluno
 */
const createAlunoSimulado = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, ...simuladoData } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        const simuladoRef = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("simulados")
            .add({
            ...simuladoData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, simuladoId: simuladoRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao criar simulado do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const updateAlunoSimulado = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, simuladoId, ...updates } = data;
    if (!alunoId || !simuladoId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e simulado são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("simulados")
            .doc(simuladoId)
            .update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar simulado do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const deleteAlunoSimulado = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, simuladoId } = data;
    if (!alunoId || !simuladoId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e simulado são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("simulados")
            .doc(simuladoId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar simulado do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Obter dados específicos do aluno (estudos, simulados, etc.)
 */
const getAlunoData = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, collection } = data;
    if (!alunoId || !collection) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno e coleção são obrigatórios");
    }
    try {
        const snapshot = await db
            .collection("alunos")
            .doc(alunoId)
            .collection(collection)
            .get();
        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    }
    catch (error) {
        functions.logger.error(`Erro ao buscar ${collection} do aluno:`, error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
// Placeholder - exportação será feita no final do arquivo
/**
 * Funções para o mentor gerenciar horários do cronograma do aluno
 */
const createAlunoHorario = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, ...horarioData } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        const horarioRef = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("horarios")
            .add({
            ...horarioData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, horarioId: horarioRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao criar horário do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const updateAlunoHorario = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, horarioId, ...updates } = data;
    if (!alunoId || !horarioId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e horário são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("horarios")
            .doc(horarioId)
            .update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar horário do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const deleteAlunoHorario = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, horarioId } = data;
    if (!alunoId || !horarioId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e horário são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("horarios")
            .doc(horarioId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar horário do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Funções para o mentor gerenciar templates de cronograma do aluno
 */
const saveAlunoTemplate = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, ...templateData } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        const templateRef = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("templates")
            .add({
            ...templateData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, templateId: templateRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao salvar template do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const loadAlunoTemplate = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, templateId } = data;
    if (!alunoId || !templateId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e template são obrigatórios");
    }
    try {
        const templateDoc = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("templates")
            .doc(templateId)
            .get();
        if (!templateDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Template não encontrado");
        }
        return { id: templateDoc.id, ...templateDoc.data() };
    }
    catch (error) {
        functions.logger.error("Erro ao carregar template do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const deleteAlunoTemplate = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, templateId } = data;
    if (!alunoId || !templateId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e template são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("templates")
            .doc(templateId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar template do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Funções para o mentor gerenciar diário emocional do aluno
 */
const createAlunoDiarioEmocional = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, ...diarioData } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        const diarioRef = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("diario_emocional")
            .add({
            ...diarioData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, registroId: diarioRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao criar registro emocional do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const deleteAlunoDiarioEmocional = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, registroId } = data;
    if (!alunoId || !registroId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e registro são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("diario_emocional")
            .doc(registroId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar registro emocional do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Funções para o mentor gerenciar autodiagnósticos do aluno
 */
const createAlunoAutodiagnostico = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, ...autodiagnosticoData } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        const autodiagnosticoRef = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("autodiagnosticos")
            .add({
            ...autodiagnosticoData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, autodiagnosticoId: autodiagnosticoRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao criar autodiagnóstico do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const deleteAlunoAutodiagnostico = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, autodiagnosticoId } = data;
    if (!alunoId || !autodiagnosticoId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e autodiagnóstico são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("autodiagnosticos")
            .doc(autodiagnosticoId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar autodiagnóstico do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Funções para o mentor gerenciar progresso nos conteúdos ENEM do aluno
 */
const updateAlunoProgresso = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, materia, topico, concluido } = data;
    if (!alunoId || !materia || !topico) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno, matéria e tópico são obrigatórios");
    }
    try {
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        // Buscar ou criar documento de progresso
        const progressoQuery = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("progresso")
            .where("materia", "==", materia)
            .where("topico", "==", topico)
            .limit(1)
            .get();
        if (progressoQuery.empty) {
            // Criar novo registro
            await db
                .collection("alunos")
                .doc(alunoId)
                .collection("progresso")
                .add({
                materia,
                topico,
                concluido: concluido || false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        else {
            // Atualizar registro existente
            const progressoDoc = progressoQuery.docs[0];
            await progressoDoc.ref.update({
                concluido: concluido || false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar progresso do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Atualizar perfil do aluno
 */
const updateAlunoProfile = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, ...updates } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        await db.collection("alunos").doc(alunoId).update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar perfil do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Funções para o mentor gerenciar cronogramas do aluno
 */
const createAlunoCronograma = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, ...cronogramaData } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    try {
        const alunoDoc = await db.collection("alunos").doc(alunoId).get();
        if (!alunoDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
        }
        const cronogramaRef = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("cronogramas")
            .add({
            ...cronogramaData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, cronogramaId: cronogramaRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao criar cronograma do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const updateAlunoCronograma = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, cronogramaId, ...updates } = data;
    if (!alunoId || !cronogramaId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e cronograma são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("cronogramas")
            .doc(cronogramaId)
            .update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar cronograma do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const deleteAlunoCronograma = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, cronogramaId } = data;
    if (!alunoId || !cronogramaId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e cronograma são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("cronogramas")
            .doc(cronogramaId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar cronograma do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Funções para o mentor gerenciar tarefas do cronograma do aluno
 */
const createAlunoTarefa = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, cronogramaId, ...tarefaData } = data;
    if (!alunoId || !cronogramaId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e cronograma são obrigatórios");
    }
    try {
        const tarefaRef = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("cronogramas")
            .doc(cronogramaId)
            .collection("tarefas")
            .add({
            ...tarefaData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, tarefaId: tarefaRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao criar tarefa do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const updateAlunoTarefa = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, cronogramaId, tarefaId, ...updates } = data;
    if (!alunoId || !cronogramaId || !tarefaId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno, cronograma e tarefa são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("cronogramas")
            .doc(cronogramaId)
            .collection("tarefas")
            .doc(tarefaId)
            .update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar tarefa do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
const deleteAlunoTarefa = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, cronogramaId, tarefaId } = data;
    if (!alunoId || !cronogramaId || !tarefaId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno, cronograma e tarefa são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("cronogramas")
            .doc(cronogramaId)
            .collection("tarefas")
            .doc(tarefaId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar tarefa do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Criar meta para aluno (mentor)
 */
const createAlunoMeta = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, tipo, nome, descricao, valorAlvo, unidade, dataInicio, dataFim, materia, incidencia, } = data;
    if (!alunoId) {
        throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }
    if (!tipo || !nome || !valorAlvo || !unidade || !dataInicio || !dataFim) {
        throw new functions.https.HttpsError("invalid-argument", "Tipo, nome, valor alvo, unidade, data início e data fim são obrigatórios");
    }
    try {
        // Para metas de sequência, buscar sequência atual do aluno
        let valorAtual = 0;
        if (tipo === 'sequencia') {
            const estudosSnapshot = await db
                .collection("alunos")
                .doc(alunoId)
                .collection("estudos")
                .orderBy("data", "desc")
                .get();
            const estudos = estudosSnapshot.docs.map((doc) => doc.data());
            const datasEstudo = [...new Set(estudos.map((e) => {
                    const data = e.data.toDate();
                    return data.toISOString().split('T')[0];
                }))].sort().reverse();
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
            valorAtual = streak;
        }
        const metaData = {
            alunoId,
            tipo,
            nome,
            descricao: descricao || '',
            valorAlvo: Number(valorAlvo),
            valorAtual,
            unidade,
            dataInicio: admin.firestore.Timestamp.fromDate(new Date(dataInicio)),
            dataFim: admin.firestore.Timestamp.fromDate(new Date(dataFim)),
            status: 'ativa',
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
            createdBy: auth.uid, // ID do mentor que criou
        };
        if (materia)
            metaData.materia = materia;
        if (incidencia)
            metaData.incidencia = incidencia;
        const metaRef = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("metas")
            .add(metaData);
        return { success: true, metaId: metaRef.id };
    }
    catch (error) {
        functions.logger.error("Erro ao criar meta do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Atualizar meta do aluno (mentor)
 */
const updateAlunoMeta = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, metaId, nome, descricao, valorAlvo, dataFim, status, } = data;
    if (!alunoId || !metaId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e da meta são obrigatórios");
    }
    try {
        const updateData = {
            updatedAt: admin.firestore.Timestamp.now(),
        };
        if (nome !== undefined)
            updateData.nome = nome;
        if (descricao !== undefined)
            updateData.descricao = descricao;
        if (valorAlvo !== undefined)
            updateData.valorAlvo = Number(valorAlvo);
        if (dataFim !== undefined) {
            updateData.dataFim = admin.firestore.Timestamp.fromDate(new Date(dataFim));
        }
        if (status !== undefined) {
            updateData.status = status;
            if (status === 'concluida') {
                updateData.dataConclusao = admin.firestore.Timestamp.now();
            }
        }
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("metas")
            .doc(metaId)
            .update(updateData);
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao atualizar meta do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
/**
 * Deletar meta do aluno (mentor)
 */
const deleteAlunoMeta = functions
    .region("southamerica-east1")
    .https.onCall(async (data, context) => {
    const auth = await (0, auth_1.getAuthContext)(context);
    (0, auth_1.requireRole)(auth, "mentor");
    const { alunoId, metaId } = data;
    if (!alunoId || !metaId) {
        throw new functions.https.HttpsError("invalid-argument", "IDs do aluno e da meta são obrigatórios");
    }
    try {
        await db
            .collection("alunos")
            .doc(alunoId)
            .collection("metas")
            .doc(metaId)
            .delete();
        return { success: true };
    }
    catch (error) {
        functions.logger.error("Erro ao deletar meta do aluno:", error);
        throw new functions.https.HttpsError("internal", error.message);
    }
});
// Exportar todas as funções do mentor
exports.mentorFunctions = {
    // Funções básicas do mentor
    getMe,
    getAlunos,
    getAlunoById,
    createAluno,
    updateAluno,
    deleteAluno,
    getAlunoEstudos,
    getAlunoSimulados,
    getAlunoDashboard,
    getConfig,
    updateConfig,
    getAlunosMetricas,
    getEvolucaoAlunos,
    getAlunoAreaCompleta,
    getAlunoData,
    // Estudos
    createAlunoEstudo,
    updateAlunoEstudo,
    deleteAlunoEstudo,
    // Simulados
    createAlunoSimulado,
    updateAlunoSimulado,
    deleteAlunoSimulado,
    // Horários
    createAlunoHorario,
    updateAlunoHorario,
    deleteAlunoHorario,
    // Templates
    saveAlunoTemplate,
    loadAlunoTemplate,
    deleteAlunoTemplate,
    // Diário Emocional
    createAlunoDiarioEmocional,
    deleteAlunoDiarioEmocional,
    // Autodiagnósticos
    createAlunoAutodiagnostico,
    deleteAlunoAutodiagnostico,
    // Progresso
    updateAlunoProgresso,
    // Perfil
    updateAlunoProfile,
    // Cronogramas
    createAlunoCronograma,
    updateAlunoCronograma,
    deleteAlunoCronograma,
    // Tarefas
    createAlunoTarefa,
    updateAlunoTarefa,
    deleteAlunoTarefa,
    // Metas
    createAlunoMeta,
    updateAlunoMeta,
    deleteAlunoMeta,
};
//# sourceMappingURL=mentor.js.map
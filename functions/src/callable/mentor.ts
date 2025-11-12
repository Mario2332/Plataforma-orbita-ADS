import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getAuthContext, requireRole } from "../utils/auth";

const db = admin.firestore();

/**
 * Obter dados do mentor logado
 */
const getMe = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    const alunosSnapshot = await db
      .collection("alunos")
      .where("mentorId", "==", auth.uid)
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    const { alunoId } = data;

    if (!alunoId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }

    const alunoDoc = await db.collection("alunos").doc(alunoId).get();

    if (!alunoDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
    }

    const alunoData = alunoDoc.data()!;

    // Verificar se o aluno pertence ao mentor
    if (alunoData.mentorId !== auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Acesso negado");
    }

    return { id: alunoDoc.id, ...alunoData };
  });

/**
 * Criar novo aluno
 */
const createAluno = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    const { email, password, nome, celular, plano } = data;

    if (!email || !password || !nome) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Email, senha e nome são obrigatórios"
      );
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
    } catch (error: any) {
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    const { alunoId, nome, email, celular, plano, ativo } = data;

    if (!alunoId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }

    try {
      // Verificar se o aluno pertence ao mentor
      const alunoDoc = await db.collection("alunos").doc(alunoId).get();
      if (!alunoDoc.exists || alunoDoc.data()!.mentorId !== auth.uid) {
        throw new functions.https.HttpsError("permission-denied", "Acesso negado");
      }

      const updates: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (nome !== undefined) updates.nome = nome;
      if (email !== undefined) updates.email = email;
      if (celular !== undefined) updates.celular = celular;
      if (plano !== undefined) updates.plano = plano;
      if (ativo !== undefined) updates.ativo = ativo;

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
    } catch (error: any) {
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    const { alunoId } = data;

    if (!alunoId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }

    try {
      // Verificar se o aluno pertence ao mentor
      const alunoDoc = await db.collection("alunos").doc(alunoId).get();
      if (!alunoDoc.exists || alunoDoc.data()!.mentorId !== auth.uid) {
        throw new functions.https.HttpsError("permission-denied", "Acesso negado");
      }

      // Deletar documento do aluno
      await db.collection("alunos").doc(alunoId).delete();

      // Deletar documento do usuário
      await db.collection("users").doc(alunoId).delete();

      // Deletar usuário do Firebase Auth
      await admin.auth().deleteUser(alunoId);

      return { success: true };
    } catch (error: any) {
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    const { alunoId } = data;

    if (!alunoId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }

    // Verificar se o aluno pertence ao mentor
    const alunoDoc = await db.collection("alunos").doc(alunoId).get();
    if (!alunoDoc.exists || alunoDoc.data()!.mentorId !== auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Acesso negado");
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    const { alunoId } = data;

    if (!alunoId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }

    // Verificar se o aluno pertence ao mentor
    const alunoDoc = await db.collection("alunos").doc(alunoId).get();
    if (!alunoDoc.exists || alunoDoc.data()!.mentorId !== auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Acesso negado");
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    const { alunoId } = data;

    if (!alunoId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do aluno é obrigatório");
    }

    // Verificar se o aluno pertence ao mentor
    const alunoDoc = await db.collection("alunos").doc(alunoId).get();
    if (!alunoDoc.exists || alunoDoc.data()!.mentorId !== auth.uid) {
      throw new functions.https.HttpsError("permission-denied", "Acesso negado");
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
    const tempoTotal = estudos.reduce((acc, e: any) => acc + (e.tempoMinutos || 0), 0);
    const questoesFeitas = estudos.reduce((acc, e: any) => acc + (e.questoesFeitas || 0), 0);
    const questoesAcertadas = estudos.reduce((acc, e: any) => acc + (e.questoesAcertadas || 0), 0);

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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    const mentorDoc = await db.collection("mentores").doc(auth.uid).get();

    if (!mentorDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Mentor não encontrado");
    }

    const mentorData = mentorDoc.data()!;
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    const { nomePlataforma, logoUrl, corPrincipal } = data;

    try {
      const updates: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (nomePlataforma !== undefined) updates.nomePlataforma = nomePlataforma;
      if (logoUrl !== undefined) updates.logoUrl = logoUrl;
      if (corPrincipal !== undefined) updates.corPrincipal = corPrincipal;

      await db.collection("mentores").doc(auth.uid).update(updates);

      return { success: true };
    } catch (error: any) {
      functions.logger.error("Erro ao atualizar configurações do mentor:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

// Exportar todas as funções do mentor
export const mentorFunctions = {
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
};

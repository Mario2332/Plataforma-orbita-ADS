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

    // Permitir acesso a qualquer aluno (sem verificação de mentorId)
    return { id: alunoDoc.id, ...alunoDoc.data() };
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
      // Verificar se o aluno existe
      const alunoDoc = await db.collection("alunos").doc(alunoId).get();
      if (!alunoDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Aluno não encontrado");
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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

/**
 * Obter métricas de todos os alunos
 */
const getAlunosMetricas = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    try {
      const alunosSnapshot = await db.collection("alunos").get();
      
      const metricas = await Promise.all(
        alunosSnapshot.docs.map(async (alunoDoc) => {
          const alunoId = alunoDoc.id;
          
          // Buscar estudos
          const estudosSnapshot = await db
            .collection("alunos")
            .doc(alunoId)
            .collection("estudos")
            .get();
          
          const estudos = estudosSnapshot.docs.map((doc) => doc.data());
          
          // Calcular métricas
          const questoesFeitas = estudos.reduce((acc, e: any) => acc + (e.questoesFeitas || 0), 0);
          const questoesAcertadas = estudos.reduce((acc, e: any) => acc + (e.questoesAcertadas || 0), 0);
          const tempoMinutos = estudos.reduce((acc, e: any) => acc + (e.tempoMinutos || 0), 0);
          const horasEstudo = Math.round((tempoMinutos / 60) * 10) / 10;
          const desempenho = questoesFeitas > 0 ? Math.round((questoesAcertadas / questoesFeitas) * 100) : 0;
          
          return {
            alunoId,
            questoesFeitas,
            desempenho,
            horasEstudo,
          };
        })
      );
      
      return metricas;
    } catch (error: any) {
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

    try {
      const alunosSnapshot = await db
        .collection("alunos")
        .orderBy("createdAt", "asc")
        .get();
      
      const evolucao: { data: string; total: number }[] = [];
      let contador = 0;
      
      alunosSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        contador++;
        
        let dataFormatada = "Data desconhecida";
        if (data.createdAt) {
          const timestamp = data.createdAt;
          let date: Date;
          
          if (timestamp.toDate) {
            date = timestamp.toDate();
          } else if (timestamp.seconds || timestamp._seconds) {
            const seconds = timestamp.seconds || timestamp._seconds;
            date = new Date(seconds * 1000);
          } else {
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
    } catch (error: any) {
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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
    } catch (error: any) {
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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
    } catch (error: any) {
      functions.logger.error("Erro ao criar estudo do aluno:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

const updateAlunoEstudo = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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
    } catch (error: any) {
      functions.logger.error("Erro ao atualizar estudo do aluno:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

const deleteAlunoEstudo = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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
    } catch (error: any) {
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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
    } catch (error: any) {
      functions.logger.error("Erro ao criar simulado do aluno:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

const updateAlunoSimulado = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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
    } catch (error: any) {
      functions.logger.error("Erro ao atualizar simulado do aluno:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

const deleteAlunoSimulado = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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
    } catch (error: any) {
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
    const auth = await getAuthContext(context);
    requireRole(auth, "mentor");

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
    } catch (error: any) {
      functions.logger.error(`Erro ao buscar ${collection} do aluno:`, error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

// Atualizar exportação
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
  getAlunosMetricas,
  getEvolucaoAlunos,
  getAlunoAreaCompleta,
  // Novas funções para gerenciar dados do aluno
  createAlunoEstudo,
  updateAlunoEstudo,
  deleteAlunoEstudo,
  createAlunoSimulado,
  updateAlunoSimulado,
  deleteAlunoSimulado,
  getAlunoData,
};

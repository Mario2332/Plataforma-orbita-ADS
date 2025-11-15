import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getAuthContext, requireRole } from "../utils/auth";

const db = admin.firestore();

/**
 * Obter horários do cronograma
 */
export const getHorarios = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const horariosSnapshot = await db
      .collection("alunos")
      .doc(auth.uid)
      .collection("horarios")
      .orderBy("diaSemana")
      .orderBy("horaInicio")
      .get();

    return horariosSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  });

/**
 * Criar horário no cronograma
 */
export const createHorario = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { diaSemana, horaInicio, horaFim, materia, descricao, cor } = data;

    if (
      diaSemana === undefined ||
      !horaInicio ||
      !horaFim ||
      !materia
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Dia da semana, hora início, hora fim e matéria são obrigatórios"
      );
    }

    try {
      const horarioRef = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("horarios")
        .add({
          diaSemana,
          horaInicio,
          horaFim,
          materia,
          descricao: descricao || null,
          cor: cor || "#FFFFFF",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return { success: true, horarioId: horarioRef.id };
    } catch (error: any) {
      functions.logger.error("Erro ao criar horário:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Atualizar horário no cronograma
 */
export const updateHorario = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { horarioId, diaSemana, horaInicio, horaFim, materia, descricao, cor } = data;

    if (!horarioId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do horário é obrigatório");
    }

    try {
      const updates: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (diaSemana !== undefined) updates.diaSemana = diaSemana;
      if (horaInicio !== undefined) updates.horaInicio = horaInicio;
      if (horaFim !== undefined) updates.horaFim = horaFim;
      if (materia !== undefined) updates.materia = materia;
      if (descricao !== undefined) updates.descricao = descricao;
      if (cor !== undefined) updates.cor = cor;

      await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("horarios")
        .doc(horarioId)
        .update(updates);

      return { success: true };
    } catch (error: any) {
      functions.logger.error("Erro ao atualizar horário:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Deletar horário do cronograma
 */
export const deleteHorario = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { horarioId } = data;

    if (!horarioId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do horário é obrigatório");
    }

    try {
      await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("horarios")
        .doc(horarioId)
        .delete();

      return { success: true };
    } catch (error: any) {
      functions.logger.error("Erro ao deletar horário:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Obter templates de cronograma
 */
export const getTemplates = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const templatesSnapshot = await db
      .collection("alunos")
      .doc(auth.uid)
      .collection("templates")
      .orderBy("createdAt", "desc")
      .get();

    return templatesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  });

/**
 * Salvar cronograma como template
 */
export const saveTemplate = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { nome, horarios } = data;

    if (!nome || !horarios || !Array.isArray(horarios)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Nome e horários são obrigatórios"
      );
    }

    try {
      const templateRef = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("templates")
        .add({
          nome,
          horarios,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return { success: true, templateId: templateRef.id };
    } catch (error: any) {
      functions.logger.error("Erro ao salvar template:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Carregar template no cronograma
 */
export const loadTemplate = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { templateId } = data;

    if (!templateId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do template é obrigatório");
    }

    try {
      // Buscar template
      const templateDoc = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("templates")
        .doc(templateId)
        .get();

      if (!templateDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Template não encontrado");
      }

      const templateData = templateDoc.data()!;
      const horarios = templateData.horarios;

      // Limpar horários atuais
      const horariosSnapshot = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("horarios")
        .get();

      const batch = db.batch();
      horariosSnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // Adicionar novos horários do template
      horarios.forEach((horario: any) => {
        const newHorarioRef = db
          .collection("alunos")
          .doc(auth.uid)
          .collection("horarios")
          .doc();

        batch.set(newHorarioRef, {
          ...horario,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();

      return { success: true };
    } catch (error: any) {
      functions.logger.error("Erro ao carregar template:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Deletar template de cronograma
 */
export const deleteTemplate = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { templateId } = data;

    if (!templateId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do template é obrigatório");
    }

    try {
      await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("templates")
        .doc(templateId)
        .delete();

      return { success: true };
    } catch (error: any) {
      functions.logger.error("Erro ao deletar template:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Obter progresso de conteúdos ENEM
 */
export const getProgresso = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const progressosSnapshot = await db
      .collection("alunos")
      .doc(auth.uid)
      .collection("conteudos")
      .get();

    // Retornar como mapa topicoId -> progresso
    const progressoMap: Record<string, any> = {};

    progressosSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      progressoMap[data.topicoId] = {
        estudado: data.estudado || false,
        questoesFeitas: data.questoesFeitas || 0,
        questoesAcertos: data.questoesAcertos || 0,
      };
    });

    return progressoMap;
  });

/**
 * Atualizar progresso de um tópico ENEM
 */
export const updateProgresso = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { topicoId, estudado, questoesFeitas, questoesAcertos } = data;

    if (!topicoId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do tópico é obrigatório");
    }

    try {
      // Buscar documento existente
      const conteudosQuery = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("conteudos")
        .where("topicoId", "==", topicoId)
        .limit(1)
        .get();

      const updates: any = {
        topicoId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (estudado !== undefined) updates.estudado = estudado;
      if (questoesFeitas !== undefined) updates.questoesFeitas = questoesFeitas;
      if (questoesAcertos !== undefined) updates.questoesAcertos = questoesAcertos;

      if (conteudosQuery.empty) {
        // Criar novo documento
        await db
          .collection("alunos")
          .doc(auth.uid)
          .collection("conteudos")
          .add({
            ...updates,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      } else {
        // Atualizar documento existente
        await conteudosQuery.docs[0].ref.update(updates);
      }

      return { success: true };
    } catch (error: any) {
      functions.logger.error("Erro ao atualizar progresso:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Criar registro no diário emocional
 */
export const createDiarioEmocional = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { data: dataRegistro, estadoEmocional, nivelCansaco, observacoes } = data;

    if (!dataRegistro || !estadoEmocional || !nivelCansaco) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Data, estado emocional e nível de cansaço são obrigatórios"
      );
    }

    // Validar valores permitidos
    const estadosValidos = ["otimo", "bom", "neutro", "ruim", "pessimo"];
    const cansacoValido = ["descansado", "normal", "cansado", "muito_cansado", "exausto"];

    if (!estadosValidos.includes(estadoEmocional) || !cansacoValido.includes(nivelCansaco)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Estado emocional ou nível de cansaço inválido"
      );
    }

    try {
      // Verificar se já existe registro para esta data
      const existingQuery = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("diario_emocional")
        .where("data", "==", admin.firestore.Timestamp.fromDate(new Date(dataRegistro)))
        .limit(1)
        .get();

      if (!existingQuery.empty) {
        // Atualizar registro existente
        await existingQuery.docs[0].ref.update({
          estadoEmocional,
          nivelCansaco,
          observacoes: observacoes || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return { success: true, id: existingQuery.docs[0].id };
      }

      // Criar novo registro
      const docRef = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("diario_emocional")
        .add({
          data: admin.firestore.Timestamp.fromDate(new Date(dataRegistro)),
          estadoEmocional,
          nivelCansaco,
          observacoes: observacoes || null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return { success: true, id: docRef.id };
    } catch (error: any) {
      functions.logger.error("Erro ao criar registro emocional:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Obter registros do diário emocional
 */
export const getDiarioEmocional = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { dataInicio, dataFim } = data;

    try {
      let query = db
        .collection("alunos")
        .doc(auth.uid)
        .collection("diario_emocional")
        .orderBy("data", "desc");

      // Filtrar por período se fornecido
      if (dataInicio) {
        query = query.where("data", ">=", admin.firestore.Timestamp.fromDate(new Date(dataInicio)));
      }
      if (dataFim) {
        query = query.where("data", "<=", admin.firestore.Timestamp.fromDate(new Date(dataFim)));
      }

      const snapshot = await query.get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error: any) {
      functions.logger.error("Erro ao buscar diário emocional:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Deletar registro do diário emocional
 */
export const deleteDiarioEmocional = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { registroId } = data;

    if (!registroId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do registro é obrigatório");
    }

    try {
      await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("diario_emocional")
        .doc(registroId)
        .delete();

      return { success: true };
    } catch (error: any) {
      functions.logger.error("Erro ao deletar registro emocional:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

// ==================== AUTODIAGNÓSTICO ====================

/**
 * Criar autodiagnóstico de erros em prova/simulado
 */
export const createAutodiagnostico = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { prova, questoes } = data;

    if (!prova || !questoes || !Array.isArray(questoes) || questoes.length === 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Prova e questões são obrigatórios"
      );
    }

    // Validar questões
    const motivosValidos = ["interpretacao", "atencao", "lacuna_teorica", "nao_estudado"];
    const areasValidas = ["linguagens", "humanas", "natureza", "matematica"];
    for (const q of questoes) {
      if (!q.numeroQuestao || !q.area || !q.macroassunto || !q.microassunto || !q.motivoErro) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Todos os campos da questão são obrigatórios"
        );
      }
      if (!areasValidas.includes(q.area)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          `Área inválida: ${q.area}`
        );
      }
      if (!motivosValidos.includes(q.motivoErro)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          `Motivo de erro inválido: ${q.motivoErro}`
        );
      }
    }

    try {
      const autodiagnosticoRef = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("autodiagnosticos")
        .add({
          prova,
          questoes,
          totalQuestoes: questoes.length,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      return { success: true, id: autodiagnosticoRef.id };
    } catch (error: any) {
      functions.logger.error("Erro ao criar autodiagnóstico:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Obter autodiagnósticos
 */
export const getAutodiagnosticos = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    try {
      const snapshot = await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("autodiagnosticos")
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error: any) {
      functions.logger.error("Erro ao buscar autodiagnósticos:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

/**
 * Deletar autodiagnóstico
 */
export const deleteAutodiagnostico = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const auth = await getAuthContext(context);
    requireRole(auth, "aluno");

    const { autodiagnosticoId } = data;

    if (!autodiagnosticoId) {
      throw new functions.https.HttpsError("invalid-argument", "ID do autodiagnóstico é obrigatório");
    }

    try {
      await db
        .collection("alunos")
        .doc(auth.uid)
        .collection("autodiagnosticos")
        .doc(autodiagnosticoId)
        .delete();

      return { success: true };
    } catch (error: any) {
      functions.logger.error("Erro ao deletar autodiagnóstico:", error);
      throw new functions.https.HttpsError("internal", error.message);
    }
  });

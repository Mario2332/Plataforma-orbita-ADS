import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getAuthContext, requireRole } from "../utils/auth";
import { initializeTemplatesIfNeeded } from "./init-cronograma-templates";

const db = admin.firestore();

/**
 * Obter cronograma anual do aluno
 * Retorna cronograma extensivo ou intensivo com progresso
 */
export const getCronogramaAnual = functions
  .region("southamerica-east1")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 30,
  })
  .https.onCall(async (data, context) => {
    try {
      functions.logger.info("🔵 getCronogramaAnual chamada", {
        tipo: data?.tipo,
        uid: context.auth?.uid
      });

      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Você precisa estar autenticado"
        );
      }

      const auth = await getAuthContext(context);
      const { tipo = "extensive" } = data; // extensive ou intensive

      // Inicializar templates se necessário
      await initializeTemplatesIfNeeded();

      // Buscar cronograma do aluno
      const cronogramaRef = db.collection("cronogramas_anuais").doc(context.auth.uid);
      const cronogramaDoc = await cronogramaRef.get();

      let cronogramaData: any;
      
      if (!cronogramaDoc.exists) {
        // Se não existe, criar com template padrão
        functions.logger.info("📦 Inicializando cronograma para novo aluno");
        
        const templateRef = db.collection("templates_cronograma").doc(tipo);
        const templateDoc = await templateRef.get();
        
        if (!templateDoc.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            "Template de cronograma não encontrado"
          );
        }

        const templateData = templateDoc.data();
        
        cronogramaData = {
          extensive: tipo === "extensive" ? templateData : null,
          intensive: tipo === "intensive" ? templateData : null,
          completedTopics: {},
          activeSchedule: tipo,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        await cronogramaRef.set(cronogramaData);
      } else {
        cronogramaData = cronogramaDoc.data() || {};
        
        // Se o tipo solicitado não existe, buscar do template
        if (!cronogramaData || !cronogramaData[tipo]) {
          const templateRef = db.collection("templates_cronograma").doc(tipo);
          const templateDoc = await templateRef.get();
          
          if (templateDoc.exists) {
            if (!cronogramaData) cronogramaData = {};
            cronogramaData[tipo] = templateDoc.data();
            await cronogramaRef.update({
              [tipo]: templateDoc.data(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      }

      // Garantir que cronogramaData existe
      if (!cronogramaData) {
        throw new functions.https.HttpsError(
          "internal",
          "Erro ao carregar dados do cronograma"
        );
      }

      functions.logger.info("✅ Cronograma carregado", {
        tipo,
        hasCycles: !!cronogramaData[tipo]?.cycles
      });

      return {
        cronograma: cronogramaData[tipo] || null,
        completedTopics: cronogramaData.completedTopics || {},
        activeSchedule: cronogramaData.activeSchedule || tipo,
      };
    } catch (error: any) {
      functions.logger.error("❌ Erro em getCronogramaAnual:", {
        message: error.message,
        stack: error.stack
      });

      if (error.code && error.code.startsWith('functions/')) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        `Erro ao carregar cronograma: ${error.message}`
      );
    }
  });

/**
 * Marcar/desmarcar tópico como concluído
 */
export const toggleTopicoCompleto = functions
  .region("southamerica-east1")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 30,
  })
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Você precisa estar autenticado"
        );
      }

      const { topicoId, completed } = data;

      if (!topicoId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "topicoId é obrigatório"
        );
      }

      const cronogramaRef = db.collection("cronogramas_anuais").doc(context.auth.uid);
      const cronogramaDoc = await cronogramaRef.get();
      
      // Obter completedTopics atual ou criar novo objeto
      const currentData = cronogramaDoc.data() || {};
      const completedTopics = currentData.completedTopics || {};
      
      // Atualizar o tópico específico
      completedTopics[topicoId] = completed;
      
      // Salvar de volta
      await cronogramaRef.set({
        completedTopics,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // Sincronizar com conteudos_progresso para metas de tópicos
      const progressoRef = db
        .collection("alunos")
        .doc(context.auth.uid)
        .collection("conteudos_progresso")
        .doc(topicoId);

      if (completed) {
        // Marcar como concluído
        await progressoRef.set({
          concluido: true,
          topicoId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } else {
        // Desmarcar como concluído
        await progressoRef.set({
          concluido: false,
          topicoId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      functions.logger.info("✅ Tópico atualizado e sincronizado", {
        topicoId,
        completed
      });

      return { success: true };
    } catch (error: any) {
      functions.logger.error("❌ Erro em toggleTopicoCompleto:", error);

      if (error.code && error.code.startsWith('functions/')) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        `Erro ao atualizar tópico: ${error.message}`
      );
    }
  });

/**
 * Definir cronograma ativo (extensivo ou intensivo)
 */
export const setActiveSchedule = functions
  .region("southamerica-east1")
  .runWith({
    memory: "256MB",
    timeoutSeconds: 30,
  })
  .https.onCall(async (data, context) => {
    try {
      if (!context.auth) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Você precisa estar autenticado"
        );
      }

      const { tipo } = data;

      if (!tipo || !["extensive", "intensive"].includes(tipo)) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "tipo deve ser 'extensive' ou 'intensive'"
        );
      }

      const cronogramaRef = db.collection("cronogramas_anuais").doc(context.auth.uid);
      
      await cronogramaRef.set({
        activeSchedule: tipo,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      functions.logger.info("✅ Cronograma ativo atualizado", { tipo });

      return { success: true };
    } catch (error: any) {
      functions.logger.error("❌ Erro em setActiveSchedule:", error);

      if (error.code && error.code.startsWith('functions/')) {
        throw error;
      }

      throw new functions.https.HttpsError(
        "internal",
        `Erro ao definir cronograma ativo: ${error.message}`
      );
    }
  });

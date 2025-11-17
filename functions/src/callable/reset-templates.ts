import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Importar dados dos templates
const cronogramaExtensivo = require("../data/cronograma-extensivo.json");
const cronogramaIntensivo = require("../data/cronograma-intensivo.json");

/**
 * Função HTTP para DELETAR e RECRIAR templates
 * Garante que os dados novos sejam salvos sem cache
 */
export const resetTemplates = functions
  .region("southamerica-east1")
  .runWith({
    memory: "512MB",
    timeoutSeconds: 60,
  })
  .https.onRequest(async (req, res) => {
    try {
      functions.logger.info("🔄 Iniciando RESET completo de templates...");

      // DELETAR templates antigos
      functions.logger.info("🗑️ Deletando templates antigos...");
      await Promise.all([
        db.collection("templates_cronograma").doc("extensive").delete(),
        db.collection("templates_cronograma").doc("intensive").delete(),
      ]);
      
      functions.logger.info("✅ Templates antigos deletados!");

      // Aguardar um pouco para garantir que a deleção foi processada
      await new Promise(resolve => setTimeout(resolve, 1000));

      // CRIAR templates novos
      functions.logger.info(`📝 Criando extensivo (${cronogramaExtensivo.length} ciclos)...`);
      await db.collection("templates_cronograma").doc("extensive").set({
        cycles: cronogramaExtensivo,
        tipo: "extensive",
        nome: "Cronograma Extensivo",
        descricao: "Cronograma completo para preparação ao longo do ano",
        version: 3,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      functions.logger.info(`📝 Criando intensivo (${cronogramaIntensivo.length} ciclos)...`);
      await db.collection("templates_cronograma").doc("intensive").set({
        cycles: cronogramaIntensivo,
        tipo: "intensive",
        nome: "Cronograma Intensivo",
        descricao: "Cronograma focado para preparação intensiva",
        version: 3,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Verificar criação
      const [extensiveDoc, intensiveDoc] = await Promise.all([
        db.collection("templates_cronograma").doc("extensive").get(),
        db.collection("templates_cronograma").doc("intensive").get(),
      ]);

      const extensiveData = extensiveDoc.data();
      const intensiveData = intensiveDoc.data();

      // Contar tópicos
      const extensiveTopics = extensiveData?.cycles.reduce(
        (sum: number, c: any) => sum + c.subjects.reduce((s: number, sub: any) => s + sub.topics.length, 0),
        0
      );
      const intensiveTopics = intensiveData?.cycles.reduce(
        (sum: number, c: any) => sum + c.subjects.reduce((s: number, sub: any) => s + sub.topics.length, 0),
        0
      );

      functions.logger.info("✅ Templates recriados com sucesso!");

      res.status(200).json({
        success: true,
        message: "Templates deletados e recriados com sucesso!",
        templates: {
          extensive: {
            cycles: extensiveData?.cycles.length || 0,
            topics: extensiveTopics || 0,
            version: extensiveData?.version || 0,
          },
          intensive: {
            cycles: intensiveData?.cycles.length || 0,
            topics: intensiveTopics || 0,
            version: intensiveData?.version || 0,
          },
        },
      });
    } catch (error: any) {
      functions.logger.error("❌ Erro ao resetar templates:", error);

      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

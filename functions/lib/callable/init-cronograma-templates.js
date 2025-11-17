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
exports.forceInitTemplates = void 0;
exports.initializeTemplatesIfNeeded = initializeTemplatesIfNeeded;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Importar dados dos templates
const cronogramaExtensivo = require("../data/cronograma-extensivo.json");
const cronogramaIntensivo = require("../data/cronograma-intensivo.json");
/**
 * Função para inicializar templates de cronograma
 * Será chamada automaticamente quando necessário
 */
// Versão dos templates - incrementar quando houver mudanças
const TEMPLATE_VERSION = 3; // Corrigido: 383 tópicos (removido Química 2 e 3 como tópicos)
async function initializeTemplatesIfNeeded() {
    try {
        // Verificar se templates já existem
        const extensiveRef = db.collection("templates_cronograma").doc("extensive");
        const intensiveRef = db.collection("templates_cronograma").doc("intensive");
        const [extensiveDoc, intensiveDoc] = await Promise.all([
            extensiveRef.get(),
            intensiveRef.get(),
        ]);
        const promises = [];
        // Verificar e atualizar template extensivo
        const needsExtensiveUpdate = !extensiveDoc.exists ||
            (extensiveDoc.data()?.version || 0) < TEMPLATE_VERSION;
        if (needsExtensiveUpdate) {
            functions.logger.info("📦 Atualizando template extensivo...");
            promises.push(extensiveRef.set({
                cycles: cronogramaExtensivo,
                tipo: "extensive",
                nome: "Cronograma Extensivo",
                descricao: "Cronograma completo para preparação ao longo do ano",
                version: TEMPLATE_VERSION,
                createdAt: extensiveDoc.exists ? extensiveDoc.data()?.createdAt : admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }));
        }
        // Verificar e atualizar template intensivo
        const needsIntensiveUpdate = !intensiveDoc.exists ||
            (intensiveDoc.data()?.version || 0) < TEMPLATE_VERSION;
        if (needsIntensiveUpdate) {
            functions.logger.info("📦 Atualizando template intensivo...");
            promises.push(intensiveRef.set({
                cycles: cronogramaIntensivo,
                tipo: "intensive",
                nome: "Cronograma Intensivo",
                descricao: "Cronograma focado para preparação intensiva",
                version: TEMPLATE_VERSION,
                createdAt: intensiveDoc.exists ? intensiveDoc.data()?.createdAt : admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }));
        }
        if (promises.length > 0) {
            await Promise.all(promises);
            functions.logger.info(`✅ Templates atualizados para versão ${TEMPLATE_VERSION}!`);
            return true;
        }
        return false; // Templates já estavam atualizados
    }
    catch (error) {
        functions.logger.error("❌ Erro ao inicializar templates:", error);
        throw error;
    }
}
/**
 * Função HTTP para forçar inicialização dos templates
 * Útil para debug e manutenção
 */
exports.forceInitTemplates = functions
    .region("southamerica-east1")
    .runWith({
    memory: "512MB",
    timeoutSeconds: 60,
})
    .https.onCall(async (data, context) => {
    try {
        // Apenas admin/mentor pode executar
        if (!context.auth) {
            throw new functions.https.HttpsError("unauthenticated", "Você precisa estar autenticado");
        }
        functions.logger.info("🔄 Forçando inicialização de templates...");
        // Sempre recriar os templates
        const extensiveRef = db.collection("templates_cronograma").doc("extensive");
        const intensiveRef = db.collection("templates_cronograma").doc("intensive");
        await Promise.all([
            extensiveRef.set({
                cycles: cronogramaExtensivo,
                tipo: "extensive",
                nome: "Cronograma Extensivo",
                descricao: "Cronograma completo para preparação ao longo do ano",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
            intensiveRef.set({
                cycles: cronogramaIntensivo,
                tipo: "intensive",
                nome: "Cronograma Intensivo",
                descricao: "Cronograma focado para preparação intensiva",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }),
        ]);
        functions.logger.info("✅ Templates recriados com sucesso!");
        return {
            success: true,
            message: "Templates inicializados com sucesso",
            extensiveCycles: cronogramaExtensivo.length,
            intensiveCycles: cronogramaIntensivo.length,
        };
    }
    catch (error) {
        functions.logger.error("❌ Erro ao forçar inicialização:", error);
        throw new functions.https.HttpsError("internal", `Erro ao inicializar templates: ${error.message}`);
    }
});
//# sourceMappingURL=init-cronograma-templates.js.map
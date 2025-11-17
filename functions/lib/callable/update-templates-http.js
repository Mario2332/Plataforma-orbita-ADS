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
exports.updateTemplatesNow = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
// Importar dados dos templates
const cronogramaExtensivo = require("../data/cronograma-extensivo.json");
const cronogramaIntensivo = require("../data/cronograma-intensivo.json");
/**
 * Função HTTP pública para atualizar templates
 * Acesse: https://southamerica-east1-plataforma-mentoria-mario.cloudfunctions.net/updateTemplatesNow
 */
exports.updateTemplatesNow = functions
    .region("southamerica-east1")
    .runWith({
    memory: "512MB",
    timeoutSeconds: 60,
})
    .https.onRequest(async (req, res) => {
    try {
        functions.logger.info("🔄 Iniciando atualização forçada de templates...");
        // Atualizar template extensivo
        functions.logger.info(`📝 Atualizando extensivo (${cronogramaExtensivo.length} ciclos)...`);
        await db.collection("templates_cronograma").doc("extensive").set({
            cycles: cronogramaExtensivo,
            tipo: "extensive",
            nome: "Cronograma Extensivo",
            descricao: "Cronograma completo para prepara\u00e7\u00e3o ao longo do ano",
            version: 3,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Atualizar template intensivo
        functions.logger.info(`📝 Atualizando intensivo (${cronogramaIntensivo.length} ciclos)...`);
        await db.collection("templates_cronograma").doc("intensive").set({
            cycles: cronogramaIntensivo,
            tipo: "intensive",
            nome: "Cronograma Intensivo",
            descricao: "Cronograma focado para prepara\u00e7\u00e3o intensiva",
            version: 3,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Verificar atualização
        const [extensiveDoc, intensiveDoc] = await Promise.all([
            db.collection("templates_cronograma").doc("extensive").get(),
            db.collection("templates_cronograma").doc("intensive").get(),
        ]);
        const extensiveData = extensiveDoc.data();
        const intensiveData = intensiveDoc.data();
        functions.logger.info("✅ Templates atualizados com sucesso!");
        res.status(200).json({
            success: true,
            message: "Templates atualizados com sucesso!",
            templates: {
                extensive: {
                    cycles: extensiveData?.cycles.length || 0,
                    version: extensiveData?.version || 0,
                },
                intensive: {
                    cycles: intensiveData?.cycles.length || 0,
                    version: intensiveData?.version || 0,
                },
            },
        });
    }
    catch (error) {
        functions.logger.error("❌ Erro ao atualizar templates:", error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
//# sourceMappingURL=update-templates-http.js.map
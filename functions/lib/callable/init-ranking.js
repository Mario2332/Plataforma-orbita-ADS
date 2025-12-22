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
exports.initRankingAlunos = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Função HTTP para inicializar o ranking de todos os alunos existentes
 * Deve ser executada uma única vez para migrar alunos existentes
 */
exports.initRankingAlunos = functions
    .region("southamerica-east1")
    .https.onRequest(async (req, res) => {
    // Verificar método
    if (req.method !== "POST") {
        res.status(405).send("Método não permitido");
        return;
    }
    const db = admin.firestore();
    try {
        // Buscar todos os usuários com role "aluno"
        const usersSnapshot = await db.collection("users")
            .where("role", "==", "aluno")
            .get();
        let criados = 0;
        let jaExistentes = 0;
        let erros = 0;
        for (const userDoc of usersSnapshot.docs) {
            try {
                const userId = userDoc.id;
                const rankingRef = db.collection("ranking").doc(userId);
                const rankingDoc = await rankingRef.get();
                if (rankingDoc.exists) {
                    jaExistentes++;
                    continue;
                }
                // Criar registro no ranking
                await rankingRef.set({
                    nivel: 1,
                    pontosSemanais: 0,
                    ultimaAtualizacao: admin.firestore.FieldValue.serverTimestamp(),
                    criadoEm: admin.firestore.FieldValue.serverTimestamp(),
                });
                criados++;
                functions.logger.info(`Ranking criado para aluno: ${userId}`);
            }
            catch (error) {
                erros++;
                functions.logger.error(`Erro ao criar ranking para ${userDoc.id}:`, error);
            }
        }
        const resultado = {
            sucesso: true,
            totalAlunos: usersSnapshot.size,
            criados,
            jaExistentes,
            erros,
        };
        functions.logger.info("Inicialização de ranking concluída:", resultado);
        res.status(200).json(resultado);
    }
    catch (error) {
        functions.logger.error("Erro ao inicializar rankings:", error);
        res.status(500).json({ sucesso: false, erro: String(error) });
    }
});
//# sourceMappingURL=init-ranking.js.map
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
exports.rankingManualUpdate = exports.rankingWeeklyUpdate = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
/**
 * Cloud Function agendada para atualizar o ranking semanalmente
 * Executa todo domingo ao meio-dia (12:00) no horário de Brasília (America/Sao_Paulo)
 *
 * Regras de promoção/rebaixamento:
 * - Top 5 de cada nível sobem para o próximo nível
 * - Últimos 5 de cada nível descem para o nível anterior
 * - Se um nível tiver 5 ou menos alunos, todos sobem
 * - Nível 1 (Bronze): ninguém desce (já é o mais baixo)
 * - Nível 6 (Futuro Calouro): ninguém sobe (já é o mais alto)
 */
exports.rankingWeeklyUpdate = functions
    .region("southamerica-east1")
    .pubsub
    // Cron: domingo às 12:00 horário de Brasília (15:00 UTC durante horário de verão, 15:00 UTC fora)
    // Usando timezone para garantir horário correto
    .schedule("0 12 * * 0")
    .timeZone("America/Sao_Paulo")
    .onRun(async (context) => {
    const db = admin.firestore();
    functions.logger.info("Iniciando atualização semanal do ranking...");
    try {
        // Buscar todos os registros do ranking
        const rankingSnapshot = await db.collection("ranking").get();
        if (rankingSnapshot.empty) {
            functions.logger.info("Nenhum registro de ranking encontrado.");
            return null;
        }
        // Agrupar alunos por nível
        const alunosPorNivel = {
            1: [], 2: [], 3: [], 4: [], 5: [], 6: []
        };
        rankingSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const nivel = data.nivel || 1;
            const pontos = data.pontosSemanais || 0;
            if (alunosPorNivel[nivel]) {
                alunosPorNivel[nivel].push({ id: doc.id, pontos });
            }
        });
        // Ordenar cada nível por pontos (decrescente)
        Object.keys(alunosPorNivel).forEach(nivel => {
            alunosPorNivel[Number(nivel)].sort((a, b) => b.pontos - a.pontos);
        });
        // Processar promoções e rebaixamentos
        const batch = db.batch();
        let promocoes = 0;
        let rebaixamentos = 0;
        let manutencoes = 0;
        for (let nivel = 1; nivel <= 6; nivel++) {
            const alunos = alunosPorNivel[nivel];
            const totalNivel = alunos.length;
            if (totalNivel === 0)
                continue;
            alunos.forEach((aluno, index) => {
                const posicao = index + 1;
                const rankingRef = db.collection("ranking").doc(aluno.id);
                let novoNivel = nivel;
                // Regra: Se o nível tiver 5 ou menos alunos, todos sobem (exceto nível 6)
                if (totalNivel <= 5 && nivel < 6) {
                    novoNivel = nivel + 1;
                    promocoes++;
                }
                // Regra: Top 5 sobem de nível (exceto nível 6)
                else if (posicao <= 5 && nivel < 6) {
                    novoNivel = nivel + 1;
                    promocoes++;
                }
                // Regra: Últimos 5 descem de nível (exceto nível 1)
                else if (posicao > totalNivel - 5 && nivel > 1) {
                    novoNivel = nivel - 1;
                    rebaixamentos++;
                }
                // Manutenção
                else {
                    manutencoes++;
                }
                // Atualizar nível e resetar pontos semanais
                batch.update(rankingRef, {
                    nivel: novoNivel,
                    pontosSemanais: 0, // Reset para nova semana
                    nivelAnterior: nivel,
                    ultimaAtualizacaoSemanal: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
        }
        // Executar todas as atualizações
        await batch.commit();
        // Registrar histórico da atualização
        await db.collection("ranking_historico").add({
            dataAtualizacao: admin.firestore.FieldValue.serverTimestamp(),
            totalAlunos: rankingSnapshot.size,
            promocoes,
            rebaixamentos,
            manutencoes,
            distribuicaoPorNivel: {
                nivel1: alunosPorNivel[1].length,
                nivel2: alunosPorNivel[2].length,
                nivel3: alunosPorNivel[3].length,
                nivel4: alunosPorNivel[4].length,
                nivel5: alunosPorNivel[5].length,
                nivel6: alunosPorNivel[6].length,
            },
        });
        functions.logger.info(`Atualização semanal concluída:`, {
            totalAlunos: rankingSnapshot.size,
            promocoes,
            rebaixamentos,
            manutencoes,
        });
        return null;
    }
    catch (error) {
        functions.logger.error("Erro na atualização semanal do ranking:", error);
        throw error;
    }
});
/**
 * Função HTTP para executar a atualização do ranking manualmente (para testes)
 * ATENÇÃO: Usar apenas para testes ou situações emergenciais
 */
exports.rankingManualUpdate = functions
    .region("southamerica-east1")
    .https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Método não permitido");
        return;
    }
    const db = admin.firestore();
    functions.logger.info("Executando atualização manual do ranking...");
    try {
        // Buscar todos os registros do ranking
        const rankingSnapshot = await db.collection("ranking").get();
        if (rankingSnapshot.empty) {
            res.status(200).json({ sucesso: true, mensagem: "Nenhum registro de ranking encontrado." });
            return;
        }
        // Agrupar alunos por nível
        const alunosPorNivel = {
            1: [], 2: [], 3: [], 4: [], 5: [], 6: []
        };
        rankingSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const nivel = data.nivel || 1;
            const pontos = data.pontosSemanais || 0;
            if (alunosPorNivel[nivel]) {
                alunosPorNivel[nivel].push({ id: doc.id, pontos });
            }
        });
        // Ordenar cada nível por pontos (decrescente)
        Object.keys(alunosPorNivel).forEach(nivel => {
            alunosPorNivel[Number(nivel)].sort((a, b) => b.pontos - a.pontos);
        });
        // Processar promoções e rebaixamentos
        const batch = db.batch();
        let promocoes = 0;
        let rebaixamentos = 0;
        let manutencoes = 0;
        for (let nivel = 1; nivel <= 6; nivel++) {
            const alunos = alunosPorNivel[nivel];
            const totalNivel = alunos.length;
            if (totalNivel === 0)
                continue;
            alunos.forEach((aluno, index) => {
                const posicao = index + 1;
                const rankingRef = db.collection("ranking").doc(aluno.id);
                let novoNivel = nivel;
                // Regra: Se o nível tiver 5 ou menos alunos, todos sobem (exceto nível 6)
                if (totalNivel <= 5 && nivel < 6) {
                    novoNivel = nivel + 1;
                    promocoes++;
                }
                // Regra: Top 5 sobem de nível (exceto nível 6)
                else if (posicao <= 5 && nivel < 6) {
                    novoNivel = nivel + 1;
                    promocoes++;
                }
                // Regra: Últimos 5 descem de nível (exceto nível 1)
                else if (posicao > totalNivel - 5 && nivel > 1) {
                    novoNivel = nivel - 1;
                    rebaixamentos++;
                }
                // Manutenção
                else {
                    manutencoes++;
                }
                // Atualizar nível e resetar pontos semanais
                batch.update(rankingRef, {
                    nivel: novoNivel,
                    pontosSemanais: 0, // Reset para nova semana
                    nivelAnterior: nivel,
                    ultimaAtualizacaoSemanal: admin.firestore.FieldValue.serverTimestamp(),
                });
            });
        }
        // Executar todas as atualizações
        await batch.commit();
        // Registrar histórico da atualização
        await db.collection("ranking_historico").add({
            dataAtualizacao: admin.firestore.FieldValue.serverTimestamp(),
            tipo: "manual",
            totalAlunos: rankingSnapshot.size,
            promocoes,
            rebaixamentos,
            manutencoes,
            distribuicaoPorNivel: {
                nivel1: alunosPorNivel[1].length,
                nivel2: alunosPorNivel[2].length,
                nivel3: alunosPorNivel[3].length,
                nivel4: alunosPorNivel[4].length,
                nivel5: alunosPorNivel[5].length,
                nivel6: alunosPorNivel[6].length,
            },
        });
        res.status(200).json({
            sucesso: true,
            totalAlunos: rankingSnapshot.size,
            promocoes,
            rebaixamentos,
            manutencoes,
        });
    }
    catch (error) {
        functions.logger.error("Erro na atualização manual do ranking:", error);
        res.status(500).json({ sucesso: false, erro: String(error) });
    }
});
//# sourceMappingURL=rankingWeeklyUpdate.js.map
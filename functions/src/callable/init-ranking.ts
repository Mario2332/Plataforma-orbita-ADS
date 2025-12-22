import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Função HTTP para inicializar o ranking de todos os alunos existentes
 * Deve ser executada uma única vez para migrar alunos existentes
 */
export const initRankingAlunos = functions
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
        } catch (error) {
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
    } catch (error) {
      functions.logger.error("Erro ao inicializar rankings:", error);
      res.status(500).json({ sucesso: false, erro: String(error) });
    }
  });

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

/**
 * Trigger agendado que roda todos os dias à meia-noite (horário de Brasília)
 * 
 * Funções:
 * 1. Verificar metas diárias do dia anterior
 * 2. Marcar como falhadas se não bateram a meta
 * 3. Criar novas instâncias para hoje
 */
export const processarMetasDiarias = functions
  .region("southamerica-east1")
  .pubsub.schedule("0 0 * * *") // Todo dia à meia-noite
  .timeZone("America/Sao_Paulo")
  .onRun(async (context) => {
    try {
      functions.logger.info("Iniciando processamento de metas diárias...");

      // Buscar todos os alunos
      const alunosSnapshot = await db.collection("alunos").get();

      for (const alunoDoc of alunosSnapshot.docs) {
        const alunoId = alunoDoc.id;
        
        // Processar metas diárias deste aluno
        await processarMetasAlunoAsync(alunoId);
      }

      functions.logger.info("Processamento de metas diárias concluído!");
      return null;
    } catch (error: any) {
      functions.logger.error("Erro ao processar metas diárias:", error);
      throw error;
    }
  });

/**
 * Processa metas diárias de um aluno específico
 */
async function processarMetasAlunoAsync(alunoId: string) {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    // 1. Buscar todas as metas ativas com repetirDiariamente
    const metasSnapshot = await db
      .collection("alunos")
      .doc(alunoId)
      .collection("metas")
      .where("repetirDiariamente", "==", true)
      .where("status", "==", "ativa")
      .get();
    
    // Filtrar apenas metas "pai" (sem metaPaiId)
    const metasPaiSnapshot = metasSnapshot.docs.filter(doc => !doc.data().metaPaiId);

    for (const metaPaiDoc of metasPaiSnapshot) {
      const metaPai = metaPaiDoc.data();
      const metaPaiId = metaPaiDoc.id;

      // Verificar se ainda está dentro do período
      const dataFim = metaPai.dataFim.toDate();
      if (hoje > dataFim) {
        // Meta expirou, marcar como expirada
        await metaPaiDoc.ref.update({
          status: "expirada",
          updatedAt: admin.firestore.Timestamp.now(),
        });
        continue;
      }

      // 2. Buscar instância de ontem
      const instanciaOntemSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("metas")
        .where("metaPaiId", "==", metaPaiId)
        .where("dataReferencia", "==", admin.firestore.Timestamp.fromDate(ontem))
        .get();

      if (!instanciaOntemSnapshot.empty) {
        const instanciaOntem = instanciaOntemSnapshot.docs[0];
        const dadosOntem = instanciaOntem.data();

        // Verificar se bateu a meta de ontem
        if (dadosOntem.status === "ativa") {
          if (dadosOntem.valorAtual >= dadosOntem.valorAlvo) {
            // Bateu a meta!
            await instanciaOntem.ref.update({
              status: "concluida",
              dataConclusao: admin.firestore.Timestamp.fromDate(ontem),
              updatedAt: admin.firestore.Timestamp.now(),
            });
          } else {
            // Não bateu a meta, marcar como expirada (falhada)
            await instanciaOntem.ref.update({
              status: "expirada",
              updatedAt: admin.firestore.Timestamp.now(),
            });
          }
        }
      }

      // 3. Verificar se já existe instância para hoje
      const instanciaHojeSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("metas")
        .where("metaPaiId", "==", metaPaiId)
        .where("dataReferencia", "==", admin.firestore.Timestamp.fromDate(hoje))
        .get();

      if (instanciaHojeSnapshot.empty) {
        // Criar nova instância para hoje
        const instanciaHoje = {
          alunoId,
          tipo: metaPai.tipo,
          nome: `${metaPai.nome.split(' - ')[0]} - ${hoje.toLocaleDateString('pt-BR')}`,
          descricao: metaPai.descricao || '',
          valorAlvo: metaPai.valorAlvo,
          valorAtual: 0, // Começa zerada
          unidade: metaPai.unidade,
          repetirDiariamente: true,
          metaPaiId,
          dataReferencia: admin.firestore.Timestamp.fromDate(hoje),
          dataInicio: metaPai.dataInicio,
          dataFim: metaPai.dataFim,
          materia: metaPai.materia,
          status: "ativa",
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        };

        await db
          .collection("alunos")
          .doc(alunoId)
          .collection("metas")
          .add(instanciaHoje);

        functions.logger.info(
          `Criada instância diária para aluno ${alunoId}, meta ${metaPaiId}`
        );
      }
    }
  } catch (error: any) {
    functions.logger.error(
      `Erro ao processar metas do aluno ${alunoId}:`,
      error
    );
  }
}

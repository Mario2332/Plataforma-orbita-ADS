import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// BACKUP: Sistema de notificações removido temporariamente - ver pasta backup_notificacoes
// import { verificarECriarNotificacoesMeta } from "../helpers/metaNotificacoes";

const db = admin.firestore();

/**
 * Trigger: Atualizar progresso de metas quando um estudo é criado/atualizado
 */
export const onEstudoWrite = functions
  .region("southamerica-east1")
  .firestore.document("alunos/{alunoId}/estudos/{estudoId}")
  .onWrite(async (change, context) => {
    const alunoId = context.params.alunoId;

    try {
      // Buscar todas as metas ativas do aluno
      const metasSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("metas")
        .where("status", "==", "ativa")
        .get();

      if (metasSnapshot.empty) {
        return null;
      }
      
      // Filtrar metas:
      // - Excluir metas "pai" (repetirDiariamente=true sem metaPaiId)
      // - Para instâncias diárias, manter apenas as de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeStr = hoje.toISOString().split('T')[0];
      
      const metasValidas = metasSnapshot.docs.filter((doc) => {
        const meta = doc.data();
        
        // Excluir metas "pai" (templates)
        if (meta.repetirDiariamente && !meta.metaPaiId) {
          return false;
        }
        
        // Se for instância diária, verificar se é de hoje
        if (meta.metaPaiId && meta.dataReferencia) {
          const dataRef = meta.dataReferencia.toDate();
          dataRef.setHours(0, 0, 0, 0);
          const dataRefStr = dataRef.toISOString().split('T')[0];
          return dataRefStr === hojeStr;
        }
        
        return true;
      });

      // Buscar todos os estudos do aluno
      const estudosSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("estudos")
        .get();

      const estudos = estudosSnapshot.docs.map((doc) => doc.data());

      const batch = db.batch();
      const now = admin.firestore.Timestamp.now();

      for (const metaDoc of metasValidas) {
        const meta = metaDoc.data();
        let valorAtual = 0;

        // Calcular progresso baseado no tipo de meta
        switch (meta.tipo) {
          case 'horas': {
            // Para metas diárias, contar apenas estudos de hoje
            // Para metas normais, contar todo o período
            let dataInicio: Date;
            let dataFim: Date;
            
            if (meta.metaPaiId && meta.dataReferencia) {
              // Meta diária: apenas hoje
              const dataRef = meta.dataReferencia.toDate();
              dataRef.setHours(0, 0, 0, 0);
              dataInicio = dataRef;
              dataFim = new Date(dataRef);
              dataFim.setHours(23, 59, 59, 999);
            } else {
              // Meta normal: período completo
              dataInicio = meta.dataInicio.toDate();
              dataFim = meta.dataFim.toDate();
            }
            
            valorAtual = estudos
              .filter((e: any) => {
                const dataEstudo = e.data.toDate();
                return dataEstudo >= dataInicio && dataEstudo <= dataFim;
              })
              .reduce((acc: number, e: any) => acc + (e.tempoMinutos || 0), 0) / 60;
            
            valorAtual = Math.round(valorAtual * 10) / 10; // Arredondar para 1 casa decimal
            break;
          }

          case 'questoes': {
            // Para metas diárias, contar apenas questões de hoje
            // Para metas normais, contar todo o período
            let dataInicio: Date;
            let dataFim: Date;
            
            if (meta.metaPaiId && meta.dataReferencia) {
              // Meta diária: apenas hoje
              const dataRef = meta.dataReferencia.toDate();
              dataRef.setHours(0, 0, 0, 0);
              dataInicio = dataRef;
              dataFim = new Date(dataRef);
              dataFim.setHours(23, 59, 59, 999);
            } else {
              // Meta normal: período completo
              dataInicio = meta.dataInicio.toDate();
              dataFim = meta.dataFim.toDate();
            }
            
            valorAtual = estudos
              .filter((e: any) => {
                const dataEstudo = e.data.toDate();
                const matchPeriodo = dataEstudo >= dataInicio && dataEstudo <= dataFim;
                const matchMateria = !meta.materia || e.materia === meta.materia;
                return matchPeriodo && matchMateria;
              })
              .reduce((acc: number, e: any) => acc + (e.questoesFeitas || 0), 0);
            break;
          }

          case 'sequencia': {
            // Calcular dias consecutivos de estudo
            const datasEstudo = [...new Set(estudos.map((e: any) => {
              const data = e.data.toDate();
              return data.toISOString().split('T')[0];
            }))].sort().reverse();

            let streak = 0;
            const hoje = new Date().toISOString().split('T')[0];
            
            if (datasEstudo.length > 0) {
              let dataAtual = new Date(hoje);
              
              for (const dataStr of datasEstudo) {
                const dataEstudo = new Date(dataStr);
                const diffDias = Math.floor((dataAtual.getTime() - dataEstudo.getTime()) / (1000 * 60 * 60 * 24));
                
                if (diffDias === 0 || diffDias === 1) {
                  streak++;
                  dataAtual = dataEstudo;
                } else {
                  break;
                }
              }
            }
            
            valorAtual = streak;
            break;
          }

          default:
            // Outros tipos de meta não são atualizados por estudos
            continue;
        }

        // Atualizar meta
        const updateData: any = {
          valorAtual,
          updatedAt: now,
        };

        // BACKUP: Sistema de notificações removido temporariamente - ver pasta backup_notificacoes
        // Verificar e criar notificações
        // const notifResult = await verificarECriarNotificacoesMeta(
        //   alunoId,
        //   metaDoc.id,
        //   meta.nome,
        //   meta.status,
        //   meta.valorAtual || 0,
        //   valorAtual,
        //   meta.valorAlvo,
        //   'updateMetasProgress'
        // );
        
        // Verificar se meta foi concluída (sem notificação)
        if (valorAtual >= meta.valorAlvo && meta.status === 'ativa') {
          updateData.status = 'concluida';
          updateData.dataConclusao = now;
        }

        batch.update(metaDoc.ref, updateData);
      }

      await batch.commit();
      functions.logger.info(`Progresso de metas atualizado para aluno ${alunoId}`);
      
      return null;
    } catch (error: any) {
      functions.logger.error("Erro ao atualizar progresso de metas:", error);
      return null;
    }
  });

/**
 * Trigger: Atualizar progresso de metas quando um simulado é criado/atualizado
 */
export const onSimuladoWrite = functions
  .region("southamerica-east1")
  .firestore.document("alunos/{alunoId}/simulados/{simuladoId}")
  .onWrite(async (change, context) => {
    const alunoId = context.params.alunoId;

    try {
      // Buscar todas as metas ativas do aluno
      const metasSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("metas")
        .where("status", "==", "ativa")
        .get();

      if (metasSnapshot.empty) {
        return null;
      }
      
      // Filtrar metas:
      // - Excluir metas "pai" (repetirDiariamente=true sem metaPaiId)
      // - Para instâncias diárias, manter apenas as de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeStr = hoje.toISOString().split('T')[0];
      
      const metasValidas = metasSnapshot.docs.filter((doc) => {
        const meta = doc.data();
        
        // Excluir metas "pai" (templates)
        if (meta.repetirDiariamente && !meta.metaPaiId) {
          return false;
        }
        
        // Se for instância diária, verificar se é de hoje
        if (meta.metaPaiId && meta.dataReferencia) {
          const dataRef = meta.dataReferencia.toDate();
          dataRef.setHours(0, 0, 0, 0);
          const dataRefStr = dataRef.toISOString().split('T')[0];
          return dataRefStr === hojeStr;
        }
        
        return true;
      });

      // Buscar todos os simulados do aluno
      const simuladosSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("simulados")
        .get();

      const simulados = simuladosSnapshot.docs.map((doc) => doc.data());

      const batch = db.batch();
      const now = admin.firestore.Timestamp.now();

      for (const metaDoc of metasValidas) {
        const meta = metaDoc.data();
        let valorAtual = 0;

        // Calcular progresso baseado no tipo de meta
        switch (meta.tipo) {
          case 'simulados': {
            // Contar simulados no período da meta
            const dataInicio = meta.dataInicio.toDate();
            const dataFim = meta.dataFim.toDate();
            
            valorAtual = simulados.filter((s: any) => {
              const dataSimulado = s.data.toDate();
              return dataSimulado >= dataInicio && dataSimulado <= dataFim;
            }).length;
            break;
          }

          case 'desempenho': {
            // Somar acertos em simulados no período da meta
            const dataInicio = meta.dataInicio.toDate();
            const dataFim = meta.dataFim.toDate();
            
            valorAtual = simulados
              .filter((s: any) => {
                const dataSimulado = s.data.toDate();
                return dataSimulado >= dataInicio && dataSimulado <= dataFim;
              })
              .reduce((acc: number, s: any) => {
                let acertos = 0;
                
                if (meta.materia) {
                  // Filtrar por matéria específica
                  switch (meta.materia) {
                    case 'Matemática':
                      acertos = s.matematicaAcertos || 0;
                      break;
                    case 'Linguagens':
                      acertos = s.linguagensAcertos || 0;
                      break;
                    case 'Ciências Humanas':
                    case 'História':
                    case 'Geografia':
                    case 'Filosofia':
                    case 'Sociologia':
                      acertos = s.humanasAcertos || 0;
                      break;
                    case 'Ciências da Natureza':
                    case 'Biologia':
                    case 'Física':
                    case 'Química':
                      acertos = s.naturezaAcertos || 0;
                      break;
                  }
                } else {
                  // Somar todos os acertos
                  acertos = (s.matematicaAcertos || 0) +
                           (s.linguagensAcertos || 0) +
                           (s.humanasAcertos || 0) +
                           (s.naturezaAcertos || 0);
                }
                
                return acc + acertos;
              }, 0);
            break;
          }

          default:
            // Outros tipos de meta não são atualizados por simulados
            continue;
        }

        // Atualizar meta
        const updateData: any = {
          valorAtual,
          updatedAt: now,
        };

        // BACKUP: Sistema de notificações removido temporariamente - ver pasta backup_notificacoes
        // Verificar e criar notificações
        // const notifResult = await verificarECriarNotificacoesMeta(
        //   alunoId,
        //   metaDoc.id,
        //   meta.nome,
        //   meta.status,
        //   meta.valorAtual || 0,
        //   valorAtual,
        //   meta.valorAlvo,
        //   'updateMetasProgress'
        // );
        
        // Verificar se meta foi concluída (sem notificação)
        if (valorAtual >= meta.valorAlvo && meta.status === 'ativa') {
          updateData.status = 'concluida';
          updateData.dataConclusao = now;
        }

        batch.update(metaDoc.ref, updateData);
      }

      await batch.commit();
      functions.logger.info(`Progresso de metas (simulados) atualizado para aluno ${alunoId}`);
      
      return null;
    } catch (error: any) {
      functions.logger.error("Erro ao atualizar progresso de metas (simulados):", error);
      return null;
    }
  });

/**
 * Trigger: Atualizar progresso de metas quando progresso de conteúdo é atualizado
 */
export const onConteudoProgressoWrite = functions
  .region("southamerica-east1")
  .firestore.document("alunos/{alunoId}/conteudos_progresso/{progressoId}")
  .onWrite(async (change, context) => {
    const alunoId = context.params.alunoId;

    try {
      // Buscar todas as metas ativas do aluno do tipo 'topicos'
      const metasSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("metas")
        .where("status", "==", "ativa")
        .where("tipo", "==", "topicos")
        .get();

      if (metasSnapshot.empty) {
        return null;
      }
      
      // Filtrar metas:
      // - Excluir metas "pai" (repetirDiariamente=true sem metaPaiId)
      // - Para instâncias diárias, manter apenas as de hoje
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const hojeStr = hoje.toISOString().split('T')[0];
      
      const metasValidas = metasSnapshot.docs.filter((doc) => {
        const meta = doc.data();
        
        // Excluir metas "pai" (templates)
        if (meta.repetirDiariamente && !meta.metaPaiId) {
          return false;
        }
        
        // Se for instância diária, verificar se é de hoje
        if (meta.metaPaiId && meta.dataReferencia) {
          const dataRef = meta.dataReferencia.toDate();
          dataRef.setHours(0, 0, 0, 0);
          const dataRefStr = dataRef.toISOString().split('T')[0];
          return dataRefStr === hojeStr;
        }
        
        return true;
      });

      // Buscar progresso de todos os conteúdos do aluno
      const progressoSnapshot = await db
        .collection("alunos")
        .doc(alunoId)
        .collection("conteudos_progresso")
        .where("concluido", "==", true)
        .get();

      const batch = db.batch();
      const now = admin.firestore.Timestamp.now();

      for (const metaDoc of metasValidas) {
        const meta = metaDoc.data();
        
        // Contar tópicos concluídos no período da meta
        const dataInicio = meta.dataInicio.toDate();
        const dataFim = meta.dataFim.toDate();
        
        const valorAtual = progressoSnapshot.docs.filter((doc) => {
          const data = doc.data();
          // Usar dataConclusao se existir, senão usar updatedAt ou createdAt
          const dataConclusao = data.dataConclusao?.toDate() || data.updatedAt?.toDate() || data.createdAt?.toDate();
          
          if (!dataConclusao) return false;
          
          const matchPeriodo = dataConclusao >= dataInicio && dataConclusao <= dataFim;
          
          // Filtrar por incidencia apenas se a meta especificar E o progresso tiver incidencia
          // (para não excluir tópicos do cronograma anual que não têm incidencia)
          const matchIncidencia = !meta.incidencia || !data.incidencia || data.incidencia === meta.incidencia;
          
          return matchPeriodo && matchIncidencia;
        }).length;

        // Atualizar meta
        const updateData: any = {
          valorAtual,
          updatedAt: now,
        };

        // BACKUP: Sistema de notificações removido temporariamente - ver pasta backup_notificacoes
        // Verificar e criar notificações
        // const notifResult = await verificarECriarNotificacoesMeta(
        //   alunoId,
        //   metaDoc.id,
        //   meta.nome,
        //   meta.status,
        //   meta.valorAtual || 0,
        //   valorAtual,
        //   meta.valorAlvo,
        //   'updateMetasProgress'
        // );
        
        // Verificar se meta foi concluída (sem notificação)
        if (valorAtual >= meta.valorAlvo && meta.status === 'ativa') {
          updateData.status = 'concluida';
          updateData.dataConclusao = now;
        }

        batch.update(metaDoc.ref, updateData);
      }

      await batch.commit();
      functions.logger.info(`Progresso de metas (tópicos) atualizado para aluno ${alunoId}`);
      
      return null;
    } catch (error: any) {
      functions.logger.error("Erro ao atualizar progresso de metas (tópicos):", error);
      return null;
    }
  });

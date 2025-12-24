import * as admin from "firebase-admin";
import { criarNotificacao, TipoNotificacao } from "../callable/notificacoes";

/**
 * Verifica e cria notificações de progresso e conclusão de meta
 * @param alunoId ID do aluno
 * @param metaId ID da meta
 * @param metaNome Nome da meta
 * @param metaStatus Status atual da meta
 * @param valorAnterior Valor anterior da meta
 * @param valorAtual Valor atual da meta
 * @param valorAlvo Valor alvo da meta
 * @param triggerName Nome do trigger que chamou (para logs)
 * @returns Objeto com status e dataConclusao se meta foi concluída
 */
export async function verificarECriarNotificacoesMeta(
  alunoId: string,
  metaId: string,
  metaNome: string,
  metaStatus: string,
  valorAnterior: number,
  valorAtual: number,
  valorAlvo: number,
  triggerName: string
): Promise<{ status?: string; dataConclusao?: admin.firestore.Timestamp }> {
  const resultado: { status?: string; dataConclusao?: admin.firestore.Timestamp } = {};
  
  console.log(`[${triggerName}] Meta "${metaNome}" (${metaId})`);
  console.log(`[${triggerName}]   - Status: ${metaStatus}`);
  console.log(`[${triggerName}]   - Progresso: ${valorAnterior} -> ${valorAtual} / ${valorAlvo}`);
  
  // Verificar se atingiu o alvo
  if (valorAtual >= valorAlvo) {
    console.log(`[${triggerName}]   ✅ Meta atingiu o alvo!`);
    
    if (metaStatus === 'ativa') {
      console.log(`[${triggerName}]   🎉 Meta estava ativa, marcando como concluída e criando notificação...`);
      
      resultado.status = 'concluida';
      resultado.dataConclusao = admin.firestore.Timestamp.now();
      
      try {
        await criarNotificacao(
          alunoId,
          'meta_concluida',
          '🎉 Meta Concluída!',
          `Parabéns! Você atingiu a meta "${metaNome}".`,
          metaId,
          metaNome
        );
        console.log(`[${triggerName}]   ✅ Notificação de conclusão criada com sucesso!`);
      } catch (error) {
        console.error(`[${triggerName}]   ❌ ERRO ao criar notificação de conclusão:`, error);
        throw error; // Re-throw para não perder o erro
      }
    } else {
      console.log(`[${triggerName}]   ⚠️  Meta já estava concluída (status: ${metaStatus}), não criando notificação`);
    }
  } else {
    // Verificar marcos de progresso (25%, 50%, 75%)
    const percentualAnterior = (valorAnterior / valorAlvo) * 100;
    const percentualAtual = (valorAtual / valorAlvo) * 100;
    
    console.log(`[${triggerName}]   - Percentual: ${percentualAnterior.toFixed(1)}% -> ${percentualAtual.toFixed(1)}%`);
    
    // Verificar cada marco
    const marcos: Array<{ percentual: number; tipo: TipoNotificacao; emoji: string; mensagem: string }> = [
      { percentual: 25, tipo: 'progresso_25', emoji: '📈', mensagem: 'Continue assim!' },
      { percentual: 50, tipo: 'progresso_50', emoji: '🎯', mensagem: 'Você está na metade do caminho!' },
      { percentual: 75, tipo: 'progresso_75', emoji: '🚀', mensagem: 'Falta pouco!' }
    ];
    
    for (const marco of marcos) {
      if (percentualAnterior < marco.percentual && percentualAtual >= marco.percentual) {
        console.log(`[${triggerName}]   🎯 Marco ${marco.percentual}% atingido! Criando notificação...`);
        
        try {
          await criarNotificacao(
            alunoId,
            marco.tipo,
            `${marco.emoji} ${marco.percentual}% da Meta Atingido`,
            `Você completou ${marco.percentual}% da meta "${metaNome}". ${marco.mensagem}`,
            metaId,
            metaNome
          );
          console.log(`[${triggerName}]   ✅ Notificação ${marco.percentual}% criada com sucesso!`);
        } catch (error) {
          console.error(`[${triggerName}]   ❌ ERRO ao criar notificação ${marco.percentual}%:`, error);
          // Não re-throw aqui para tentar criar outras notificações
        }
      }
    }
  }
  
  return resultado;
}

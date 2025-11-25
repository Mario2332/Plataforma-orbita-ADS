import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { 
  getNotificacoes, 
  marcarNotificacaoLida, 
  marcarTodasNotificacoesLidas,
  deletarNotificacao,
  contarNotificacoesNaoLidas,
  Notificacao 
} from '../services/api-notificacoes';

const Notificacoes: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [countNaoLidas, setCountNaoLidas] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const carregarNotificacoes = async () => {
    try {
      setLoading(true);
      const [notifs, count] = await Promise.all([
        getNotificacoes(50, false),
        contarNotificacoesNaoLidas()
      ]);
      setNotificacoes(notifs);
      setCountNaoLidas(count);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      // Falha silenciosa - não quebra a UI
      setNotificacoes([]);
      setCountNaoLidas(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarNotificacoes();
    // Atualizar a cada 30 segundos
    const interval = setInterval(carregarNotificacoes, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarcarLida = async (notificacaoId: string) => {
    try {
      await marcarNotificacaoLida(notificacaoId);
      setNotificacoes(prev => 
        prev.map(n => n.id === notificacaoId ? { ...n, lida: true } : n)
      );
      setCountNaoLidas(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const handleMarcarTodasLidas = async () => {
    try {
      await marcarTodasNotificacoesLidas();
      setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
      setCountNaoLidas(0);
      // Sucesso silencioso
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleDeletar = async (notificacaoId: string) => {
    try {
      await deletarNotificacao(notificacaoId);
      setNotificacoes(prev => prev.filter(n => n.id !== notificacaoId));
      const notif = notificacoes.find(n => n.id === notificacaoId);
      if (notif && !notif.lida) {
        setCountNaoLidas(prev => Math.max(0, prev - 1));
      }
      // Sucesso silencioso
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
    }
  };

  const formatarData = (timestamp: { seconds: number }) => {
    const data = new Date(timestamp.seconds * 1000);
    const agora = new Date();
    const diffMs = agora.getTime() - data.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `${diffDias}d atrás`;
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'meta_concluida':
        return '🎉';
      case 'meta_criada':
        return '⭐';
      case 'progresso_25':
      case 'progresso_50':
      case 'progresso_75':
        return '📈';
      case 'meta_expirada':
        return '⚠️';
      case 'meta_proxima_expirar':
        return '⏰';
      case 'sequencia_mantida':
        return '🔥';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative">
      {/* Botão de notificações */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700" />
        {countNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {countNaoLidas > 9 ? '9+' : countNaoLidas}
          </span>
        )}
      </button>

      {/* Painel de notificações */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Painel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Notificações</h3>
                {countNaoLidas > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {countNaoLidas}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {countNaoLidas > 0 && (
                  <button
                    onClick={handleMarcarTodasLidas}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    title="Marcar todas como lidas"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lista de notificações */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  Carregando...
                </div>
              ) : notificacoes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notificacoes.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notif.lida ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getIconeTipo(notif.tipo)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-gray-900 text-sm">
                              {notif.titulo}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatarData(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notif.mensagem}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {!notif.lida && (
                              <button
                                onClick={() => handleMarcarLida(notif.id)}
                                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Marcar como lida
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletar(notif.id)}
                              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Notificacoes;

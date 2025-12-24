import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { useAuthContext } from '../contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  metaId?: string;
  metaNome?: string;
  createdAt: Timestamp;
}

const Notificacoes: React.FC = () => {
  const { user } = useAuthContext();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [countNaoLidas, setCountNaoLidas] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const prevCountRef = useRef<number>(0);

  // Listener em tempo real do Firestore
  useEffect(() => {
    if (!user?.uid) {
      console.log('[Notificacoes] Usuário não autenticado');
      return;
    }

    console.log('[Notificacoes] Iniciando listener para usuário:', user.uid);

    try {
      const notificacoesRef = collection(db, 'alunos', user.uid, 'notificacoes');
      const q = query(notificacoesRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('[Notificacoes] Snapshot recebido, docs:', snapshot.size);
          
          const notifs: Notificacao[] = [];
          let naoLidas = 0;

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            console.log('[Notificacoes] Documento:', docSnap.id, data);
            
            notifs.push({
              id: docSnap.id,
              tipo: data.tipo || '',
              titulo: data.titulo || '',
              mensagem: data.mensagem || '',
              lida: data.lida || false,
              metaId: data.metaId,
              metaNome: data.metaNome,
              createdAt: data.createdAt,
            });

            if (!data.lida) {
              naoLidas++;
            }
          });

          console.log('[Notificacoes] Total notificações:', notifs.length, 'Não lidas:', naoLidas);

          // Mostrar toast apenas se houver novas notificações não lidas
          if (naoLidas > prevCountRef.current && notifs.length > 0) {
            const novaNotif = notifs[0];
            const emoji = getEmojiPorTipo(novaNotif.tipo);
            console.log('[Notificacoes] Mostrando toast para nova notificação');
            toast(`${emoji} ${novaNotif.titulo}`, {
              description: novaNotif.mensagem,
              duration: 5000,
            });
          }

          prevCountRef.current = naoLidas;
          setNotificacoes(notifs);
          setCountNaoLidas(naoLidas);
        },
        (error) => {
          console.error('[Notificacoes] Erro no listener:', error);
        }
      );

      return () => {
        console.log('[Notificacoes] Limpando listener');
        unsubscribe();
      };
    } catch (error) {
      console.error('[Notificacoes] Erro ao configurar listener:', error);
    }
  }, [user?.uid]);

  const handleMarcarLida = async (notificacaoId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user?.uid) return;

    try {
      const notifRef = doc(db, 'alunos', user.uid, 'notificacoes', notificacaoId);
      await updateDoc(notifRef, {
        lida: true,
        updatedAt: Timestamp.now(),
      });
      console.log('[Notificacoes] Marcada como lida:', notificacaoId);
    } catch (error) {
      console.error('[Notificacoes] Erro ao marcar como lida:', error);
    }
  };

  const handleMarcarTodasLidas = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user?.uid) return;

    try {
      const naoLidas = notificacoes.filter(n => !n.lida);
      const promises = naoLidas.map(notif => {
        const notifRef = doc(db, 'alunos', user.uid, 'notificacoes', notif.id);
        return updateDoc(notifRef, {
          lida: true,
          updatedAt: Timestamp.now(),
        });
      });
      await Promise.all(promises);
      console.log('[Notificacoes] Todas marcadas como lidas');
    } catch (error) {
      console.error('[Notificacoes] Erro ao marcar todas como lidas:', error);
    }
  };

  const handleDeletar = async (notificacaoId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user?.uid) return;

    try {
      const notifRef = doc(db, 'alunos', user.uid, 'notificacoes', notificacaoId);
      await deleteDoc(notifRef);
      console.log('[Notificacoes] Deletada:', notificacaoId);
    } catch (error) {
      console.error('[Notificacoes] Erro ao deletar:', error);
    }
  };

  const formatTempo = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    
    const agora = new Date();
    const data = timestamp.toDate();
    const diffMs = agora.getTime() - data.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    
    if (diffMinutos < 1) return 'Agora';
    if (diffMinutos < 60) return `${diffMinutos}m atrás`;
    
    const diffHoras = Math.floor(diffMinutos / 60);
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    
    const diffDias = Math.floor(diffHoras / 24);
    if (diffDias < 7) return `${diffDias}d atrás`;
    
    return data.toLocaleDateString('pt-BR');
  };

  const getEmojiPorTipo = (tipo: string) => {
    switch (tipo) {
      case 'meta_criada': return '⭐';
      case 'meta_concluida': return '🎉';
      case 'progresso_25': return '📈';
      case 'progresso_50': return '🎯';
      case 'progresso_75': return '🚀';
      default: return '📢';
    }
  };

  console.log('[Notificacoes] Renderizando. User:', !!user, 'Notifs:', notificacoes.length);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {countNaoLidas > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {countNaoLidas > 9 ? '9+' : countNaoLidas}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">Notificações</h3>
          {countNaoLidas > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarcarTodasLidas}
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {notificacoes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    !notif.lida ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">
                      {getEmojiPorTipo(notif.tipo)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm">{notif.titulo}</h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTempo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notif.mensagem}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {!notif.lida && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleMarcarLida(notif.id, e)}
                            className="h-7 text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Marcar como lida
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeletar(notif.id, e)}
                          className="h-7 text-xs text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notificacoes;

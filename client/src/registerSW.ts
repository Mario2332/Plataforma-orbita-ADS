/**
 * Registrar Service Worker para forçar atualização automática
 */

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registrado com sucesso:', registration.scope);

          // Verificar atualizações a cada 60 segundos
          setInterval(() => {
            registration.update();
          }, 60000);

          // Detectar quando há uma nova versão disponível
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão disponível - atualizar automaticamente
                  console.log('[SW] Nova versão disponível! Atualizando automaticamente...');
                  
                  // Atualizar automaticamente sem pedir confirmação
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  
                  // Aguardar 1 segundo e recarregar
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              });
            }
          });

          // Recarregar quando o service worker assumir controle
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
              refreshing = true;
              window.location.reload();
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Erro ao registrar:', error);
        });
    });
  }
}

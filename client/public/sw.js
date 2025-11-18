// Service Worker para forçar atualização da plataforma
const CACHE_VERSION = 'v' + Date.now();
const CACHE_NAME = 'plataforma-mentoria-' + CACHE_VERSION;

// Instalar service worker e limpar caches antigos
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando nova versão:', CACHE_VERSION);
  self.skipWaiting(); // Ativar imediatamente
});

// Ativar e limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Ativando nova versão:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Forçar controle imediato de todas as páginas abertas
      return self.clients.claim();
    })
  );
});

// Estratégia: Network First (sempre buscar da rede primeiro)
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições para APIs externas
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clonar a resposta para cache
        const responseToCache = response.clone();
        
        // Cachear apenas recursos estáticos
        if (event.request.url.includes('/assets/') || 
            event.request.url.endsWith('.js') || 
            event.request.url.endsWith('.css') ||
            event.request.url.endsWith('.png') ||
            event.request.url.endsWith('.jpg')) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Se falhar, tentar buscar do cache
        return caches.match(event.request);
      })
  );
});

// Mensagem para notificar página sobre atualização
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

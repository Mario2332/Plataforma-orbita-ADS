/**
 * Limpar cache antigo e forçar atualização
 * Este script roda uma única vez para limpar caches problemáticos
 */

const CACHE_CLEARED_KEY = 'cache_cleared_v2';

export function clearOldCacheIfNeeded() {
  // Verificar se já limpou o cache nesta versão
  const cacheCleared = localStorage.getItem(CACHE_CLEARED_KEY);
  
  if (!cacheCleared) {
    console.log('[Cache] Limpando cache antigo...');
    
    // Limpar todos os caches
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        cacheNames.forEach((cacheName) => {
          console.log('[Cache] Removendo cache:', cacheName);
          caches.delete(cacheName);
        });
      });
    }
    
    // Desregistrar service workers antigos
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          console.log('[Cache] Desregistrando service worker antigo');
          registration.unregister();
        });
      });
    }
    
    // Marcar como limpo
    localStorage.setItem(CACHE_CLEARED_KEY, 'true');
    
    // Recarregar página após limpar
    console.log('[Cache] Cache limpo! Recarregando...');
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
}

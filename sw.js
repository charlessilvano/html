const CACHE_NAME = 'pwa-manutencao-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
  // Os ícones 192 e 512 seriam incluídos aqui em um projeto real.
  // Tailwind e Fonts do Google estão via CDN, podemos fazer cache deles interceptando o fetch.
];

// Instalação: Cacheia os arquivos estáticos locais básicos
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Ativação: Limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// Estratégia Stale-While-Revalidate para ativos e Network-First para a API
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Não intercepta chamadas para os IPs locais da API na porta 5000 (Agente C#)
  if (requestUrl.port === '5000') {
    return; // Passa direto pela rede
  }

  // Cache-First / Fallback to Network (Garante funcionamento offline)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // Opcional: Cachear assets externos dinamicamente (Google Fonts, Tailwind CDN)
        if (event.request.url.startsWith('https://')) {
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
        }
        return networkResponse;
      });
    })
  );
});

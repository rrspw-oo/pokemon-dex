// Pokemon Dex Service Worker
const CACHE_NAME = 'pokemon-dex-v2';
const POKEMON_DATA_CACHE = 'pokemon-data-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/pokemonBall.svg'
];

// Pokemon data files to cache
const POKEMON_DATA_FILES = [
  '/src/data/pokemonNames.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache Pokemon data
      caches.open(POKEMON_DATA_CACHE).then((cache) => {
        console.log('Caching Pokemon data');
        return cache.addAll(POKEMON_DATA_FILES);
      })
    ]).then(() => {
      // Force activation
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => 
            cacheName !== CACHE_NAME && 
            cacheName !== POKEMON_DATA_CACHE
          )
          .map((cacheName) => {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Claim all clients
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle Pokemon data requests
  if (url.pathname.includes('/src/data/pokemonNames.json')) {
    event.respondWith(
      caches.match(request, { cacheName: POKEMON_DATA_CACHE })
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('Serving Pokemon data from cache');
            return cachedResponse;
          }
          
          console.log('Fetching Pokemon data from network');
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(POKEMON_DATA_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(() => {
              // If network fails and no cache, return empty data
              return new Response(JSON.stringify({
                version: '1.0.0',
                lastUpdated: new Date().toISOString().split('T')[0],
                totalCount: 0,
                pokemon: {},
                searchIndex: { zh: {}, en: {} },
                error: 'Data unavailable offline'
              }), {
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }

  // Handle static assets
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Cache successful responses
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(request, responseToCache);
                });
              
              return response;
            })
            .catch((error) => {
              // If it's a navigation request, return cached index.html
              if (request.mode === 'navigate') {
                return caches.match('/index.html');
              }
              throw error;
            });
        })
    );
  }
});

// Message event - handle cache updates
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'CACHE_POKEMON_DATA':
      event.waitUntil(
        caches.open(POKEMON_DATA_CACHE)
          .then((cache) => {
            return cache.put('/src/data/pokemonNames.json', 
              new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' }
              })
            );
          })
          .then(() => {
            event.ports[0].postMessage({ success: true });
          })
          .catch((error) => {
            console.error('Failed to cache Pokemon data:', error);
            event.ports[0].postMessage({ success: false, error: error.message });
          })
      );
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_STATUS':
      event.waitUntil(
        Promise.all([
          caches.has(CACHE_NAME),
          caches.has(POKEMON_DATA_CACHE)
        ]).then(([hasStaticCache, hasDataCache]) => {
          event.ports[0].postMessage({
            staticCache: hasStaticCache,
            dataCache: hasDataCache,
            version: CACHE_NAME
          });
        })
      );
      break;

    default:
      console.log('Unknown message type:', type);
  }
});

// Background sync for data updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'pokemon-data-update') {
    event.waitUntil(updatePokemonData());
  }
});

// Update Pokemon data in background
async function updatePokemonData() {
  try {
    const response = await fetch('/src/data/pokemonNames.json');
    if (response.ok) {
      const cache = await caches.open(POKEMON_DATA_CACHE);
      await cache.put('/src/data/pokemonNames.json', response.clone());
      console.log('Pokemon data updated in background');
    }
  } catch (error) {
    console.error('Failed to update Pokemon data:', error);
  }
}

console.log('Pokemon Dex Service Worker loaded');
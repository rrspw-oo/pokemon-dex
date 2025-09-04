// 寶可夢圖鑑 PWA Service Worker
const CACHE_NAME = 'pokemon-dex-v1.0.0';
const RUNTIME = 'runtime';

// 需要預先快取的核心檔案
const CORE_CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './hsin.png',
  './dorudo.png'
];

// 需要快取的 PokeAPI 端點
const API_CACHE_PATTERNS = [
  'https://pokeapi.co/api/v2/pokemon/',
  'https://pokeapi.co/api/v2/pokemon-species/'
];

// 安裝事件 - 預先快取核心檔案
self.addEventListener('install', event => {
  console.log('Service Worker: 安裝中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: 預先快取核心檔案');
        return cache.addAll(CORE_CACHE_FILES);
      })
      .then(() => {
        console.log('Service Worker: 安裝完成，跳過等待');
        return self.skipWaiting();
      })
  );
});

// 啟動事件 - 清理舊快取
self.addEventListener('activate', event => {
  console.log('Service Worker: 啟動中...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== RUNTIME)
          .map(cacheName => {
            console.log('Service Worker: 刪除舊快取', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('Service Worker: 控制所有頁面');
      return self.clients.claim();
    })
  );
});

// Fetch 事件 - 攔截網路請求
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 處理 PokeAPI 請求 - Network First 策略
  if (isPokeAPIRequest(url)) {
    event.respondWith(handlePokeAPIRequest(request));
    return;
  }
  
  // 處理應用程式資源 - Cache First 策略
  if (url.origin === location.origin) {
    event.respondWith(handleAppRequest(request));
    return;
  }
  
  // 處理外部圖片資源 - Stale While Revalidate 策略
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }
});

// 檢查是否為 PokeAPI 請求
function isPokeAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => url.href.startsWith(pattern));
}

// 處理 PokeAPI 請求 - Network First，失敗時使用快取
async function handlePokeAPIRequest(request) {
  const cache = await caches.open(RUNTIME);
  
  try {
    // 嘗試從網路獲取
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // 快取成功的響應
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: 網路請求失敗，使用快取', request.url);
  }
  
  // 網路失敗，嘗試從快取獲取
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 如果快取也沒有，返回離線頁面或錯誤響應
  return new Response(
    JSON.stringify({
      error: '網路連線失敗且無快取資料',
      offline: true
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// 處理應用程式請求 - Cache First 策略
async function handleAppRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: 無法載入資源', request.url);
    
    // 返回離線提示
    if (request.mode === 'navigate') {
      return caches.match('./index.html');
    }
    
    return new Response('資源暫時無法使用', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// 處理圖片請求 - Stale While Revalidate 策略
async function handleImageRequest(request) {
  const cache = await caches.open(RUNTIME);
  const cachedResponse = await cache.match(request);
  
  // 背景更新快取
  const fetchPromise = fetch(request).then(response => {
    if (response && response.status === 200) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(error => {
    console.log('Service Worker: 圖片載入失敗', request.url);
    return null;
  });
  
  // 立即返回快取版本（如果有的話）
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // 沒有快取，等待網路響應
  const networkResponse = await fetchPromise;
  if (networkResponse) {
    return networkResponse;
  }
  
  // 返回預設圖片或錯誤響應
  return new Response(
    '<svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 70 70"><rect width="70" height="70" fill="#f0f0f0"/><text x="35" y="40" text-anchor="middle" font-family="Arial" font-size="12" fill="#999">?</text></svg>',
    {
      headers: { 'Content-Type': 'image/svg+xml' }
    }
  );
}

// 處理快取清理消息
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});

// 背景同步（如果支援）
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'pokemon-sync') {
      event.waitUntil(syncPokemonData());
    }
  });
}

// 背景同步寶可夢資料
async function syncPokemonData() {
  try {
    console.log('Service Worker: 背景同步寶可夢資料');
    // 這裡可以實作背景預載熱門寶可夢資料
    const popularPokemon = [1, 25, 150, 151]; // 妙蛙種子、皮卡丘、超夢、夢幻
    
    const cache = await caches.open(RUNTIME);
    const promises = popularPokemon.map(id => 
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
        .then(response => {
          if (response.ok) {
            cache.put(`https://pokeapi.co/api/v2/pokemon/${id}`, response.clone());
          }
          return response;
        })
        .catch(error => console.log('背景同步失敗:', error))
    );
    
    await Promise.all(promises);
    console.log('Service Worker: 背景同步完成');
  } catch (error) {
    console.error('Service Worker: 背景同步錯誤', error);
  }
}
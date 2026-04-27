import { Workbox } from 'workbox-window';

const SW_URL = `${import.meta.env.BASE_URL}sw.js`;

let wb;
let reloading = false;

export function initializePWA() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  wb = new Workbox(SW_URL, { scope: import.meta.env.BASE_URL });

  wb.addEventListener('waiting', () => {
    wb.messageSkipWaiting();
  });

  wb.addEventListener('controlling', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  wb.register().catch(() => {});
}

// Check if app is running as PWA
export function isPWA() {
  return window.matchMedia && window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

// Get cache status
export async function getCacheStatus() {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    return { available: false };
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      resolve({
        available: true,
        ...event.data
      });
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_STATUS' },
      [channel.port2]
    );
  });
}

// Cache Pokemon data manually
export async function cachePokemonData(data) {
  if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
    return false;
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      resolve(event.data.success);
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'CACHE_POKEMON_DATA', data },
      [channel.port2]
    );
  });
}

// Show install prompt
let deferredPrompt;

export function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
  });
}

export async function showInstallPrompt() {
  if (!deferredPrompt) {
    return false;
  }

  // Show the prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  
  // Reset the prompt
  deferredPrompt = null;
  
  return outcome === 'accepted';
}

export function canInstall() {
  return !!deferredPrompt;
}

// Network status monitoring
export function setupNetworkMonitoring() {
  let isOnline = navigator.onLine;
  
  const updateOnlineStatus = () => {
    const wasOnline = isOnline;
    isOnline = navigator.onLine;
    
    if (!wasOnline && isOnline) {
      // Came back online
      // Trigger background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          return registration.sync.register('pokemon-data-update');
        });
      }
    } else if (wasOnline && !isOnline) {
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  return isOnline;
}

// Check for app updates
export async function checkForUpdates() {
  if (wb) {
    const registration = await wb.register();
    if (registration) {
      registration.update();
    }
  }
}
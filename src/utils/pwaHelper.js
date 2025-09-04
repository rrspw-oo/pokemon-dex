// PWA helper utilities
import { Workbox } from 'workbox-window';

let wb;

// Initialize PWA
export function initializePWA() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    wb = new Workbox('/sw.js');

    // Handle service worker updates
    wb.addEventListener('waiting', (event) => {
      // Show update available message
      if (confirm('A new version is available. Update now?')) {
        wb.messageSkipWaiting();
      }
    });

    wb.addEventListener('controlling', (event) => {
      // Reload the page when new service worker takes control
      window.location.reload();
    });

    // Register the service worker
    wb.register().then((registration) => {
      console.log('SW registered:', registration);
    }).catch((registrationError) => {
      console.log('SW registration failed:', registrationError);
    });
  } else if ('serviceWorker' in navigator) {
    // Development mode - register our custom service worker
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Custom SW registered:', registration);
      })
      .catch(error => {
        console.error('Custom SW registration failed:', error);
      });
  }
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
    console.warn('Service worker not available for caching');
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
      console.log('Connection restored');
      // Trigger background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then(registration => {
          return registration.sync.register('pokemon-data-update');
        });
      }
    } else if (wasOnline && !isOnline) {
      console.log('Connection lost - working offline');
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
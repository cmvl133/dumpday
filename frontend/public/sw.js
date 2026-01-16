// Service Worker for push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'Dopaminder', {
        body: data.body || '',
        icon: '/vite.svg',
        badge: '/vite.svg',
        data: { url: data.url || '/' },
        tag: data.tag || 'reminder',
        requireInteraction: true,
      })
    );
  } catch {
    // If not JSON, try as text
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Dopaminder', {
        body: text,
        icon: '/vite.svg',
        data: { url: '/' },
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none found
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Install event - activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate event - claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

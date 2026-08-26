// Service Worker for Cross-Browser Native Notifications (Chrome, Edge, Firefox, Brave)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle Push Events
self.addEventListener('push', (event) => {
  let data = { title: 'Breaking News Alert', body: 'New article available on The Daily Wire.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message || 'Check out the latest breaking story.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || data.article_url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Live News Alert', options)
  );
});

// Handle Notification Clicks (Open Article in Browser)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

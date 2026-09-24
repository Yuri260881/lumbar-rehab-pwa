/* eslint-disable no-restricted-globals */
/// <reference lib="webworker" />
/**
 * Lumbar Rehab Dashboard — service worker.
 *
 * Strategy:
 *  - the app shell is precached from a manifest injected at build time;
 *  - navigations use a network-first, cache-fallback flow so a new version is
 *    picked up as soon as the device is online;
 *  - every other request is cache-first with a network fallback;
 *  - cross-origin requests (the source links) are never intercepted;
 *  - if the cache fails, the response is passed straight through — the worker
 *    never becomes a single point of failure.
 */

const VERSION = '__BUILD_ID__';
const CACHE = `lumbar-rehab-${VERSION}`;
const APP_ASSETS = '__APP_ASSETS__';
const BASE = new URL('./', self.location.href).pathname;
const BUILD_ASSETS = Array.isArray(APP_ASSETS) ? APP_ASSETS : [];
const basePath = (value = '') => `${BASE}${value.replace(/^\/+/, '')}`;
const PRECACHE_URLS = [
  BASE,
  basePath('index.html'),
  basePath('manifest.webmanifest'),
  basePath('icons/icon.svg'),
  basePath('icons/icon-192.png'),
  basePath('icons/icon-512.png'),
  basePath('icons/maskable-512.png'),
  basePath('icons/apple-touch-icon.png'),
  basePath('icons/badge-72.png'),
  ...BUILD_ASSETS.map(basePath),
].flat();

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Add files one by one so a single missing asset cannot break install.
      await Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never touch external links

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(CACHE);
          cache.put(basePath('index.html'), fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(basePath('index.html'));
          return cached ?? Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(CACHE);
        cache.put(request, fresh.clone());
        return fresh;
      } catch {
        return new Response('Офлайн и ресурс не кэширован', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }
    })(),
  );
});

// Show a reminder when the browser fires a periodic sync. Purely opportunistic:
// the in-app reminder list is the reliable path and does not depend on this.
self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'reminders') return;
  event.waitUntil(showPendingReminders());
});

self.addEventListener('sync', (event) => {
  if (event.tag !== 'reminders') return;
  event.waitUntil(showPendingReminders());
});

async function showPendingReminders() {
  try {
    const database = await openStore();
    if (!database) return;
    const data = await readData(database);
    const preferences = data?.preferences;
    if (!preferences) return;

    const now = new Date();
    const key = now.toISOString().slice(0, 10);
    const targets = [];

    if (preferences.reminders?.workout?.enabled) {
      targets.push({
        id: `workout-${key}`,
        title: 'Время тренировки',
        body: 'Пора выполнить сегодняшнюю программу. Остановитесь, если боль усиливается.',
        time: preferences.reminders.workout.time,
      });
    }
    if (
      preferences.reminders?.inversion?.enabled &&
      preferences.inversionDoctorApproved &&
      preferences.inversionAnchorDate
    ) {
      const step = Math.max(1, preferences.reminders.inversion.everyNDays || 2);
      const diff = Math.round(
        (Date.parse(`${key}T00:00:00`) -
          Date.parse(`${preferences.inversionAnchorDate}T00:00:00`)) /
          86400000,
      );
      if (diff >= 0 && diff % step === 0) {
        targets.push({
          id: `inversion-${key}`,
          title: 'Инверсионный стол: день сеанса',
          body: 'Сегодня день сеанса по вашей схеме. Пройдите чек-лист безопасности.',
          time: preferences.reminders.inversion.time,
        });
      }
    }

    for (const target of targets) {
      if (target.time && now.toTimeString().slice(0, 5) < target.time) continue;
      await self.registration.showNotification(target.title, {
        body: target.body,
        tag: target.id,
        lang: 'ru',
        icon: basePath('icons/icon-192.png'),
      });
    }
  } catch {
    /* never fail the sync because of a reminder */
  }
}

function openStore() {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') return resolve(null);
    const request = indexedDB.open('lumbar-rehab', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

function readData(database) {
  return new Promise((resolve) => {
    try {
      const transaction = database.transaction('kv', 'readonly');
      const request = transaction.objectStore('kv').get('app-data');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(BASE);
      return undefined;
    })(),
  );
});

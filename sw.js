// DailyTap Service Worker
const CACHE_NAME = 'dailytap-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/index.css',
    '/app.js',
    '/db.js',
    '/sync.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip external requests (like Google fonts)
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then((cached) => {
                if (cached) {
                    // Return cached, but also update cache in background
                    fetch(event.request)
                        .then((response) => {
                            if (response.ok) {
                                caches.open(CACHE_NAME)
                                    .then((cache) => cache.put(event.request, response));
                            }
                        })
                        .catch(() => {});
                    return cached;
                }
                
                // Not in cache, fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Cache successful responses
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseClone));
                        }
                        return response;
                    });
            })
    );
});

// Background Sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-logs') {
        event.waitUntil(syncLogs());
    }
});

// Sync logs to Google Sheets
async function syncLogs() {
    try {
        // Open IndexedDB
        const db = await openDB();
        const tx = db.transaction(['logs', 'metadata'], 'readonly');
        const logsStore = tx.objectStore('logs');
        const metaStore = tx.objectStore('metadata');
        
        // Get unsynced logs
        const logs = await getAllFromStore(logsStore);
        const unsyncedLogs = logs.filter(log => !log.synced);
        
        if (unsyncedLogs.length === 0) {
            return { success: true, message: 'Nothing to sync' };
        }
        
        // Get script URL
        const scriptUrl = await getFromStore(metaStore, 'script_url');
        const sheetLink = await getFromStore(metaStore, 'sheet_link');
        
        if (!scriptUrl || !sheetLink) {
            return { success: false, message: 'Missing configuration' };
        }
        
        // Group logs by date
        const logsByDate = {};
        unsyncedLogs.forEach(log => {
            if (!logsByDate[log.date]) {
                logsByDate[log.date] = {};
            }
            logsByDate[log.date][log.eventName] = log.time;
        });
        
        // Get event structure
        const eventsStore = db.transaction('events', 'readonly').objectStore('events');
        const events = await getAllFromStore(eventsStore);
        const structure = events.sort((a, b) => a.order - b.order).map(e => e.name);
        
        // Send each date's logs
        for (const [date, eventTimes] of Object.entries(logsByDate)) {
            const payload = {
                sheet: sheetLink,
                date: date,
                events: eventTimes,
                structure: structure
            };
            
            await fetch(scriptUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }
        
        // Mark logs as synced
        const writeTx = db.transaction('logs', 'readwrite');
        const writeStore = writeTx.objectStore('logs');
        
        for (const log of unsyncedLogs) {
            log.synced = true;
            writeStore.put(log);
        }
        
        await writeTx.done;
        
        // Notify clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'SYNC_COMPLETE' });
        });
        
        return { success: true };
    } catch (error) {
        console.error('Sync failed:', error);
        throw error;
    }
}

// IndexedDB helpers for service worker
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('DailyTapDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAllFromStore(store) {
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getFromStore(store, key) {
    return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result?.value);
        request.onerror = () => reject(request.error);
    });
}

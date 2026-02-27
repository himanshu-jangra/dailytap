// DailyTap Database Layer (IndexedDB)

const DB_NAME = 'DailyTapDB';
const DB_VERSION = 1;

let db = null;

// Initialize the database
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);

        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // Events store
            if (!database.objectStoreNames.contains('events')) {
                const eventsStore = database.createObjectStore('events', { keyPath: 'id' });
                eventsStore.createIndex('order', 'order', { unique: false });
            }

            // Logs store
            if (!database.objectStoreNames.contains('logs')) {
                const logsStore = database.createObjectStore('logs', { keyPath: 'id' });
                logsStore.createIndex('date', 'date', { unique: false });
                logsStore.createIndex('synced', 'synced', { unique: false });
            }

            // Metadata store (key-value)
            if (!database.objectStoreNames.contains('metadata')) {
                database.createObjectStore('metadata', { keyPath: 'key' });
            }
        };
    });
}

// Get database instance
function getDB() {
    if (!db) {
        throw new Error('Database not initialized. Call initDB() first.');
    }
    return db;
}

// ========================================
// Events CRUD
// ========================================

async function getAllEvents() {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('events', 'readonly');
        const store = tx.objectStore('events');
        const request = store.getAll();

        request.onsuccess = () => {
            const events = request.result;
            events.sort((a, b) => a.order - b.order);
            resolve(events);
        };
        request.onerror = () => reject(request.error);
    });
}

async function saveEvent(event) {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('events', 'readwrite');
        const store = tx.objectStore('events');
        const request = store.put(event);

        request.onsuccess = () => resolve(event);
        request.onerror = () => reject(request.error);
    });
}

async function deleteEvent(id) {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('events', 'readwrite');
        const store = tx.objectStore('events');
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function saveAllEvents(events) {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('events', 'readwrite');
        const store = tx.objectStore('events');

        // Clear existing
        store.clear();

        // Add all events
        events.forEach((event, index) => {
            event.order = index;
            store.put(event);
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ========================================
// Logs CRUD
// ========================================

async function getLogsForDate(date) {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('logs', 'readonly');
        const store = tx.objectStore('logs');
        const index = store.index('date');
        const request = index.getAll(date);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function saveLog(log) {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('logs', 'readwrite');
        const store = tx.objectStore('logs');
        const request = store.put(log);

        request.onsuccess = () => resolve(log);
        request.onerror = () => reject(request.error);
    });
}

async function getUnsyncedLogs() {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('logs', 'readonly');
        const store = tx.objectStore('logs');
        const request = store.getAll();

        request.onsuccess = () => {
            const logs = request.result.filter(log => !log.synced);
            resolve(logs);
        };
        request.onerror = () => reject(request.error);
    });
}

async function markLogsSynced(logIds) {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('logs', 'readwrite');
        const store = tx.objectStore('logs');

        logIds.forEach(id => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const log = getRequest.result;
                if (log) {
                    log.synced = true;
                    store.put(log);
                }
            };
        });

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function clearLogsForDate(date) {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('logs', 'readwrite');
        const store = tx.objectStore('logs');
        const index = store.index('date');
        const request = index.openCursor(date);

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                store.delete(cursor.primaryKey);
                cursor.continue();
            }
        };

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ========================================
// Metadata CRUD
// ========================================

async function getMeta(key) {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('metadata', 'readonly');
        const store = tx.objectStore('metadata');
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result?.value);
        request.onerror = () => reject(request.error);
    });
}

async function setMeta(key, value) {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('metadata', 'readwrite');
        const store = tx.objectStore('metadata');
        const request = store.put({ key, value });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

async function getAllMeta() {
    const database = getDB();
    return new Promise((resolve, reject) => {
        const tx = database.transaction('metadata', 'readonly');
        const store = tx.objectStore('metadata');
        const request = store.getAll();

        request.onsuccess = () => {
            const result = {};
            request.result.forEach(item => {
                result[item.key] = item.value;
            });
            resolve(result);
        };
        request.onerror = () => reject(request.error);
    });
}

// ========================================
// Utility Functions
// ========================================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getToday() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // yyyy-mm-dd
}

function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // HH:mm
}

function generateEventHash(events) {
    const names = events.map(e => e.name).sort().join('|');
    let hash = 0;
    for (let i = 0; i < names.length; i++) {
        const char = names.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

// Check if setup is complete
async function isSetupComplete() {
    const scriptUrl = await getMeta('script_url');
    const sheetLink = await getMeta('sheet_link');
    const events = await getAllEvents();

    return !!(scriptUrl && sheetLink && events.length > 0);
}

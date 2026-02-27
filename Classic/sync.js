// DailyTap Sync Service

// Sync status
let syncStatus = 'idle'; // 'idle', 'syncing', 'synced', 'offline', 'error'

// Register for background sync
async function registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.sync.register('sync-logs');
            console.log('Background sync registered');
        } catch (error) {
            console.log('Background sync not supported, using fallback');
            // Fallback to manual sync
            await syncNow();
        }
    } else {
        // Fallback for browsers without background sync
        await syncNow();
    }
}

// Manual sync function
async function syncNow() {
    if (syncStatus === 'syncing') return;

    try {
        updateSyncStatus('syncing');

        // Get configuration
        const scriptUrl = await getMeta('script_url');
        const sheetLink = await getMeta('sheet_link');

        if (!scriptUrl || !sheetLink) {
            updateSyncStatus('idle');
            return { success: false, message: 'Not configured' };
        }

        // Get unsynced logs
        const unsyncedLogs = await getUnsyncedLogs();

        if (unsyncedLogs.length === 0) {
            updateSyncStatus('synced');
            return { success: true, message: 'Nothing to sync' };
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
        const events = await getAllEvents();
        const structure = events.map(e => e.name);

        // Send each date's logs
        for (const [date, eventTimes] of Object.entries(logsByDate)) {
            const payload = {
                sheet: sheetLink,
                date: date,
                events: eventTimes,
                structure: structure
            };

            try {
                await fetch(scriptUrl, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (fetchError) {
                console.error('Fetch error:', fetchError);
                throw fetchError;
            }
        }

        // Mark all as synced
        const logIds = unsyncedLogs.map(log => log.id);
        await markLogsSynced(logIds);

        updateSyncStatus('synced');
        showToast('All synced! ✨', 'success');

        return { success: true };
    } catch (error) {
        console.error('Sync error:', error);

        if (!navigator.onLine) {
            updateSyncStatus('offline');
        } else {
            updateSyncStatus('error');
        }

        return { success: false, error };
    }
}

// Update sync status display
function updateSyncStatus(status) {
    syncStatus = status;

    const statusEl = document.getElementById('sync-status');
    if (!statusEl) return;

    const iconEl = statusEl.querySelector('.sync-icon');
    const textEl = statusEl.querySelector('.sync-text');

    statusEl.className = 'sync-status ' + status;

    switch (status) {
        case 'syncing':
            iconEl.textContent = '↻';
            textEl.textContent = 'Syncing...';
            break;
        case 'synced':
            iconEl.textContent = '✓';
            textEl.textContent = 'Synced';
            break;
        case 'offline':
            iconEl.textContent = '○';
            textEl.textContent = 'Offline';
            break;
        case 'error':
            iconEl.textContent = '!';
            textEl.textContent = 'Sync failed';
            break;
        default:
            iconEl.textContent = '○';
            textEl.textContent = 'Ready';
    }
}

// Test connection to Google Apps Script
async function testConnection(scriptUrl, sheetLink) {
    try {
        const testPayload = {
            sheet: sheetLink,
            date: getToday(),
            events: {},
            structure: [],
            test: true
        };

        const response = await fetch(scriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        // With no-cors, we can't read the response
        // So we assume success if no error thrown
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Listen for online/offline events
window.addEventListener('online', () => {
    updateSyncStatus('idle');
    syncNow();
});

window.addEventListener('offline', () => {
    updateSyncStatus('offline');
});

// Listen for sync complete from service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_COMPLETE') {
            updateSyncStatus('synced');
            showToast('Synced like magic ✨', 'success');
        }
    });
}

// Initial status check
function initSyncStatus() {
    if (!navigator.onLine) {
        updateSyncStatus('offline');
    } else {
        updateSyncStatus('idle');
    }
}

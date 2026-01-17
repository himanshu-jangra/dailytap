// DailyTap Main Application

// ========================================
// App State
// ========================================

let currentEventIndex = 0;
let events = [];
let todayLogs = [];
let editingEventId = null;
let selectedIcon = '☀️';

// Available icons for events
const AVAILABLE_ICONS = [
    '☀️', '🌙', '🏠', '🏢', '🚗', '🚶',
    '🚌', '🚇', '💼', '📱', '💻', '📧',
    '☕', '🍽️', '🏃', '🧘', '📚', '✍️',
    '🎯', '✅', '🛏️', '🚿', '👔', '🎒',
    '🎮', '📺', '🎵', '💊', '🏋️', '🌃'
];

// Quirky toast messages
const TAP_MESSAGES = [
    "Boom! Logged 😄",
    "Done & dusted ✨",
    "Nailed it! 🎯",
    "You're on fire! 🔥",
    "Quick tap! ⚡",
    "Logged like a pro 💪"
];

const SKIP_MESSAGES = [
    "Event skipped. Moving on 🚀",
    "Skipped! Next up ➡️",
    "No worries, skipped! 👍"
];

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
        await loadApp();
        setupEventListeners();
        initSyncStatus();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Error loading app', 'error');
    }
});

async function loadApp() {
    const setupComplete = await isSetupComplete();

    if (setupComplete) {
        await showMainScreen();
    } else {
        showSetupScreen();
    }
}

// ========================================
// Screen Navigation
// ========================================

function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
}

function showSetupScreen() {
    hideAllScreens();
    document.getElementById('setup-screen').classList.remove('hidden');
    loadSetupEvents();
}

async function showMainScreen() {
    hideAllScreens();
    document.getElementById('main-screen').classList.remove('hidden');

    await checkDateChange();
    await loadEvents();
    await loadTodayLogs();
    await loadCurrentEventIndex();

    renderMainScreen();
    updateDateDisplay();
}

function showSettingsScreen() {
    hideAllScreens();
    document.getElementById('settings-screen').classList.remove('hidden');
    loadSettingsData();
}

// ========================================
// Setup Screen
// ========================================

let setupEvents = [];

function loadSetupEvents() {
    setupEvents = [];
    renderSetupEvents();
}

function renderSetupEvents() {
    const list = document.getElementById('events-list');
    list.innerHTML = '';

    setupEvents.forEach((event, index) => {
        list.appendChild(createEventItem(event, index, 'setup'));
    });

    updateSaveSetupButton();
}

function createEventItem(event, index, context) {
    const item = document.createElement('div');
    item.className = 'event-item';
    item.draggable = true;
    item.dataset.index = index;

    item.innerHTML = `
        <div class="drag-handle">
            <span></span>
            <span></span>
            <span></span>
        </div>
        <div class="event-item-icon">${event.icon}</div>
        <div class="event-item-name">${event.name}</div>
        <div class="event-item-actions">
            <button class="event-item-btn edit-event-btn" data-id="${event.id}" aria-label="Edit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="event-item-btn delete-event-btn" data-id="${event.id}" aria-label="Delete">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        </div>
    `;

    // Drag and drop handlers
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', (e) => handleDrop(e, context));
    item.addEventListener('dragend', handleDragEnd);

    return item;
}

function updateSaveSetupButton() {
    const btn = document.getElementById('save-setup-btn');
    const sheetLink = document.getElementById('sheet-link').value.trim();
    const scriptUrl = document.getElementById('script-url').value.trim();

    btn.disabled = !(sheetLink && scriptUrl && setupEvents.length > 0);
}

// ========================================
// Drag and Drop
// ========================================

let draggedIndex = null;

function handleDragStart(e) {
    draggedIndex = parseInt(e.target.dataset.index);
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const item = e.target.closest('.event-item');
    if (item) {
        item.classList.add('drag-over');
    }
}

function handleDrop(e, context) {
    e.preventDefault();
    const item = e.target.closest('.event-item');
    if (!item) return;

    const dropIndex = parseInt(item.dataset.index);
    item.classList.remove('drag-over');

    if (draggedIndex !== null && draggedIndex !== dropIndex) {
        const eventsList = context === 'setup' ? setupEvents : events;
        const [moved] = eventsList.splice(draggedIndex, 1);
        eventsList.splice(dropIndex, 0, moved);

        if (context === 'setup') {
            renderSetupEvents();
        } else {
            renderSettingsEvents();
        }
    }
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.event-item').forEach(item => {
        item.classList.remove('drag-over');
    });
    draggedIndex = null;
}

// ========================================
// Main Screen Logic
// ========================================

async function loadEvents() {
    events = await getAllEvents();
}

async function loadTodayLogs() {
    const today = getToday();
    todayLogs = await getLogsForDate(today);
}

async function loadCurrentEventIndex() {
    const lastDate = await getMeta('last_logged_date');
    const today = getToday();

    if (lastDate !== today) {
        currentEventIndex = 0;
        await setMeta('last_event_index', 0);
        await setMeta('last_logged_date', today);
    } else {
        currentEventIndex = (await getMeta('last_event_index')) || 0;
    }
}

async function checkDateChange() {
    const lastDate = await getMeta('last_logged_date');
    const today = getToday();

    if (lastDate && lastDate !== today) {
        // New day - reset
        currentEventIndex = 0;
        await setMeta('last_event_index', 0);
        await setMeta('last_logged_date', today);
        todayLogs = [];
    }
}

function renderMainScreen() {
    updateProgress();
    renderEventHistory();
    renderCurrentEvent();
}

function updateProgress() {
    const total = events.length;
    const logged = todayLogs.length;
    const percentage = total > 0 ? (logged / total) * 100 : 0;

    document.getElementById('progress-fill').style.width = `${percentage}%`;
    document.getElementById('progress-text').textContent = `${logged} of ${total} events`;
}

function renderEventHistory() {
    const container = document.getElementById('event-history');
    container.innerHTML = '';

    // Sort logs by event order
    const loggedEvents = todayLogs.map(log => {
        const event = events.find(e => e.name === log.eventName);
        return { ...log, event };
    }).sort((a, b) => {
        const orderA = a.event ? a.event.order : 999;
        const orderB = b.event ? b.event.order : 999;
        return orderA - orderB;
    });

    loggedEvents.forEach(log => {
        const item = document.createElement('div');
        item.className = `history-item ${log.status === 'skipped' ? 'skipped' : ''}`;
        item.innerHTML = `
            <div class="history-item-icon">${log.event?.icon || '📋'}</div>
            <div class="history-item-content">
                <div class="history-item-name">${log.eventName}</div>
                <div class="history-item-time">${log.status === 'skipped' ? 'Skipped' : log.time}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderCurrentEvent() {
    const allDone = document.getElementById('all-done');
    const mainBtn = document.getElementById('main-tap-btn');
    const skipBtn = document.getElementById('skip-btn');
    const editBtn = document.getElementById('edit-btn');

    if (currentEventIndex >= events.length) {
        // All events logged
        allDone.classList.remove('hidden');
        mainBtn.style.display = 'none';
        skipBtn.style.display = 'none';
        editBtn.style.display = 'flex';
    } else {
        allDone.classList.add('hidden');
        mainBtn.style.display = 'flex';
        skipBtn.style.display = 'flex';
        editBtn.style.display = 'flex';

        const currentEvent = events[currentEventIndex];
        document.getElementById('current-event-icon').textContent = currentEvent.icon;
        document.getElementById('current-event-name').textContent = currentEvent.name;
    }
}

function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

// ========================================
// Event Logging
// ========================================

async function logCurrentEvent() {
    if (currentEventIndex >= events.length) return;

    const currentEvent = events[currentEventIndex];
    const time = getCurrentTime();

    const log = {
        id: generateId(),
        date: getToday(),
        eventName: currentEvent.name,
        time: time,
        status: 'normal',
        synced: false
    };

    await saveLog(log);
    todayLogs.push(log);

    currentEventIndex++;
    await setMeta('last_event_index', currentEventIndex);

    // Haptic feedback
    triggerHaptic();

    // Random quirky toast
    const message = TAP_MESSAGES[Math.floor(Math.random() * TAP_MESSAGES.length)];
    showToast(message);

    // Create ripple effect
    createRipple(document.getElementById('main-tap-btn'));

    // Update UI
    renderMainScreen();

    // Try to sync
    registerBackgroundSync();
}

async function skipCurrentEvent() {
    if (currentEventIndex >= events.length) return;

    const currentEvent = events[currentEventIndex];

    const log = {
        id: generateId(),
        date: getToday(),
        eventName: currentEvent.name,
        time: 'SKIPPED',
        status: 'skipped',
        synced: false
    };

    await saveLog(log);
    todayLogs.push(log);

    currentEventIndex++;
    await setMeta('last_event_index', currentEventIndex);

    // Random skip message
    const message = SKIP_MESSAGES[Math.floor(Math.random() * SKIP_MESSAGES.length)];
    showToast(message);

    // Update UI
    renderMainScreen();

    // Close modal
    closeModal('skip-modal');

    // Try to sync
    registerBackgroundSync();
}

// ========================================
// Edit Event Modal
// ========================================

function openEditModal() {
    const select = document.getElementById('edit-event-select');
    select.innerHTML = '';

    events.forEach(event => {
        const option = document.createElement('option');
        option.value = event.name;
        option.textContent = `${event.icon} ${event.name}`;
        select.appendChild(option);
    });

    document.getElementById('edit-time-input').value = getCurrentTime();
    openModal('edit-modal');
}

async function saveEditedEvent() {
    const eventName = document.getElementById('edit-event-select').value;
    const time = document.getElementById('edit-time-input').value;

    if (!eventName || !time) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    // Check if already logged today
    const existingLog = todayLogs.find(log => log.eventName === eventName);

    if (existingLog) {
        // Update existing
        existingLog.time = time;
        existingLog.status = 'normal';
        existingLog.synced = false;
        await saveLog(existingLog);
    } else {
        // Create new
        const log = {
            id: generateId(),
            date: getToday(),
            eventName: eventName,
            time: time,
            status: 'normal',
            synced: false
        };
        await saveLog(log);
        todayLogs.push(log);

        // Update event index if this was the current or a past event
        const eventIndex = events.findIndex(e => e.name === eventName);
        if (eventIndex >= currentEventIndex) {
            // We might need to update currentEventIndex
            // For simplicity, we'll recalculate based on logged events
            await recalculateEventIndex();
        }
    }

    closeModal('edit-modal');
    showToast('Event time saved ✓');
    renderMainScreen();
    registerBackgroundSync();
}

async function recalculateEventIndex() {
    // Find the next unlogged event
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const logged = todayLogs.find(log => log.eventName === event.name);
        if (!logged) {
            currentEventIndex = i;
            await setMeta('last_event_index', currentEventIndex);
            return;
        }
    }
    // All logged
    currentEventIndex = events.length;
    await setMeta('last_event_index', currentEventIndex);
}

// ========================================
// Skip Modal
// ========================================

function openSkipModal() {
    if (currentEventIndex >= events.length) return;

    const currentEvent = events[currentEventIndex];
    document.getElementById('skip-event-name').textContent = currentEvent.name;
    openModal('skip-modal');
}

// ========================================
// Add/Edit Event Modal
// ========================================

function openAddEventModal(context = 'setup') {
    editingEventId = null;
    selectedIcon = AVAILABLE_ICONS[0];

    document.getElementById('event-modal-title').textContent = 'Add Event';
    document.getElementById('event-name-input').value = '';
    document.getElementById('event-save-btn').textContent = 'Add Event';
    document.getElementById('event-delete-btn').style.display = 'none';

    renderIconPicker();
    openModal('event-modal');

    // Store context for save
    document.getElementById('event-modal').dataset.context = context;
}

function openEditEventModal(eventId, context = 'setup') {
    const eventsList = context === 'setup' ? setupEvents : events;
    const event = eventsList.find(e => e.id === eventId);

    if (!event) return;

    editingEventId = eventId;
    selectedIcon = event.icon;

    document.getElementById('event-modal-title').textContent = 'Edit Event';
    document.getElementById('event-name-input').value = event.name;
    document.getElementById('event-save-btn').textContent = 'Save Changes';
    document.getElementById('event-delete-btn').style.display = 'block';

    renderIconPicker();
    openModal('event-modal');

    document.getElementById('event-modal').dataset.context = context;
}

function renderIconPicker() {
    const picker = document.getElementById('icon-picker');
    picker.innerHTML = '';

    AVAILABLE_ICONS.forEach(icon => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `icon-option ${icon === selectedIcon ? 'selected' : ''}`;
        btn.textContent = icon;
        btn.addEventListener('click', () => {
            selectedIcon = icon;
            picker.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
        picker.appendChild(btn);
    });
}

function saveEventFromModal() {
    const name = document.getElementById('event-name-input').value.trim();
    const context = document.getElementById('event-modal').dataset.context || 'setup';

    if (!name) {
        showToast('Please enter event name', 'error');
        return;
    }

    const eventsList = context === 'setup' ? setupEvents : events;

    if (editingEventId) {
        // Edit existing
        const event = eventsList.find(e => e.id === editingEventId);
        if (event) {
            event.name = name;
            event.icon = selectedIcon;
        }
    } else {
        // Add new
        eventsList.push({
            id: generateId(),
            name: name,
            icon: selectedIcon,
            order: eventsList.length
        });
    }

    closeModal('event-modal');

    if (context === 'setup') {
        renderSetupEvents();
    } else {
        renderSettingsEvents();
    }
}

function deleteEventFromModal() {
    const context = document.getElementById('event-modal').dataset.context || 'setup';
    const eventsList = context === 'setup' ? setupEvents : events;

    if (editingEventId) {
        const index = eventsList.findIndex(e => e.id === editingEventId);
        if (index > -1) {
            eventsList.splice(index, 1);
        }
    }

    closeModal('event-modal');

    if (context === 'setup') {
        renderSetupEvents();
    } else {
        renderSettingsEvents();
    }
}

// ========================================
// Settings Screen
// ========================================

async function loadSettingsData() {
    const sheetLink = await getMeta('sheet_link') || '';
    const scriptUrl = await getMeta('script_url') || '';

    document.getElementById('settings-sheet-link').value = sheetLink;
    document.getElementById('settings-script-url').value = scriptUrl;

    events = await getAllEvents();
    renderSettingsEvents();
}

function renderSettingsEvents() {
    const list = document.getElementById('settings-events-list');
    list.innerHTML = '';

    events.forEach((event, index) => {
        list.appendChild(createEventItem(event, index, 'settings'));
    });
}

async function saveSettings() {
    const sheetLink = document.getElementById('settings-sheet-link').value.trim();
    const scriptUrl = document.getElementById('settings-script-url').value.trim();

    // Check if event structure changed
    const oldHash = await getMeta('event_structure_hash');
    const newHash = generateEventHash(events);

    // Update order
    events.forEach((event, index) => {
        event.order = index;
    });

    await setMeta('sheet_link', sheetLink);
    await setMeta('script_url', scriptUrl);
    await saveAllEvents(events);
    await setMeta('event_structure_hash', newHash);

    if (oldHash && oldHash !== newHash) {
        showToast('Events changed! A new sheet tab will be created.', 'warning');
    } else {
        showToast('Settings saved ✓');
    }

    showMainScreen();
}

async function resetTodayProgress() {
    if (!confirm('This will reset all of today\'s logged events. Are you sure?')) {
        return;
    }

    const today = getToday();
    await clearLogsForDate(today);

    currentEventIndex = 0;
    await setMeta('last_event_index', 0);
    todayLogs = [];

    showToast('Today\'s progress reset');
    showMainScreen();
}

// ========================================
// Setup Save
// ========================================

async function saveSetup() {
    const sheetLink = document.getElementById('sheet-link').value.trim();
    const scriptUrl = document.getElementById('script-url').value.trim();

    if (!sheetLink || !scriptUrl || setupEvents.length === 0) {
        showToast('Please complete all fields', 'error');
        return;
    }

    // Save configuration
    await setMeta('sheet_link', sheetLink);
    await setMeta('script_url', scriptUrl);

    // Update event order and save
    setupEvents.forEach((event, index) => {
        event.order = index;
    });
    await saveAllEvents(setupEvents);

    // Save structure hash
    const hash = generateEventHash(setupEvents);
    await setMeta('event_structure_hash', hash);

    // Initialize today
    await setMeta('last_logged_date', getToday());
    await setMeta('last_event_index', 0);

    showToast('Setup complete! 🎉', 'success');
    showMainScreen();
}

// ========================================
// Connection Test
// ========================================

async function testSetupConnection() {
    const sheetLink = document.getElementById('sheet-link').value.trim();
    const scriptUrl = document.getElementById('script-url').value.trim();

    await runConnectionTest(sheetLink, scriptUrl, 'connection-status');
}

async function testSettingsConnection() {
    const sheetLink = document.getElementById('settings-sheet-link').value.trim();
    const scriptUrl = document.getElementById('settings-script-url').value.trim();

    await runConnectionTest(sheetLink, scriptUrl, 'settings-connection-status');
}

async function runConnectionTest(sheetLink, scriptUrl, statusId) {
    const statusEl = document.getElementById(statusId);

    if (!sheetLink || !scriptUrl) {
        statusEl.className = 'connection-status error';
        statusEl.textContent = '⚠ Please enter both URLs';
        statusEl.classList.remove('hidden');
        return;
    }

    statusEl.className = 'connection-status loading';
    statusEl.textContent = '⏳ Testing connection...';
    statusEl.classList.remove('hidden');

    const result = await testConnection(scriptUrl, sheetLink);

    if (result.success) {
        statusEl.className = 'connection-status success';
        statusEl.textContent = '✓ Connection successful!';
    } else {
        statusEl.className = 'connection-status error';
        statusEl.textContent = `✗ Connection failed: ${result.error || 'Unknown error'}`;
    }

    updateSaveSetupButton();
}

// ========================================
// Modal Helpers
// ========================================

function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
}

// ========================================
// Toast Notifications
// ========================================

function showToast(message, type = 'default') {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ========================================
// Haptic Feedback
// ========================================

function triggerHaptic() {
    if ('vibrate' in navigator) {
        navigator.vibrate(50);
    }
}

// ========================================
// Ripple Effect
// ========================================

function createRipple(button) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.transform = 'translate(-50%, -50%)';

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

// ========================================
// Instructions
// ========================================

function showInstructions() {
    // Populate the script code
    document.getElementById('script-code').textContent = APPS_SCRIPT_CODE;
    openModal('instructions-modal');
}

function copyScriptCode() {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE).then(() => {
        showToast('Code copied!');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// ========================================
// Event Listeners Setup
// ========================================

function setupEventListeners() {
    // Setup screen
    document.getElementById('test-connection-btn').addEventListener('click', testSetupConnection);
    document.getElementById('add-event-btn').addEventListener('click', () => openAddEventModal('setup'));
    document.getElementById('save-setup-btn').addEventListener('click', saveSetup);
    document.getElementById('setup-help-btn').addEventListener('click', showInstructions);
    document.getElementById('sheet-link').addEventListener('input', updateSaveSetupButton);
    document.getElementById('script-url').addEventListener('input', updateSaveSetupButton);

    // Main screen
    document.getElementById('main-tap-btn').addEventListener('click', logCurrentEvent);
    document.getElementById('skip-btn').addEventListener('click', openSkipModal);
    document.getElementById('edit-btn').addEventListener('click', openEditModal);
    document.getElementById('settings-btn').addEventListener('click', showSettingsScreen);

    // Settings screen
    document.getElementById('back-btn').addEventListener('click', showMainScreen);
    document.getElementById('settings-test-btn').addEventListener('click', testSettingsConnection);
    document.getElementById('settings-add-event-btn').addEventListener('click', () => openAddEventModal('settings'));
    document.getElementById('view-instructions-btn').addEventListener('click', showInstructions);
    document.getElementById('force-sync-btn').addEventListener('click', syncNow);
    document.getElementById('clear-today-btn').addEventListener('click', resetTodayProgress);
    document.getElementById('save-settings-btn').addEventListener('click', saveSettings);

    // Edit modal
    document.getElementById('edit-save-btn').addEventListener('click', saveEditedEvent);

    // Skip modal
    document.getElementById('skip-confirm-btn').addEventListener('click', skipCurrentEvent);

    // Event modal
    document.getElementById('event-save-btn').addEventListener('click', saveEventFromModal);
    document.getElementById('event-delete-btn').addEventListener('click', deleteEventFromModal);

    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.add('hidden');
        });
    });

    // Backdrop click to close
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.classList.add('hidden');
        });
    });

    // Copy code button
    document.querySelectorAll('.copy-code-btn').forEach(btn => {
        btn.addEventListener('click', copyScriptCode);
    });

    // Event delegation for dynamic event items
    document.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.edit-event-btn');
        const deleteBtn = e.target.closest('.delete-event-btn');

        if (editBtn) {
            const id = editBtn.dataset.id;
            const context = editBtn.closest('#events-list') ? 'setup' : 'settings';
            openEditEventModal(id, context);
        }
    });
}

// ========================================
// Google Apps Script Code Template
// ========================================

const APPS_SCRIPT_CODE = `function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    // Test request
    if (data.test) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const sheetUrl = data.sheet;
    const date = data.date;
    const events = data.events;
    const structure = data.structure;
    
    const ss = SpreadsheetApp.openByUrl(sheetUrl);
    
    // Get or create sheet tab
    let sheet = getOrCreateSheet(ss, structure);
    
    // Find or create row for date
    const row = findOrCreateRow(sheet, date, structure);
    
    // Update event times
    for (const [eventName, time] of Object.entries(events)) {
      const colIndex = structure.indexOf(eventName) + 2; // +1 for Date col, +1 for 1-index
      if (colIndex > 1) {
        sheet.getRange(row, colIndex).setValue(time);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: error.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(ss, structure) {
  const structureKey = structure.join('|');
  const sheets = ss.getSheets();
  
  // Check existing sheets for matching structure
  for (const sheet of sheets) {
    const headers = sheet.getRange(1, 1, 1, structure.length + 1).getValues()[0];
    const sheetStructure = headers.slice(1).join('|');
    if (sheetStructure === structureKey) {
      return sheet;
    }
  }
  
  // Create new sheet
  const newSheet = ss.insertSheet('DailyTap_' + new Date().getTime());
  const headers = ['Date', ...structure];
  newSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  newSheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  
  return newSheet;
}

function findOrCreateRow(sheet, date, structure) {
  const dateCol = sheet.getRange('A:A').getValues();
  
  for (let i = 1; i < dateCol.length; i++) {
    const cellDate = dateCol[i][0];
    if (cellDate instanceof Date) {
      const formatted = Utilities.formatDate(cellDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      if (formatted === date) {
        return i + 1;
      }
    } else if (cellDate === date) {
      return i + 1;
    }
  }
  
  // Create new row
  const newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1).setValue(date);
  return newRow;
}

function doGet(e) {
  return ContentService.createTextOutput('DailyTap API is running');
}`;

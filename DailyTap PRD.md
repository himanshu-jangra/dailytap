# **DailyTap — Personal Event Logging Web App**

----------

# **1. Product Overview**

**DailyTap** is a minimalist, mobile-first, offline-first web application that helps users log their daily personal events (e.g., Wake Up, Leave Home, Reach Office, etc.) with a single button tap.  
The system stores data locally and syncs to a user-linked **Google Sheet** through a **Google Apps Script** endpoint whenever online.

The app is designed for simplicity, strong UX ergonomics, and reliability when used daily.

----------

# **2. Problem Statement**

Traditional time-tracking tools are cluttered and often require manual typing. Users want a frictionless, “tap-and-go” solution that works offline, syncs reliably, and keeps data in their control.

DailyTap solves this by:

-   Offering a single, context-aware button for the current event.
-   Saving data locally first (IndexedDB).
-   Syncing to Google Sheets automatically.
-   Providing manual edit and skip options.
-   Supporting a user-defined event list and order.

----------

# **3. Target User**

### **Primary Persona: Busy Individual with Routine Events**

-   Needs fast, minimal input.
-   Uses mobile throughout the day.
-   Prefers offline-first reliability.
-   Wants personal log data synced to Sheets.

----------

# **4. Goals & Success Metrics**

### **Product Goals**

-   Allow user to log event timestamps with a single action.
-   Maintain daily logs reliably even without internet.
-   Maintain clean, usable sheet data with one row per day.
-   Provide sustainable personal-use logging without cloud accounts.

### **Success Metrics**

-   < 150ms tap-to-store time.
-   Successful offline queue > 99%.
-   Zero data loss across 30 days of use.
-   Setup completion rate > 90%.
-   PWA install usage from home screen > 70%.

----------

# **5. Features**

----------

## **5.1 Single Large Event Button**

-   Material You (Material 3) expressive button.
-   One button representing the _current_ event.
-   Button text = event name.
-   Button updates sequentially after each tap.
-   Button placed in **thumb reach zone** (lower-middle-left).
-   Uses color theme:
    -   Background: **#18191C**
    -   Foreground: **#FFFFFF**

### Tap Feedback

-   Mobile haptic vibration.
-   Quirky snackbar/toast such as:
    -   “Boom! Logged 😄”
    -   “Done & dusted ✨”

----------

## **5.2 Skip Event Option (New)**

-   A small **skip icon (⤼)** placed next to the Edit icon.
-   Confirmation dialog:  
    **“Skip this event for today?”**
-   On confirmation:
    -   Create a log entry:  
        `time: "SKIPPED"`, `status: "skipped"`
    -   Move to next event in sequence.
    -   Show quirky toast:  
        **“Event skipped. Moving on 🚀”**

----------

## **5.3 Manual Edit Option**

-   Small icon (✏️) next to main button.
-   Opens modal:
    -   Select event
    -   Time picker
-   Stores time for chosen event.
-   Only one event edited at a time.

----------

## **5.4 User-Defined Events**

-   User can:
    -   Add any number of events
    -   Name events
    -   Choose small icon
    -   Drag to reorder the sequence
-   Sequence is strictly based on user-defined order.
-   If event list changes:
    -   System creates **new Google Sheet TAB** automatically.

----------

## **5.5 Daily Logic: One Row Per Day**

### New row is created when:

1.  **Midnight reset (12:00–12:01 AM).**
2.  **User opens app after midnight.**
3.  **User manually edits a time belonging to the next day.**
4.  **Event list (structure) is changed → new sheet tab + new row.**

### What each row contains:

Date

Event 1

Event 2

Event 3

…

yyyy-mm-dd

time/“SKIPPED”/blank

...

...

...

If user doesn't tap/skip/edit an event → cell is blank.

----------

## **5.6 Offline-first Storage (IndexedDB)**

-   All logs stored first in IndexedDB.
-   Works fully offline.
-   Queue is synced when internet returns.
-   No data loss even if app is killed.

----------

## **5.7 Background Sync**

-   Service Worker registers a `"sync-logs"` task.
-   Automatically retries until success.
-   Displays toast on successful sync:
    -   “Synced like magic ✨”

----------

## **5.8 Google Sheet Integration**

User must provide:

-   Google Sheet link
-   Google Apps Script Web App URL  
    (detailed instructions included inside app settings)

### Script handles:

-   Writing rows
-   Updating existing rows
-   Creating new sheet tabs if structure changes

----------

# **6. User Flows**

----------

## **6.1 First-Time Setup**

1.  App loads Setup Screen.
2.  User pastes:
    -   Google Sheet link
    -   Apps Script Web App URL
3.  User taps **Test Connection**.
4.  User defines events (add → name → icon → reorder).
5.  App stores settings in IndexedDB.
6.  App creates:
    -   Today’s new row
    -   Event order index set to 0

----------

## **6.2 Daily Logging**

1.  Main button shows current event.
2.  Tap:
    -   Store event & time offline
    -   Haptic feedback
    -   Quirky toast
    -   Move to next event

----------

## **6.3 Skip Flow**

1.  User taps Skip (⤼).
2.  Confirm dialog.
3.  “SKIPPED” saved.
4.  Move to next event.
5.  Show skip toast.

----------

## **6.4 Manual Edit**

1.  Tap Edit (✏️).
2.  Choose event.
3.  Pick time.
4.  Save → stored locally → queued.

----------

## **6.5 Sync Flow**

1.  Internet available.
2.  Background sync sends queued logs.
3.  On success:
    -   Clear queue
    -   Toast: **“All synced!”**

----------

# **7. Data Model**

----------

## **IndexedDB Tables**

### **events**

Field

Type

id

string

name

string

order

number

icon

string

### **logs**

Field

Type

id

string (UUID)

date

string (yyyy-mm-dd)

eventName

string

time

string (HH:mm or "SKIPPED")

status

"normal" | "skipped"

synced

boolean

### **metadata**

-   script_url
-   sheet_link
-   last_event_index
-   last_logged_date
-   event_structure_hash

----------

# **8. Google Sheet Structure**

### Columns:

-   Date
-   Event 1
-   Event 2
-   Event 3
-   (Dynamic based on user-defined events)

### Rules:

-   One row per day
-   On event structure change:
    -   Create new tab `DailyTap_<timestamp>`
    -   Write headers
    -   Begin writing new data

----------

# **9. Google Apps Script Specification**

### **Endpoint: `/log`**

**Input JSON**

```json
{
  "sheet": "<sheet-link>",
  "date": "2026-01-22",
  "events": {
    "Wake Up": "07:30",
    "Leave Home": "SKIPPED",
    "Reach Office": "09:45"
  },
  "structure": ["Wake Up", "Leave Home", "Reach Office"]
}

```

**Output**

```json
{
  "status": "success"
}

```

### Script Responsibilities

-   Detect if event structure changed → create new tab.
-   Append or update row for given date.
-   Accept partial rows (missing events).
-   Support SKIPPED values.

----------

# **10. PWA Requirements**

### Must include:

-   Manifest.json
    -   name: DailyTap
    -   theme_color: #18191C
    -   display: standalone
-   Service Worker
    -   Cache assets
    -   Background sync
    -   IndexedDB access

### Add-to-Home-Screen Requirements

-   192px + 512px icons
-   Short name “DailyTap”
-   Start URL: `/`

----------

# **11. Detailed Instructions (Shown Inside App Settings)**

----------

## **11.1 Google Apps Script Setup**

**Step 1 — Create Google Sheet**

1.  Open Sheets → New
2.  Name it **DailyTap Master**

**Step 2 — Open Apps Script**

1.  Extensions → Apps Script
2.  Paste provided script
3.  Save

**Step 3 — Deploy Web App**

1.  Deploy → New Deployment
2.  Select Web App
3.  Execute as: **Me**
4.  Who has access: **Anyone**
5.  Deploy
6.  Copy Web App URL

----------

## **11.2 Connecting Sheet**

1.  Open DailyTap
2.  Go to Settings
3.  Paste:
    -   Google Sheet link
    -   Web App Script URL
4.  Tap **Test Connection**
5.  Save

----------

## **11.3 Install as PWA**

1.  Open in Chrome
2.  Tap three dots menu
3.  Select “Add to Home Screen”
4.  Tap Add
5.  Now DailyTap works offline & loads like an app

----------

# **12. Non-Functional Requirements**

-   Offline load < 2 sec
-   Smooth at 60 fps on modern phones
-   IndexedDB as single source of truth
-   Sync must retry automatically until success
-   No user auth required
-   All settings saved locally
-   No data loss across reloads

----------

# **13. Acceptance Criteria**

-   [ ] Button logs event instantly
-   [ ] Skip feature fully works
-   [ ] Edit modal saves single event edits
-   [ ] User-defined events & order saved
-   [ ] New row created daily
-   [ ] Works offline
-   [ ] Syncs when online
-   [ ] New sheet tab created when event structure changes
-   [ ] PWA installable
-   [ ] Detailed onboarding and script setup included

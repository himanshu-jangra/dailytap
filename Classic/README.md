# ⚡ DailyTap — Personal Event Logging Web App

[![PWA Ready](https://img.shields.io/badge/PWA-Ready-7C4DFF?style=for-the-badge&logo=pwa&logoColor=white)](/)
[![Offline First](https://img.shields.io/badge/Offline--First-Reliable-4CAF50?style=for-the-badge)](/)
[![Material 3](https://img.shields.io/badge/UI-Material_3-18191C?style=for-the-badge)](/)

**DailyTap** is a minimalist, mobile-first, offline-first web application designed for one-touch logging of your daily routines. Whether it's "Wake Up", "Reach Office", or "Workout", DailyTap makes tracking your life as simple as a single tap.

---

## ✨ Key Features

-   **🎯 Single Large Event Button**: Optimized for the "thumb reach zone" for lightning-fast logging.
-   **📶 Offline-First**: Built with IndexedDB. Log your data anywhere, even without internet.
-   **🔄 Auto-Sync**: Automatically pushes your logs to a **Google Sheet** via Google Apps Script when you're back online.
-   **🪄 Material You Aesthetics**: A premium, dark-mode design with Material 3 (Material You) expressive elements and smooth micro-animations.
-   **⏭️ Skip & Edit**: Missed an event? Skip it with a tap. Made a mistake? Manually edit any event time.
-   **🛠️ Fully Customizable**: Add, remove, and reorder events to fit your specific daily routine.
-   **📱 PWA Power**: Install it on your home screen for an app-like experience without the App Store.

---

## 🚀 Use Cases

DailyTap is perfect for tracking:
-   **Daily Routines**: Wake up, Meditation, Meals, Bedtime.
-   **Office Hours**: Reach Office, Start Work, Lunch Break, Leave Office.
-   **Habit Tracking**: Vitamins taken, Daily walk, Reading sessions.
-   **Commutes**: Started driving, Reached destination.

---

## 🛠️ Technology Stack

-   **Frontend**: Vanilla HTML5, CSS3 (Material 3 Design System), JavaScript (ES6+ Modules).
-   **Storage**: IndexedDB (for primary source of truth and offline reliability).
-   **Sync**: Service Workers & Background Sync API.
-   **Backend**: Google Apps Script (Serverless endpoint for Google Sheets).
-   **Database**: Google Sheets (Your data remains in your control).

---

## 📥 Installation & Local Setup

### Prerequisites
-   Python 3 (for local server) or any static web server.

### Steps
1.  **Clone/Download** the repository to your local machine.
2.  **Start a local server**:
    ```bash
    cd DailyTap
    python3 -m http.server 8080
    ```
3.  **Open in Browser**: Navigate to `http://localhost:8080`.
4.  **WiFi Access**: To test on your phone, run:
    ```bash
    python3 -m http.server 8080 --bind 0.0.0.0
    ```
    Then visit `http://<your-mac-ip>:8080` on your mobile device.

---

## 🌐 Self-Hosting (Online for Free)

DailyTap is a **static web app**, making it free and easy to host.

### GitHub Pages (Recommended)
1.  Push this code to a new GitHub repository.
2.  Go to **Settings > Pages**.
3.  Select the `main` branch and `/ (root)` folder.
4.  **Custom Domain**: Add your subdomain (e.g., `tap.yourdomain.com`) and configure a CNAME record in your DNS settings pointing to `<username>.github.io`.

### Netlify (Drag & Drop)
1.  Drag the `DailyTap` folder into the Netlify dashboard.
2.  Instantly deployed! Add your custom domain in "Domain management".

---

## 📊 Google Sheets Integration

To enable syncing, you need to set up a Google Apps Script "bridge":

1.  **Create a Google Sheet**: Name it "DailyTap Master".
2.  **Open Script Editor**: Go to `Extensions > Apps Script`.
3.  **Paste the Script**: Use the code provided in the app's **Settings > Setup Instructions**.
4.  **Deploy**: 
    - Click `Deploy > New deployment`.
    - Select `Web app`.
    - Set `Execute as: Me` and `Who has access: Anyone`.
5.  **Connect**: Copy the Web App URL and paste it into the DailyTap settings screen.

---

## 📄 License

This project is open-source. Feel free to fork and customize it for your personal use!

---

*Made with ⚡ by Antigravity*

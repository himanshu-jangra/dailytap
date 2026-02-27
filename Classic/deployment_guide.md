# DailyTap Deployment & Restart Guide

## 🔄 How to Restart Locally

If you need to stop or restart the application locally:

### 1. Stop the current server
In your terminal, press `Ctrl + C` to stop the running Python server.

### 2. Start (Standard)
To run on your machine only:
```bash
cd /Users/himanshujangra/Downloads/DailyTap
python3 -m http.server 8080
```
Open **http://localhost:8080** in your browser.

### 3. Start (WiFi / Network Access)
To test on your phone connected to the same WiFi:

1.  **Run with host binding:**
    ```bash
    python3 -m http.server 8080 --bind 0.0.0.0
    ```

2.  **Find your local IP address:**
    - **Mac:** Go to System Settings → Wi-Fi → Details → TCP/IP → IP Address (e.g., `192.168.1.5`)
    - **Terminal:** Run `ipconfig getifaddr en0`

3.  **Open on phone:**
    Enter `http://<YOUR_IP_ADDRESS>:8080` (e.g., `http://192.168.1.5:8080`)

---

## 🌐 How to Host Online (Free)

Since DailyTap is a **static web app** (HTML/CSS/JS only), you can host it for free on many platforms.

### Option A: GitHub Pages (Recommended)

1.  **Create a Repository:**
    Log in to GitHub and create a new public repository (e.g., `dailytap`).

2.  **Upload Code:**
    - Initialize git in your folder:
      ```bash
      cd /Users/himanshujangra/Downloads/DailyTap
      git init
      git add .
      git commit -m "Initial commit"
      git branch -M main
      git remote add origin https://github.com/<YOUR_USERNAME>/dailytap.git
      git push -u origin main
      ```
    - *Alternatively, upload files via the GitHub website.*

3.  **Enable Pages:**
    - Go to Repository **Settings** → **Pages**.
    - Under **Branch**, select `main` (or `master`) and folder `/ (root)`.
    - Click **Save**.

4.  **Custom Subdomain:**
    - In the same **Pages** settings, scroll to **Custom domain**.
    - Enter your subdomain (e.g., `tap.yourdomain.com`).
    - Go to your DNS provider (GoDaddy, Namecheap, Cloudflare, etc.).
    - Add a **CNAME** record:
        - **Host:** `tap`
        - **Value:** `<YOUR_USERNAME>.github.io`
    - Wait for DNS propagation (usually minutes).
    - Check "Enforce HTTPS" in GitHub settings.

### Option B: Netlify (Easiest Drag & Drop)

1.  Go to [Netlify.com](https://www.netlify.com) and sign up/login.
2.  Go to **Sites** → **Add new site** → **Deploy manually**.
3.  Drag and drop your `DailyTap` folder onto the page.
4.  **Custom Subdomain:**
    - Go to **Domain management**.
    - Click **Add a domain**.
    - Enter your subdomain (e.g., `tap.yourdomain.com`).
    - Follow instructions to add a **CNAME** record pointing to the Netlify URL (e.g., `brave-curie-12345.netlify.app`).

### Option C: Vercel

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run `vercel` inside the folder.
3.  Follow prompts to deploy.
4.  Add custom domain in Vercel dashboard settings.

---

## ⚠️ Important Note on HTTPS

When hosting online (GitHub/Netlify), your site will use **HTTPS**.
- If your Google Apps Script is deployed, verify the script URL works.
- **Service Workers** (offline mode) **REQUIRE** HTTPS (or localhost) to work. Hosting online ensures your PWA works correctly on mobile devices.

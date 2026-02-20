# Make Your Webhook Public - Step by Step

## 🚀 Quick Setup (5 minutes)

### **Step 1: Download Cloudflare Tunnel** ⬇️

Go to: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

Download for Windows: `cloudflared-windows-amd64.exe`

---

### **Step 2: Extract & Setup** 📁

1. **Extract the file** to a folder (e.g., `C:\cloudflared`)
2. **Open PowerShell** as Administrator
3. **Navigate to folder:**
   ```powershell
   cd C:\cloudflared
   ```

---

### **Step 3: Create Tunnel** 🔗

Run this command (first time only):

```powershell
.\cloudflared.exe tunnel login
```

**What happens:**
- A browser window opens → Cloudflare login page
- Sign in with your Cloudflare account (create free account if needed)
- Click "Authorize"
- You'll see a domain like: `yourdomain.com`
- Copy that domain (you'll need it)

---

### **Step 4: Create Named Tunnel** 🏗️

```powershell
.\cloudflared.exe tunnel create my-webhook
```

**Output will show:**
```
Tunnel credentials written to...
Created tunnel my-webhook with id: xxxxxxx-xxxx-xxxx-xxxx
```

Save that tunnel ID somewhere.

---

### **Step 5: Route the Tunnel** 🛣️

```powershell
.\cloudflared.exe tunnel route dns my-webhook my-webhook.yourdomain.com
```

Replace `yourdomain.com` with your actual Cloudflare domain (from step 3).

**Example:**
```powershell
.\cloudflared.exe tunnel route dns my-webhook my-webhook.example.com
```

---

### **Step 6: Start the Tunnel** 🚀

This is the command you'll run **every time you want to expose localhost:**

```powershell
.\cloudflared.exe tunnel run my-webhook
```

**You should see:**
```
2026-02-20 10:30:45 INF Starting metrics server on 127.0.0.1:48324
2026-02-20 10:30:47 INF Tunnel credentials loaded from path
2026-02-20 10:30:47 INF Registered tunnel connection 
2026-02-20 10:30:47 INF Tunnel is operational
```

**Your public URL is now:**
```
https://my-webhook.yourdomain.com
```

---

### **Step 7: Update .env.local** 🔧

Edit your `.env.local` file:

```env
# Replace with your public domain
NEXT_PUBLIC_WEBHOOK_DOMAIN=https://my-webhook.yourdomain.com

# Jenkins (stays local)
JENKINS_URL=http://localhost:8080
JENKINS_USER=admin
JENKINS_TOKEN=your-jenkins-api-token
JENKINS_JOB=webhook-trigger-test
```

---

### **Step 8: Restart Your App** 🔄

In PowerShell (different terminal):

```powershell
cd d:\github-jenkins-webhook
npm run dev
```

**Wait for:**
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

### **Step 9: Check Your Webhook URL** ✅

1. Open `http://localhost:3000` in browser
2. Scroll to **"Manage Webhooks"** section
3. Look at your webhook
4. **Webhook URL should now show:**
   ```
   https://my-webhook.yourdomain.com/api/webhooks/sds-1771574355879
   ```

**If it still shows `192.168.56.1` or `localhost`:**
   - Close `npm run dev`
   - Verify `.env.local` has correct domain
   - Run `npm run dev` again

---

## 📋 Terminal Setup

You need **3 terminal windows running simultaneously:**

```
┌─────────────────────────────────────────────────────────┐
│ Terminal 1: Cloudflare Tunnel                          │
│ $ .\cloudflared.exe tunnel run my-webhook              │
│ ✓ https://my-webhook.yourdomain.com → localhost:3000   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Terminal 2: Your App                                    │
│ $ npm run dev                                           │
│ ✓ http://localhost:3000 (ready)                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Terminal 3: Optional - for other commands               │
│ (Git push, Jenkins checks, etc.)                        │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Testing Your Public Webhook

### **Test 1: Local Test (No Internet)**
1. Open `http://localhost:3000`
2. Go to "Test Webhook" section
3. Select your webhook
4. Click "Trigger Test Webhook"
5. Check Jenkins at `http://localhost:8080`
6. Should work! ✅

### **Test 2: Internet Test (Real GitHub)**
1. Open your GitHub repo
2. Settings → Webhooks → Add webhook
3. Paste: `https://my-webhook.yourdomain.com/api/webhooks/sds-1771574355879`
4. Content type: `application/json`
5. Events: ✓ Push events
6. Click "Add webhook"
7. Make a commit and push to GitHub
8. GitHub sends webhook → Your tunnel → Your app → Jenkins
9. Check Jenkins for new build ✅

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Cloudflared not found | Add to PATH: `C:\cloudflared` or use full path |
| Tunnel connection fails | Check internet connection, Cloudflare may be down |
| Webhook still shows localhost | Restart `npm run dev` after updating `.env.local` |
| GitHub webhook fails | Check GitHub webhook delivery logs (Settings → Webhooks → Recent Deliveries) |
| Jenkins not receiving webhook | Verify `JENKINS_TOKEN` and `JENKINS_JOB` in `.env.local` |

---

## 🔄 Daily Workflow

**Every time you develop:**

```powershell
# Terminal 1
cd C:\cloudflared
.\cloudflared.exe tunnel run my-webhook

# Terminal 2
cd d:\github-jenkins-webhook
npm run dev

# Now your webhook is public!
# https://my-webhook.yourdomain.com
```

**To stop everything:**
- Press `Ctrl+C` in both terminals

---

## 💾 Save These Commands

Create a batch file `start-webhook.bat`:

```batch
@echo off
cd C:\cloudflared
start "Tunnel" cmd /k ".\cloudflared.exe tunnel run my-webhook"
cd d:\github-jenkins-webhook
start "App" cmd /k "npm run dev"
```

Double-click to start both terminals! 🎉

---

## ✨ You're Ready!

✅ Webhook URL is public
✅ GitHub can reach it
✅ Local Jenkins works
✅ Real GitHub pushes trigger builds
✅ All features active

**Next:**
1. Test with "Test Webhook" button
2. Add webhook to GitHub repo
3. Make a commit and push
4. Watch Jenkins build trigger automatically! 🚀


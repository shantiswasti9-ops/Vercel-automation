# Complete Local Testing Setup Guide

## 🎯 Goal
- GitHub webhook triggers your local app on localhost
- Local app automatically triggers local Jenkins jobs
- View builds in Jenkins while developing

## 📋 Prerequisites
1. **Node.js** - Running `npm run dev` on localhost:3000
2. **Jenkins** - Running locally (localhost:8080)
3. **GitHub Account** - With a test repository
4. **Tunnel Tool** - ngrok OR Cloudflare Tunnel (to expose localhost)

---

## 🚀 Step 1: Start Your App Locally

```powershell
cd d:\github-jenkins-webhook
npm run dev
# App runs on http://localhost:3000
```

---

## 🚀 Step 2: Expose Localhost to Internet

### **Option A: Cloudflare Tunnel (Recommended - Free & Stable)**

```powershell
# 1. Download cloudflared
# From: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# 2. Login to Cloudflare (first time only)
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create my-webhook

# 4. Route the tunnel
cloudflared tunnel route dns my-webhook yourdomain.com

# 5. Run tunnel (keep this running)
cloudflared tunnel run my-webhook

# 6. Get your public URL
# Output: https://my-webhook.yourdomain.com
```

### **Option B: ngrok (Quick but URL changes)**

```powershell
# 1. Download from https://ngrok.com/download

# 2. Start ngrok
ngrok http 3000

# 3. Get public URL from output
# Example: https://abc123.ngrok.io
```

---

## 🚀 Step 3: Configure Environment

Create `.env.local`:

```env
# Your public webhook domain
NEXT_PUBLIC_WEBHOOK_DOMAIN=https://my-webhook.yourdomain.com
# OR for ngrok:
# NEXT_PUBLIC_WEBHOOK_DOMAIN=https://abc123.ngrok.io

# Jenkins Configuration
JENKINS_URL=http://localhost:8080
JENKINS_USER=admin
JENKINS_TOKEN=your-jenkins-api-token-here
JENKINS_JOB=webhook-trigger-test
```

### **Get Jenkins API Token:**
1. Go to `http://localhost:8080`
2. Click your username → Configure
3. Copy API token from "API Token" section

---

## 🚀 Step 4: Create Jenkins Job

### **In Jenkins:**

1. **Create new job** → Freestyle job
   - Name: `webhook-trigger-test`

2. **Check:** "This project is parameterized"
   - Add String parameters:
     - `repo` (Default: github)
     - `branch` (Default: main)
     - `commit` (Default: abc123)

3. **Build Step** → Execute shell:
   ```bash
   echo "🚀 Webhook triggered!"
   echo "Repository: $repo"
   echo "Branch: $branch"
   echo "Commit: $commit"
   whoami
   pwd
   ```

4. **Save**

---

## 🚀 Step 5: GitHub Webhook Setup

### **In GitHub Repository:**

1. Go to Settings → Webhooks → Add webhook
2. **Payload URL:** `https://my-webhook.yourdomain.com/api/webhooks/your-webhook-id`
   - Get webhook ID from dashboard
3. **Content type:** application/json
4. **Events:** Push events
5. **Active:** ✓ Checked
6. **Add webhook**

---

## 🚀 Step 6: Local Testing Workflow

### **Option 1: Manual Test (Instant)**

1. Open app: `http://localhost:3000`
2. Go to "Test Webhook" section
3. Select your webhook
4. Click "Trigger Test Webhook"
5. Check Jenkins: `http://localhost:8080`
6. New build appears! ✅

### **Option 2: Real GitHub Push (via Tunnel)**

1. Make code change in your test repo
2. `git push origin main`
3. GitHub sends webhook → Your tunnel → Your app
4. App automatically triggers Jenkins
5. Check Jenkins for new build
6. View in dashboard

---

## 🔑 Complete Workflow Diagram

```
┌─────────────┐
│   GitHub    │ (Online)
│  (Remote)   │
└──────┬──────┘
       │
       │ Webhook push
       │ (to public URL)
       ▼
┌──────────────────────────────┐
│  Cloudflare Tunnel / ngrok    │ (Internet)
│  (Exposes localhost)          │
└──────┬───────────────────────┘
       │
       │ Routes to
       │ http://localhost:3000
       ▼
┌──────────────────────────────┐
│  Your Local App              │ (localhost:3000)
│  - Dashboard                 │
│  - Webhook handlers          │
│  - Test UI                   │
└──────┬───────────────────────┘
       │
       │ Triggers via API
       │ (Jenkins integration)
       ▼
┌──────────────────────────────┐
│  Jenkins                     │ (localhost:8080)
│  - Builds job               │
│  - Shows status             │
│  - Logs output              │
└──────────────────────────────┘
```

---

## ✅ Testing Steps

### **1. Verify Everything Running:**
```powershell
# Terminal 1: Your app
npm run dev
# ✓ http://localhost:3000

# Terminal 2: Expose tunnel
cloudflared tunnel run my-webhook
# ✓ https://my-webhook.yourdomain.com

# Terminal 3: Jenkins
# ✓ http://localhost:8080
```

### **2. Test Local (No Internet Needed):**
- Open `http://localhost:3000`
- Use "Test Webhook" button
- See Jenkins job trigger instantly
- No GitHub push needed!

### **3. Test with GitHub (Real Webhook):**
- Make a change in GitHub repo
- Push code: `git push origin main`
- See GitHub webhook send to your tunnel
- Jenkins job triggers automatically
- View build in Jenkins dashboard

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Webhook not triggering | Check `.env.local` WEBHOOK_DOMAIN matches tunnel URL |
| Jenkins not responding | Verify `JENKINS_URL`, `JENKINS_USER`, `JENKINS_TOKEN` in `.env.local` |
| Jenkins job not found | Create `webhook-trigger-test` job in Jenkins |
| Tunnel keeps dying | Restart tunnel with `cloudflared tunnel run my-webhook` |
| GitHub webhook failing | Check Payload URL in GitHub matches your public domain |

---

## 📊 Expected Flow

1. ✅ Create webhook in app
2. ✅ Copy webhook URL to GitHub
3. ✅ Test locally with "Test Webhook" button (instant)
4. ✅ Jenkins job triggers and builds
5. ✅ Build appears in app dashboard
6. ✅ Real GitHub pushes also trigger the same webhook
7. ✅ No code changes needed between local & production

---

## 🎉 You Now Have

- ✅ Local development environment
- ✅ Real-time webhook testing
- ✅ Jenkins integration working
- ✅ GitHub integration ready
- ✅ Same setup works for production on Vercel

Enjoy! 🚀

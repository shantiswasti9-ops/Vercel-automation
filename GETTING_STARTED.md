# Getting Started - GitHub Jenkins Webhook Dashboard

Your GitHub → Jenkins webhook automation system is now ready! Follow these steps to get it running.

## 📂 Project Location

```
D:\github-jenkins-webhook\
```

Your project is ready with:
- ✅ Next.js 16 with TypeScript  
- ✅ GitHub webhook endpoint  
- ✅ Jenkins API integration  
- ✅ Live build dashboard  
- ✅ Build history storage  
- ✅ Vercel-ready configuration  

## 🚀 Quick Start (5 minutes)

### Step 1: Configure Environment Variables

**Option A: Interactive Setup (Recommended)**

```powershell
# Windows PowerShell
cd D:\github-jenkins-webhook
.\setup.ps1
```

This will guide you through entering:
- GitHub Webhook Secret
- Jenkins URL
- Jenkins Username  
- Jenkins API Token

**Option B: Manual Setup**

```bash
cd D:\github-jenkins-webhook
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
```env
GITHUB_WEBHOOK_SECRET=your-webhook-secret-here

JENKINS_URL=http://localhost:8080
JENKINS_USER=your-jenkins-username
JENKINS_TOKEN=your-jenkins-api-token
```

### Step 2: Install Dependencies (if not done)

```bash
cd D:\github-jenkins-webhook
npm install
```

### Step 3: Start Development Server

```bash
npm run dev
```

Open your browser to: **http://localhost:3000**

You should see the dashboard with 0 builds.

## 🧪 Test Locally

### 1. Create a Test Repository

```bash
mkdir test-repo
cd test-repo
git init
git add .
git commit -m "Initial commit"
```

### 2. Configure GitHub Webhook (Temporary)

For local testing, use ngrok to expose your local server to the internet:

```bash
# Install ngrok if you don't have it
# Download from https://ngrok.com

# In another terminal, run:
ngrok http 3000
```

This gives you a URL like: `https://1234-56-78-90-12.eu.ngrok.io`

Go to your repository on GitHub:
- **Settings → Webhooks → Add webhook**
- **Payload URL**: `https://1234-56-78-90-12.eu.ngrok.io/api/webhooks/github`
- **Content type**: application/json
- **Secret**: Same as GITHUB_WEBHOOK_SECRET from step 1
- **Events**: Push events
- Click **Add webhook**

### 3. Create Jenkins Job

Create a parameterized Jenkins job named `test-repo-main`:

**Step 1: New Item → Freestyle job**
- Name: `test-repo-main`

**Step 2: Build Configuration**
- Add parameters:
  - `GIT_BRANCH` (String)
  - `GIT_COMMIT` (String)
  - `GIT_URL` (String)
  - `COMMIT_MSG` (String)

**Step 3: Build Steps**
- Add build step → Execute Shell (or Windows Batch)
  ```bash
  echo "Testing webhook with commit: $GIT_COMMIT"
  echo "Branch: $GIT_BRANCH"
  echo "Message: $COMMIT_MSG"
  ```

**Step 4: Save**

### 4. Test the Full Flow

Push to your test repository:
```bash
cd test-repo
echo "test" > test.txt
git add .
git commit -m "Test commit"
git push origin main
```

Check your dashboard at http://localhost:3000 - you should see a new build appear!

## 🌐 Deploy to Vercel (Production)

### Step 1: Create GitHub Repository

```bash
cd D:\github-jenkins-webhook
git remote add origin https://github.com/YOUR_USERNAME/github-jenkins-webhook.git
git branch -M main
git push -u origin main
```

### Step 2: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 3: Deploy

```bash
cd D:\github-jenkins-webhook
vercel
```

Follow the prompts. You'll get a URL like: `github-jenkins-webhook.vercel.app`

### Step 4: Add Environment Variables

In the Vercel dashboard for your project:

**Settings → Environment Variables**

Add these variables:
| Variable | Value |
|----------|-------|
| `GITHUB_WEBHOOK_SECRET` | Your webhook secret |
| `JENKINS_URL` | Your Jenkins URL (must be publicly accessible) |
| `JENKINS_USER` | Jenkins username |
| `JENKINS_TOKEN` | Jenkins API token |

Click **Save**

### Step 5: Configure GitHub Webhooks (Production)

For each repository you want to monitor:

1. Go to **Settings → Webhooks → Add webhook**
2. **Payload URL**: `https://github-jenkins-webhook.vercel.app/api/webhooks/github`
3. **Content type**: application/json
4. **Secret**: Same GITHUB_WEBHOOK_SECRET
5. **Events**: Push events
6. Click **Add webhook**

Test it by pushing code - you should see it on the dashboard in seconds!

## 📊 Your Dashboard Features

The dashboard shows:

### Statistics
- Total builds triggered
- Successful builds
- Failed builds
- Number of repositories

### Filters
- Filter by repository
- Filter by branch

### Build History Table
- Repository name
- Branch 
- Commit SHA (linked to Jenkins)
- Author name
- Build status (triggered, running, success, failed)
- Time since build (e.g., "2 minutes ago")

### Setup Instructions (Built-in)
Quick reference right on the dashboard

## 🔗 Multiple Repos & Branches

The system supports unlimited repositories and branches!

### For Multiple Repositories:

1. Add GitHub webhook to each repo (same webhook URL)
2. Create Jenkins job for each `{repo}-{branch}` combination
3. All push events automatically route to correct Jenkins job

**Example Setup:**
```
repo1 main          → Jenkins job: repo1-main
repo1 develop       → Jenkins job: repo1-develop
repo2 main          → Jenkins job: repo2-main
myapp feature-auth  → Jenkins job: myapp-feature-auth
```

## 📚 Important Files

| File | Purpose |
|------|---------|
| `README.md` | Complete documentation |
| `QUICKSTART.md` | Quick reference guide |
| `JENKINS_SETUP.md` | Detailed Jenkins configuration |
| `app/api/webhooks/github/route.ts` | GitHub webhook handler |
| `app/api/builds/route.ts` | Build history API |
| `lib/jenkins.ts` | Jenkins API integration |
| `lib/db.ts` | Build storage |
| `app/page.tsx` | Dashboard UI |

## 🆘 Troubleshooting

### "Module not found" errors
```bash
npm install  # Make sure all dependencies are installed
```

### Dashboard shows "Loading..." forever
- Check browser console for errors (F12)
- Check that the dev server is running
- Check network tab in browser DevTools

### Webhook not triggering Jenkins
1. Check JENKINS_URL is correct and accessible
2. Check Jenkins credentials in environment variables
3. Check Jenkins job exists and is parameterized
4. Check job name matches pattern: `{repo}-{branch}`

### Can't reach Jenkins from Vercel
- If Jenkins is on localhost: Use ngrok tunnel
- If Jenkins is on private network: Use VPN or bastion host
- If Jenkins is cloud-based: Should work directly

### GitHub webhook delivery failing
1. Go to GitHub repo → Settings → Webhooks
2. Click the webhook → Recent Deliveries
3. Look at the response (should be 200)
4. Check the response body for error details

## 🎯 Next Steps

1. ✅ **Test locally** with your current Jenkins setup
2. 🚀 **Deploy to Vercel** when ready (no domain needed!)
3. 📋 **Add webhooks** to all your repositories
4. 📊 **Monitor builds** on the dashboard
5. 🔔 **Add notifications** (integrate with Slack,Email, etc.)

## 💡 Pro Tips

- **Auto-merge on success:** Add a Jenkins post-build step
- **Slack notifications:** Install Jenkins Slack plugin
- **Build artifacts:** Archive outputs in Jenkins
- **Force redeploy:** Trigger manually in Jenkins UI
- **View logs:** Check `.builds.json` in project root

## 🔐 Security Notes

- ✅ GitHub webhook signatures verified
- ✅ Environment variables not committed to git
- ✅ Webhook secret prevents unauthorized access
- ✅ Jenkins token stored securely
- ⚠️ Keep webhook secret and Jenkins token confidential!

## 📞 Need Help?

1. **Local issues?** Check the troubleshooting section above
2. **Jenkins help?** See JENKINS_SETUP.md
3. **Vercel deployment?** See Vercel docs
4. **GitHub webhooks?** See GitHub webhook documentation

---

**Ready to deploy?** Start with Step 2's "Deploy to Vercel" section!

# Quick Start Guide

## ⚡ 5-Minute Local Setup

### 1. Configure Environment
```bash
# Windows PowerShell
.\setup.ps1

# macOS/Linux
bash setup.sh
```

Follow the prompts to enter:
- GitHub Webhook Secret
- Jenkins URL, Username, Token

### 2. Start Development Server
```bash
npm run dev
```

Open browser to: **http://localhost:3000**

You should see a dashboard with 0 builds.

### 3. Test the Webhook

Push to a Git repository:
```bash
git push origin main
```

If configured correctly:
✅ GitHub sends webhook  
✅ Your app receives it  
✅ Jenkins build triggers  
✅ Build appears on dashboard

## 🚀 Deploy to Vercel (No Custom Domain!)

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Deploy
```bash
vercel
```

You'll get a domain like: `github-jenkins-webhook.vercel.app`

### 3. Add Environment Variables in Vercel Dashboard

Go to: **Settings → Environment Variables**

Add:
| Key | Value |
|-----|-------|
| `GITHUB_WEBHOOK_SECRET` | Your secret from setup |
| `JENKINS_URL` | `http://your-jenkins:8080` |
| `JENKINS_USER` | Your Jenkins username |
| `JENKINS_TOKEN` | Your Jenkins API token |

### 4. Add GitHub Webhooks

For each repository in GitHub:

**Settings → Webhooks → Add webhook**

- Payload URL: `https://github-jenkins-webhook.vercel.app/api/webhooks/github`
- Content type: `application/json`
- Secret: Same as `GITHUB_WEBHOOK_SECRET`
- Events: **Push events**
- Active: ✅ Checked

## 📋 Jenkins Job Setup (One Per Branch)

Create a **Parameterized Freestyle Job** for each repo+branch:

**Example: my-app-main**

Receive parameters:
- `GIT_BRANCH`
- `GIT_COMMIT`
- `GIT_URL`
- `COMMIT_MSG`

Build step (shell):
```bash
git clone $GIT_URL .
git checkout $GIT_BRANCH
git reset --hard $GIT_COMMIT

npm install
npm run build
```

## 🔍 Troubleshooting

### No builds appearing?
1. Check GitHub webhook delivery (Webhooks page → Recent Deliveries)
2. Should show 200 status
3. If 5xx error, check Vercel logs

### Jenkins build not triggering?
1. Check Jenkins URL is reachable from Vercel
2. Check Jenkins credentials (JENKINS_USER, JENKINS_TOKEN)
3. Check Jenkins job exists and matches naming pattern
4. Check Jenkins logs for API errors

### How to view logs locally?
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Watch logs
tail -f .builds.json
```

## 📚 More Information

- [Full README](README.md) - Complete features and API docs
- [Jenkins Setup Guide](JENKINS_SETUP.md) - Detailed Jenkins configuration
- [Vercel Docs](https://vercel.com/docs) - Deployment and environment

## 🎯 Typical Flow

```
1. Developer pushes code to GitHub
   ↓
2. GitHub webhook triggers
   ↓
3. Vercel receives request via /api/webhooks/github endpoint
   ↓
4. Webhook handler:
   - Verifies GitHub signature
   - Extracts repo, branch, commit
   - Calls Jenkins API to trigger build
   - Logs build in dashboard
   ↓
5. Jenkins:
   - Receives build parameters
   - Checks out code
   - Runs build steps
   - Reports status
   ↓
6. Dashboard shows build in table
   - Status: triggered → running → success/failed
   - Branch, commit, author visible
   - Jenkins build URL linked
```

## 💡 Pro Tips

- **Multiple repos?** Add webhook to each one with same secret
- **Multiple branches?** Create Jenkins jobs for each: `repo-main`, `repo-dev`, etc.
- **Auto-merge?** Add script in Jenkins to merge on success
- **Notifications?** Add Slack plugin to Jenkins
- **Staging deploy?** Add deploy step in Jenkins build

## ❓ Q&A

**Q: Do I need a custom domain?**  
A: No! Vercel gives you a free domain like `your-app.vercel.app`

**Q: How many repos can I monitor?**  
A: Unlimited. Just add webhooks to each one.

**Q: What if Jenkins is on my local machine?**  
A: Vercel can't reach localhost. Use ngrok to create a tunnel:
```bash
ngrok http 8080
```
Then use the ngrok URL as JENKINS_URL

**Q: Can I use this with GitLab/Bitbucket?**  
A: Yes, but you'd need to add separate webhook routes for each platform.

**Q: How long are builds stored?**  
A: Last 100 builds or 30 days (configurable in code).

---

**Need help?** Check the README.md or JENKINS_SETUP.md files!

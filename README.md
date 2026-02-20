# GitHub → Jenkins Webhook Dashboard

Automatic build triggering on GitHub push events with a live dashboard showing build status across multiple repositories and branches. No custom domain needed—runs on Vercel's free tier!

## Features

✅ **Auto-trigger Jenkins builds** on every GitHub push  
✅ **Multi-repo, multi-branch** support  
✅ **Live build dashboard** with status tracking  
✅ **Webhook signature verification** for security  
✅ **Deploy to Vercel** (no domain required)  
✅ **Build history** with commit information  

## Architecture

```
GitHub Push → Webhook → Vercel API Route → Jenkins Build Trigger
                           ↓
                      Dashboard (shows status)
```

## Quick Start

### 1. Local Setup

```bash
# Install dependencies (already done)
npm install

# Create environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

Open http://localhost:3000 to view the dashboard.

### 2. Environment Variables

Edit `.env.local` with your configuration:

```env
# GitHub (get from repository webhook settings)
GITHUB_WEBHOOK_SECRET=your-secret-here

# Jenkins (self-hosted or cloud)
JENKINS_URL=http://your-jenkins-server:8080
JENKINS_USER=your-jenkins-username
JENKINS_TOKEN=your-jenkins-api-token
```

**Getting GitHub Webhook Secret:**
1. Go to GitHub repo → Settings → Webhooks
2. You'll set this when creating the webhook

**Getting Jenkins Token:**
1. Jenkins → Your Profile → API Token
2. Generate a new token

### 3. Deploy to Vercel

```bash
# Option A: Via Vercel CLI
npm i -g vercel
vercel

# Option B: Via GitHub
# Push to GitHub, then connect repo in https://vercel.com
```

Your app will be available at `your-project.vercel.app`

### 4. Configure GitHub Webhook

In your GitHub repository:

1. Go to **Settings → Webhooks → Add webhook**
2. **Payload URL:** `https://your-project.vercel.app/api/webhooks/github`
3. **Content type:** application/json
4. **Secret:** (same as `GITHUB_WEBHOOK_SECRET`)
5. **Events:** Push events
6. Click **Add webhook**

Test the webhook by making a push to any branch.

### 5. Create Jenkins Jobs

For each repo+branch combination, create a Parameterized Build:

**Jenkins Job Configuration:**
- Job name: `{repo-name}-{branch-name}` (e.g., `my-app-main`)
- Parameters:
  - `GIT_BRANCH` (String)
  - `GIT_COMMIT` (String)
  - `GIT_URL` (String)
  - `COMMIT_MSG` (String)
- Build trigger: Parameterized trigger (from webhook)

Example build step:
```bash
git clone $GIT_URL repo
cd repo
git checkout $GIT_BRANCH
git reset --hard $GIT_COMMIT
npm install
npm run build
```

## Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── webhooks/github/route.ts    # GitHub webhook endpoint
│   │   └── builds/route.ts              # Build history API
│   └── page.tsx                         # Dashboard UI
├── lib/
│   ├── jenkins.ts                       # Jenkins API integration
│   └── db.ts                            # Build history storage
├── .env.local.example                   # Environment template
└── package.json
```

## API Endpoints

### POST `/api/webhooks/github`
Receives GitHub push events and triggers Jenkins builds.

**Response:**
```json
{
  "success": true,
  "repo": "my-app",
  "branch": "main",
  "commit": "abc123...",
  "buildTriggered": true,
  "buildNumber": 42
}
```

### GET `/api/builds`
Fetch build history with optional filters.

**Query Parameters:**
- `repo` - Filter by repository
- `branch` - Filter by branch
- `type=stats` - Get statistics instead of logs

**Response:**
```json
[
  {
    "repo": "my-app",
    "branch": "main",
    "commit": "abc123...",
    "author": "john",
    "message": "Fix bug",
    "buildId": "42",
    "status": "success",
    "timestamp": "2023-01-15T10:00:00Z",
    "jenkinsUrl": "http://jenkins:8080/job/my-app-main/42"
  }
]
```

## Project Management & Multi-Repo Support

The system supports **unlimited repositories and branches** through the **Projects interface** at `/projects`.

### Two Modes:

**Single Repository Mode** - One repo with multiple branches
```
Project → Repository → [main, develop, staging, ...]
```

**Multiple Repository Mode** - Multiple repos with custom branches each
```
Project → [Repo 1 → [main, develop, ...], Repo 2 → [main, staging, ...], ...]
```

### How It Works:

1. Create a project on `/projects` page
2. Choose Single or Multiple repository mode
3. Add repository URLs and branches to monitor
4. For private repos, provide GitHub PAT token
5. Create corresponding Jenkins jobs: `{repo}-{branch}`
6. Add webhook to GitHub repos (same secret for all)
7. Pushes to configured repos/branches trigger builds and appear on dashboard

**📖 See [PROJECT_MANAGEMENT.md](PROJECT_MANAGEMENT.md) for:**
- Detailed single vs multi-repo setup
- Private repository PAT token configuration
- Dashboard filtering by project/repo/branch
- Webhook validation rules
- Complete step-by-step walkthroughs
- Troubleshooting guide

## Troubleshooting

### Webhook not triggering Jenkins
- Check `JENKINS_URL`, `JENKINS_USER`, `JENKINS_TOKEN` in Vercel env vars
- Ensure Jenkins is accessible from Vercel
- Check Jenkins logs for build trigger errors

### Dashboard shows no builds
- Make a push to any repo with webhook configured
- Check webhook delivery in GitHub Settings → Webhooks

### Jenkins credentials error
- Test Jenkins token: `curl -u user:token http://jenkins:8080/api/json`
- Verify Jenkins allows remote builds

## Next Steps

- Add database persistence (currently uses JSON file)
- Add webhook retry logic
- Implement build status updates
- Add notifications (Slack, email)
- Add branch protection rules
- Extend to support GitLab, Bitbucket

## License

MIT

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

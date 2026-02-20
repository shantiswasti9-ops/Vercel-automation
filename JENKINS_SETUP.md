# Jenkins Configuration Guide

## Creating a Jenkins Job for Auto-Triggered Builds

### Prerequisites
- Jenkins instance running and accessible
- Jenkins script security plugin installed
- A GitHub personal access token (optional, for private repos)

### Step 1: Create a New Job

1. Click **New Item** → **Freestyle job**
2. Name: `my-app-main` (format: `{repo-name}-{branch-name}`)
3. Click **OK**

### Step 2: Configure Parameters

1. Check **"This is a parameterized job"**
2. Add parameters:

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `GIT_BRANCH` | String | main | Branch name |
| `GIT_COMMIT` | String | | Commit SHA |
| `GIT_URL` | String | | Repository URL |
| `COMMIT_MSG` | String | | Commit message |

### Step 3: Source Code Management

1. Select **Git**
2. Repository URL: `https://github.com/yourname/repo.git`
3. Credentials: Add your GitHub token if private
4. Branch Specifier: `${GIT_BRANCH}`
5. Advanced → Checkout to specific commit: `${GIT_COMMIT}`

### Step 4: Build Steps

Add as many build steps as needed. Example:

**Execute shell:**
```bash
echo "Building commit: $GIT_COMMIT from branch: $GIT_BRANCH"
echo "Commit message: $COMMIT_MSG"

# Install dependencies
npm install

# Run tests
npm run test

# Build
npm run build

# Deploy (if desired)
npm run deploy
```

### Step 5: Build Triggers

✅ **Webhook** configured (handled by our app)  
❌ Do NOT enable polling or other triggers

### Step 6: Post-Build Actions (Optional)

- Archive build artifacts
- Send email notifications
- Publish test results
- Deploy to staging/production

### Step 7: Save

Click **Save**

---

## Multiple Repos Example

Create separate jobs for each repo+branch combination:

```
repo1-main       → builds main branch
repo1-develop    → builds develop branch
repo2-main       → builds main branch
repo2-feature-x  → builds feature-x branch
```

Each job receives parameters from the webhook:
```json
{
  "GIT_BRANCH": "main",
  "GIT_COMMIT": "abc123def456",
  "GIT_URL": "https://github.com/user/repo1.git",
  "COMMIT_MSG": "Fix critical bug"
}
```

---

## Testing the Integration

### Test 1: Manual Build Trigger

1. Go to Jenkins job → **Build with Parameters**
2. Fill in parameters:
   ```
   GIT_BRANCH: main
   GIT_COMMIT: <any valid commit sha>
   GIT_URL: https://github.com/yourname/yourrepo.git
   COMMIT_MSG: Manual test
   ```
3. Click **Build**
4. Check console output

### Test 2: GitHub Webhook Test

1. Push to your repo: `git push origin main`
2. Check dashboard at your-app.vercel.app
3. Build should appear within 10 seconds
4. Jenkins job should start automatically

### Test 3: Webhook Delivery Logs

GitHub → Settings → Webhooks → Click webhook → Recent Deliveries

You should see successful (200) responses:
```json
{
  "success": true,
  "repo": "yourrepo",
  "branch": "main",
  "buildTriggered": true
}
```

---

## Troubleshooting

### BuildWithParameters returns 404

**Problem:** Jenkins cannot find the job

**Solutions:**
- Job name doesn't match expected format
- Check Jenkins URL is correct
- Verify Jenkins credentials have permission to build

### Authentication failed

**Problem:** Jenkins token is invalid or expired

**Solutions:**
- Regenerate token in Jenkins → Your Profile → API Token
- Update `JENKINS_TOKEN` in Vercel environment variables
- Re-deploy Vercel project

### Build parameters not passed correctly

**Problem:** Jenkins job doesn't receive parameters

**Solutions:**
- Ensure job is configured as parameterized
- Check parameter names match exactly (case-sensitive)
- Verify webhook payload contains parameters

### Jenkins not accessible from Vercel

**Problem:** Build trigger fails silently

**Solutions:**
- If Jenkins is on localhost, it won't be reachable from Vercel
- Use ngrok to tunnel: `ngrok http 8080`
- Use cloud Jenkins (AWS CodePipeline, GitHub Actions, etc.)
- Use VPN/Bastion host to reach Jenkins

---

## Advanced Features

### Conditional Builds

Skip builds for certain branches:

```bash
if [ "$GIT_BRANCH" != "main" ] && [ "$GIT_BRANCH" != "develop" ]; then
  echo "Skipping build for branch: $GIT_BRANCH"
  exit 0
fi
```

### Dynamic Job Names

In webhook code, dynamically create Jenkins jobs:

```typescript
const jobName = `${repo}-${branch}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
// Creates: my-app-feature-x
```

### Matrix Builds

Create jobs that test against multiple Node versions:

```groovy
pipeline {
  agent { docker 'node:16 node:18 node:20' }
  // Automatically runs against all versions
}
```

### Community Plugins

- **GitHub Integration Plugin** - Better GitHub feedback
- **Slack Notification Plugin** - Send build status to Slack
- **Email Extension** - Email notifications
- **Build Name Updater** - Custom build names

---

## Production Checklist

- [ ] Jenkins credentials stored securely
- [ ] GitHub webhook secret configured
- [ ] Job names follow consistent naming pattern
- [ ] Build steps include proper error handling
- [ ] Test payloads sent from GitHub
- [ ] Dashboard accessible without auth
- [ ] Build logs retained for debugging
- [ ] Monitoring/alerts configured
- [ ] Backup Jenkins configuration

# Project Management & Private Repository Guide

## Overview

The enhanced GitHub Jenkins Webhook system now includes a **Project Management Interface** that allows you to:
- ✅ Create named projects
- ✅ Choose between single repository or multiple repositories per project
- ✅ Add multiple branches per repository
- ✅ Support private repositories with PAT (Personal Access Token) authentication
- ✅ Filter builds by project, repository, and branch

## 📋 Project Types

### 1. Single Repository Project
**Use Case:** One application with multiple branches (main, develop, staging, etc.)

**How It Works:**
- Create one project
- Add one repository URL
- Add multiple branches to monitor
- All pushes to configured branches trigger Jenkins builds

**Example:**
```
Project: "My App"
├─ Repository: https://github.com/mycompany/myapp.git
│  ├─ main      → job name: myapp-main
│  ├─ develop   → job name: myapp-develop
│  └─ staging   → job name: myapp-staging
```

**Step-by-Step:**
1. Go to `/projects`
2. Click "+ New Project"
3. **Project Name:** "My App"
4. **Project Type:** Single Repository
5. **Repository URL:** `https://github.com/mycompany/myapp.git`
6. **Branches:** main, develop, staging
7. Click "Create Project"

### 2. Multiple Repository Project
**Use Case:** Monorepo or application group with different repos

**How It Works:**
- Create one project
- Add multiple repository URLs
- Each repository can have different branches
- All configured pushes trigger corresponding Jenkins builds

**Example:**
```
Project: "E-Commerce Platform"
├─ Repository 1: https://github.com/mycompany/frontend.git
│  ├─ main      → job name: frontend-main
│  └─ develop   → job name: frontend-develop
├─ Repository 2: https://github.com/mycompany/backend.git
│  ├─ main      → job name: backend-main
│  └─ develop   → job name: backend-develop
└─ Repository 3: https://github.com/mycompany/mobile.git
   ├─ main      → job name: mobile-main
   └─ develop   → job name: mobile-develop
```

**Step-by-Step:**
1. Go to `/projects`
2. Click "+ New Project"
3. **Project Name:** "E-Commerce Platform"
4. **Project Type:** Multiple Repositories
5. Leave Repository URL blank (add later)
6. Click "Create Project"
7. Click "+ Add Repository" in the created project
8. For each repository:
   - Enter Repository URL
   - Add branches
   - Click "Add Repository"

## 🔐 Private Repository Support

Private repositories require authentication via GitHub Personal Access Token (PAT).

### Getting Your PAT Token

1. Go to GitHub → Settings → Developer settings → [Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token" (or "Generate new token (classic)")
3. Give it a name: "Jenkins Webhook - [Project Name]"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ❌ Other scopes not needed
5. Copy the token (you can only see it once!)
6. Paste it into the project configuration

### Using PAT with Private Repos

When adding a private repository in the project manager:

1. Check "This is a private repository"
2. Paste your PAT token in the "Personal Access Token" field
3. The token is:
   - ✅ Encrypted in storage
   - ✅ Not displayed after saving
   - ✅ Only sent to Jenkins
   - ✅ Masked in logs

**Security Notes:**
- Tokens are stored in `.projects.json` (add to `.gitignore` - already done)
- Never commit tokens to Git
- Use one token per project (for easier revocation)
- Revoke tokens immediately if compromised

### Jenkins Integration with Private Repos

The PAT token is passed to Jenkins as a build parameter:
- Parameter name: `GIT_TOKEN`
- Jenkins can use it to clone private repos

**Jenkins Build Script Example:**
```bash
#!/bin/bash
set -e

echo "Cloning private repository..."

# Use HTTPS with token
git clone https://$GIT_TOKEN@github.com/$REPO_OWNER/$REPO_NAME.git .
git checkout $GIT_BRANCH
git reset --hard $GIT_COMMIT

echo "Building..."
npm install
npm run build
```

Or with SSH:
```bash
#!/bin/bash
# If Jenkins is configured for SSH key auth
git clone $GIT_URL .
git checkout $GIT_BRANCH
git reset --hard $GIT_COMMIT
npm install
npm run build
```

## 🎯 Webhook Configuration for Projects

### Webhook Endpoint URL

All projects use the same webhook endpoint:
```
https://your-domain.vercel.app/api/webhooks/github
```

### Adding Webhooks to GitHub Repositories

For **each repository** in your project:

1. Go to **GitHub Repository → Settings → Webhooks**
2. Click **Add webhook**
3. **Payload URL:** `https://your-domain.vercel.app/api/webhooks/github`
4. **Content type:** `application/json`
5. **Secret:** `GITHUB_WEBHOOK_SECRET` (same for all repos)
6. **Which events?** Push events
7. **Active:** ✅ Checked
8. Click **Add webhook**

**Test the webhook:**
1. Click the webhook you just created
2. Go to "Recent Deliveries"
3. Should see a successful (200) response

### Multiple Repos with One Project

If you have 3 repositories in one project, add the same webhook to all 3:
```
Webhook URL: https://your-domain.vercel.app/api/webhooks/github
Secret: (same secret for all 3)
Events: Push events
```

The system will automatically:
- ✅ Receive the push from any repo
- ✅ Check if the repo is configured in a project
- ✅ Check if the branch is configured
- ✅ Trigger the appropriate Jenkins job

## Dashboard Filtering

The dashboard now has **three filter levels:**

### Filter 1: Project
```
All Projects → Shows all builds from all projects
Select Project → Shows only builds from that project
```

### Filter 2: Repository
```
All Repositories → Shows all repos in selected project
Select Repo → Shows only that repository
```

### Filter 3: Branch
```
All Branches → Shows all branches in selected repo
Select Branch → Shows only that branch
```

**Filter Logic:**
- Selecting Project → clears Repo and Branch filters
- Selecting Repo → clears Branch filter
- Changing Branch → keeps Project and Repo selected

**Example Workflow:**
1. User selects Project: "E-Commerce Platform"
2. Dashboard shows builds from frontend, backend, mobile
3. User selects Repository: "backend"
4. Dashboard shows only backend builds
5. User selects Branch: "main"
6. Dashboard shows only backend main builds

## API Endpoints

### Create Project

```bash
POST /api/projects
Content-Type: application/json

{
  "action": "create",
  "name": "My App",
  "type": "single",
  "repos": [{
    "id": "repo_1234567890",
    "url": "https://github.com/mycompany/myapp.git",
    "branches": ["main", "develop"],
    "isPrivate": false,
    "token": null
  }]
}
```

### Get All Projects

```bash
GET /api/projects

Response:
[{
  "id": "proj_1234567890",
  "name": "My App",
  "type": "single",
  "repos": [...],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}]
```

### Add Repository to Project

```bash
POST /api/projects
Content-Type: application/json

{
  "action": "addRepo",
  "projectId": "proj_1234567890",
  "repo": {
    "id": "repo_9876543210",
    "url": "https://github.com/mycompany/backend.git",
    "branches": ["main"],
    "isPrivate": true,
    "token": "ghp_xxxxxxxxxxxx"
  }
}
```

### Update Repository

```bash
POST /api/projects
Content-Type: application/json

{
  "action": "updateRepo",
  "projectId": "proj_1234567890",
  "repoId": "repo_1234567890",
  "updates": {
    "branches": ["main", "develop", "staging"],
    "isPrivate": true,
    "token": "ghp_xxxxxxxxxxxx"
  }
}
```

### Delete Project

```bash
POST /api/projects
Content-Type: application/json

{
  "action": "delete",
  "projectId": "proj_1234567890"
}
```

## Data Storage

### Projects Data

Stored in `.projects.json`:
```json
[{
  "id": "proj_abc123",
  "name": "My App",
  "type": "single",
  "repos": [{
    "id": "repo_xyz789",
    "url": "https://github.com/user/repo.git",
    "branches": ["main", "develop"],
    "isPrivate": false,
    "token": null
  }],
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}]
```

### Build Logs

Stores additional fields in `.builds.json`:
```json
{
  "repo": "myapp",
  "branch": "main",
  "commit": "abc123...",
  "author": "john",
  "message": "Fix bug",
  "buildId": "42",
  "status": "success",
  "timestamp": "2024-01-15T10:00:00Z",
  "jenkinsUrl": "http://jenkins:8080/...",
  "projectId": "proj_abc123",
  "projectName": "My App"
}
```

## Webhook Validation

The webhook now validates:

1. ✅ **GitHub Signature** - Verifies webhook came from GitHub
2. ✅ **Repository Registration** - Checks if repo is in any project
3. ✅ **Branch Configuration** - Checks if branch is configured
4. ✅ **Jenkins Job Matching** - Looks for `{repo}-{branch}` job name

**Example Validation Flow:**

```
Push to: github.com/mycompany/backend.git
Branch: main
Author: john

↓ Webhook received

Step 1: Verify GitHub signature ✓
Step 2: Is "backend" repo in any project? → Yes, "E-Commerce Platform"
Step 3: Is "main" branch configured for "backend"? → Yes
Step 4: Trigger Jenkins job "backend-main" ✓
Step 5: Log build in dashboard ✓
```

## Multi-Repo Example Walkthrough

### Scenario
You manage 3 projects:
1. **Frontend App** (1 repo, 2 branches)
2. **Backend API** (1 repo, 3 branches)
3. **DevOps Tools** (2 repos, 2 branches each)

### Setup

**1. Create Frontend Project**
- Project Name: "Frontend App"
- Type: Single Repository
- URL: `https://github.com/mycompany/frontend.git`
- Branches: main, develop
- Add GitHub webhook to frontend repo

**2. Create Backend Project**
- Project Name: "Backend API"
- Type: Single Repository
- URL: `https://github.com/mycompany/backend.git`
- Branches: main, develop, staging
- Add GitHub webhook to backend repo (same webhook URL)

**3. Create DevOps Project**
- Project Name: "DevOps Tools"
- Type: Multiple Repositories
- Add webhook to both repos first
- Click "+ Add Repository":
  - Repo 1: `https://github.com/mycompany/terraform.git` (branches: main)
  - Repo 2: `https://github.com/mycompany/ansible.git` (branches: main, develop)

### Jenkins Setup

Create 7 jobs:
```
frontend-main       → triggers on push to frontend main
frontend-develop    → triggers on push to frontend develop
backend-main        → triggers on push to backend main
backend-develop     → triggers on push to backend develop
backend-staging     → triggers on push to backend staging
terraform-main      → triggers on push to terraform main
ansible-main        → triggers on push to ansible main
ansible-develop     → triggers on push to ansible develop
```

### Webhook URLs

Add same webhook to 3 GitHub repositories:
```
frontend repo       → https://your-app.vercel.app/api/webhooks/github
backend repo        → https://your-app.vercel.app/api/webhooks/github
terraform repo      → https://your-app.vercel.app/api/webhooks/github
ansible repo        → https://your-app.vercel.app/api/webhooks/github
```

### Workflow

```
Developer pushes to frontend/develop
  ↓
GitHub webhook → your-app.vercel.app/api/webhooks/github
  ↓
System checks: Is frontend repo in a project? YES
  ↓
System checks: Is develop branch configured? YES
  ↓
Trigger Jenkins job: frontend-develop
  ↓
Dashboard shows: 
  Project: "Frontend App"
  Repo: frontend
  Branch: develop
  Status: triggered → running → success
```

## Troubleshooting

### "Repository not configured in projects"

**Problem:** Webhook triggered but repository isn't registered

**Solution:**
1. Go to `/projects`
2. Check if the repository URL is added
3. Verify URL format (should match GitHub): `https://github.com/user/repo.git`
4. Test webhook in GitHub dashboard

### "Branch not configured for this repository"

**Problem:** Push to branch but webhook fails

**Solution:**
1. Go to `/projects` → select project
2. Find the repository
3. Verify the branch is listed
4. If missing, click "Remove" and "Add Repository" again with correct branches

### Private repo authentication failing

**Problem:** Jenkins job fails because it can't access private repo

**Solution:**
1. Verify PAT token is still valid (not expired)
2. Check token has `repo` scope
3. Verify Jenkins job uses the `$GIT_TOKEN` parameter
4. Test: `git clone https://$GIT_TOKEN@github.com/user/repo.git`

### Webhook secret mismatch

**Problem:** GitHub webhook shows error responses

**Solution:**
1. Verify `GITHUB_WEBHOOK_SECRET` env var matches GitHub webhook secret
2. Restart the app after changing env vars
3. Check Recent Deliveries in GitHub webhook settings

## Security Best Practices

✅ **DO:**
- Use separate PAT token per project
- Rotate tokens periodically
- Use minimal scopes (repo only)
- Store tokens in `.projects.json` (not committed to Git)
- Use HTTPS for all webhooks

❌ **DON'T:**
- Commit `.projects.json` to Git
- Share PAT tokens in messages
- Use repo-level deploy keys (use PAT instead)
- Hardcode secrets in Jenkins jobs
- Use personal GitHub account tokens (create bot account)

## Advanced: Database Persistence

The current implementation uses JSON file storage. For production, consider:

### Option 1: PostgreSQL
```typescript
// lib/projects.ts could be refactored to use:
const db = await query('SELECT * FROM projects WHERE id = $1', [projectId])
```

### Option 2: MongoDB
```typescript
const project = await Project.findById(projectId)
```

### Option 3: Firebase
```typescript
const project = await db.collection('projects').doc(projectId).get()
```

For now, JSON storage is fine for:
- Small teams (< 100 projects)
- Testing and staging
- Self-hosted instances

--- 

## Support & Questions

If you encounter issues:
1. Check troubleshooting section above
2. Review GitHub webhook Recent Deliveries
3. Check Jenkins build logs
4. Verify all branches are configured in project
5. Test webhook manually in GitHub settings

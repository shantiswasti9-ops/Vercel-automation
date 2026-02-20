# GitHub Jenkins Webhook - Setup Script (Windows)
# This script helps you configure the webhook application

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "GitHub → Jenkins Webhook Setup" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path ".env.local") {
    Write-Host "⚠️  .env.local already exists. Using existing configuration." -ForegroundColor Yellow
    Write-Host ""
    Get-Content .env.local
    Write-Host ""
    $response = Read-Host "Do you want to reconfigure? (y/n)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Skipping reconfiguration. Proceeding with existing setup."
        exit 0
    }
}

Write-Host "Step 1: GitHub Webhook Configuration" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""
Write-Host "You need a GitHub Webhook Secret for security."
Write-Host "This prevents unauthorized access to the webhook endpoint."
Write-Host ""

$githubSecret = Read-Host "Enter GitHub Webhook Secret (or press Enter to auto-generate)"

if ([string]::IsNullOrWhiteSpace($githubSecret)) {
    # Generate random secret
    $githubSecret = -join ((0x30..0x39) + (0x61..0x66) | Get-Random -Count 64 | % {[char]$_})
    Write-Host "Generated webhook secret: $githubSecret" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Jenkins Configuration" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Find these values in your Jenkins instance:"
Write-Host "- URL: typically http://localhost:8080 or https://jenkins.example.com"
Write-Host "- User: your Jenkins username"
Write-Host "- Token: Jenkins → Your Profile → API Token"
Write-Host ""

$jenkinsUrl = Read-Host "Jenkins URL (press Enter for http://localhost:8080)"
if ([string]::IsNullOrWhiteSpace($jenkinsUrl)) {
    $jenkinsUrl = "http://localhost:8080"
}

$jenkinsUser = Read-Host "Jenkins Username"

$jenkinsToken = Read-Host "Jenkins API Token"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Configuration Summary" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub Webhook Secret: ******* ($($githubSecret.Length) chars)"
Write-Host "Jenkins URL: $jenkinsUrl"
Write-Host "Jenkins User: $jenkinsUser"
Write-Host "Jenkins Token: ******* ($($jenkinsToken.Length) chars)"
Write-Host ""

$confirm = Read-Host "Confirm and save configuration? (y/n)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Configuration cancelled."
    exit 1
}

# Create .env.local
$envContent = @"
# GitHub Webhook Configuration
GITHUB_WEBHOOK_SECRET=$githubSecret

# Jenkins Configuration
JENKINS_URL=$jenkinsUrl
JENKINS_USER=$jenkinsUser
JENKINS_TOKEN=$jenkinsToken
"@

Set-Content -Path ".env.local" -Value $envContent

Write-Host "✅ Configuration saved to .env.local" -ForegroundColor Green
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the development server:"
Write-Host "   npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Open http://localhost:3000 in your browser"
Write-Host ""
Write-Host "3. Configure Jenkins jobs (see JENKINS_SETUP.md)"
Write-Host ""
Write-Host "4. Add GitHub webhook to your repositories:"
Write-Host "   - URL: http://localhost:3000/api/webhooks/github" -ForegroundColor Yellow
Write-Host "   - Secret: $githubSecret" -ForegroundColor Yellow
Write-Host "   - Events: Push events" -ForegroundColor Yellow
Write-Host ""
Write-Host "5. Deploy to Vercel (when ready):"
Write-Host "   npm i -g vercel && vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Update Vercel environment variables:"
Write-Host "   - GITHUB_WEBHOOK_SECRET: $githubSecret" -ForegroundColor Yellow
Write-Host "   - JENKINS_URL: $jenkinsUrl" -ForegroundColor Yellow
Write-Host "   - JENKINS_USER: $jenkinsUser" -ForegroundColor Yellow
Write-Host "   - JENKINS_TOKEN: <your token>" -ForegroundColor Yellow
Write-Host ""
Write-Host "For more details, see README.md and JENKINS_SETUP.md"
Write-Host ""

import { NextRequest, NextResponse } from 'next/server';
import {
  getWebhookById,
  updateWebhookLastTriggered,
} from '@/lib/webhooks';
import { storeBuildLog } from '@/lib/db';

async function triggerJenkinsJob(
  jobName: string,
  repo: string,
  branch: string,
  commit: string
): Promise<{ success: boolean; message: string }> {
  try {
    const jenkinsUrl = process.env.JENKINS_URL || 'http://localhost:8080';
    const jenkinsUser = process.env.JENKINS_USER || 'admin';
    const jenkinsToken = process.env.JENKINS_TOKEN || '';

    // Check if Jenkins is configured
    if (!jenkinsToken) {
      console.warn('⚠️ Jenkins Token not configured. Skipping Jenkins trigger.');
      return {
        success: false,
        message: 'Jenkins token not configured. Configure JENKINS_TOKEN in .env.local',
      };
    }

    // Jenkins parameterized build URL
    const buildUrl = `${jenkinsUrl}/job/${jobName}/buildWithParameters`;

    const params = new URLSearchParams({
      repo,
      branch,
      commit,
    });

    const auth = Buffer.from(`${jenkinsUser}:${jenkinsToken}`).toString('base64');

    console.log(`🔄 Triggering Jenkins job: ${jobName}`);
    console.log(`📍 Jenkins URL: ${jenkinsUrl}`);
    console.log(`📦 Repository: ${repo}, Branch: ${branch}, Commit: ${commit}`);

    const response = await fetch(`${buildUrl}?${params}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.ok) {
      console.log(`✅ Jenkins job triggered successfully!`);
      return {
        success: true,
        message: `Jenkins job '${jobName}' triggered successfully`,
      };
    } else {
      console.error(`❌ Jenkins responded with status ${response.status}`);
      const text = await response.text();
      console.error(`Response: ${text}`);
      return {
        success: false,
        message: `Jenkins returned status ${response.status}. Check Jenkins configuration.`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`❌ Failed to trigger Jenkins job: ${errorMsg}`);
    console.error('💡 Make sure Jenkins is running at JENKINS_URL with valid credentials');
    return {
      success: false,
      message: `Jenkins trigger failed: ${errorMsg}`,
    };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const webhookId = id;
    const webhook = getWebhookById(webhookId);

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    if (!webhook.isActive) {
      return NextResponse.json(
        { error: 'Webhook is inactive' },
        { status: 403 }
      );
    }

    // Check if webhook has expired
    if (webhook.expiryDate && new Date(webhook.expiryDate) < new Date()) {
      return NextResponse.json(
        { error: 'Webhook has expired' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Standard GitHub webhook payload
    const {
      event,
      repository,
      ref,
      head_commit,
      pusher,
      pull_request,
    } = body;

    // Determine branch from ref or pull request
    const branch = ref?.replace('refs/heads/', '') || pull_request?.head.ref || 'main';
    const repo = repository?.full_name || webhook.repoId || 'unknown';
    const commit = head_commit?.id || pull_request?.head.sha || 'unknown';
    const author = pusher?.name || pull_request?.user?.login || 'unknown';

    // Update webhook trigger count
    updateWebhookLastTriggered(webhookId);

    // Trigger Jenkins job if configured
    const jenkinsJobName = process.env.JENKINS_JOB || `${repo.replace('/', '-')}-${branch}`;
    const jenkinsResult = await triggerJenkinsJob(
      jenkinsJobName,
      repo,
      branch,
      commit
    );

    // Store the build log
    await storeBuildLog({
      repo,
      branch,
      commit,
      author,
      message: head_commit?.message || pull_request?.title || 'Webhook triggered',
      buildId: `build-${Date.now()}`,
      status: jenkinsResult.success ? 'triggered' : 'failed',
      timestamp: new Date(),
      jenkinsUrl: `${process.env.JENKINS_URL || 'http://localhost:8080'}/job/${jenkinsJobName}`,
      projectId: webhook.projectId,
      projectName: webhook.displayName,
    });

    return NextResponse.json(
      {
        success: true,
        webhook: webhook.displayName,
        jenkinsTriggered: jenkinsResult.success,
        jenkinsMessage: jenkinsResult.message,
        message: jenkinsResult.success
          ? 'Webhook processed and Jenkins job triggered'
          : 'Webhook processed - Jenkins job trigger may have issues (check logs)',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { triggerJenkinsBuild } from '@/lib/jenkins';
import { storeBuildLog } from '@/lib/db';

const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';

function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!GITHUB_WEBHOOK_SECRET) {
    console.warn('GITHUB_WEBHOOK_SECRET not set - webhook verification skipped');
    return true;
  }

  const hash = crypto
    .createHmac('sha256', GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  const expected = `sha256=${hash}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256') || '';
    const body = await request.text();

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const event = request.headers.get('x-github-event');

    // Only handle push events
    if (event !== 'push') {
      return NextResponse.json(
        { message: 'Event ignored - not a push event' },
        { status: 200 }
      );
    }

    const {
      repository,
      ref,
      commits,
      pusher,
      head_commit,
    } = payload;

    const branch = ref.replace('refs/heads/', '');
    const repoName = repository.name;
    const repoUrl = repository.html_url;
    const commitSha = head_commit?.id || 'unknown';
    const commitMessage = head_commit?.message || 'No message';
    const author = pusher?.name || 'Unknown';

    console.log(
      `[GitHub Webhook] Push to ${repoName}:${branch} by ${author}`
    );

    // Trigger Jenkins build
    const jobName = `${repoName}-${branch}`.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    
    const buildResult = await triggerJenkinsBuild(
      jobName,
      {
        repo: repoUrl,
        branch,
        commit: commitSha,
        message: commitMessage,
      }
    );

    // Log build event
    await storeBuildLog({
      repo: repoName,
      branch,
      commit: commitSha,
      author,
      message: commitMessage,
      buildId: buildResult.buildNumber?.toString() || 'pending',
      status: 'triggered',
      timestamp: new Date(),
      jenkinsUrl: buildResult.queueUrl || '',
    });

    return NextResponse.json(
      {
        success: true,
        repo: repoName,
        branch,
        commit: commitSha,
        buildTriggered: true,
        buildNumber: buildResult.buildNumber,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Handle GitHub webhook ping
export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: 'GitHub webhook endpoint active' },
    { status: 200 }
  );
}

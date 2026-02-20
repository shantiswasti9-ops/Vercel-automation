import { NextRequest, NextResponse } from 'next/server';
import {
  getAllWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhookById,
  isWebhookExpired,
} from '@/lib/webhooks';

export async function GET(request: NextRequest) {
  try {
    const webhooks = getAllWebhooks().map(webhook => ({
      ...webhook,
      isExpired: isWebhookExpired(webhook),
    }));

    return NextResponse.json(webhooks);
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, name, projectId, repoId, expiryDate, id, updates } = body;

    switch (action) {
      case 'create': {
        const webhook = createWebhook(name, projectId, repoId, expiryDate);
        return NextResponse.json(webhook, { status: 201 });
      }

      case 'update': {
        const webhook = updateWebhook(id, updates);
        if (!webhook) {
          return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
        }
        return NextResponse.json(webhook);
      }

      case 'delete': {
        const deleted = deleteWebhook(id);
        if (!deleted) {
          return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing webhook request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

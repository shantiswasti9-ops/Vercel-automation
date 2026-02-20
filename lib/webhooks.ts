import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Webhook {
  id: string;
  name: string;
  displayName: string;
  endpoint: string;
  projectId?: string;
  repoId?: string;
  branches: string[]; // Support multiple branches
  isActive: boolean;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  triggers: number;
}

const WEBHOOKS_FILE = join(process.cwd(), '.webhooks.json');

function loadWebhooks(): Webhook[] {
  try {
    if (existsSync(WEBHOOKS_FILE)) {
      const content = readFileSync(WEBHOOKS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error loading webhooks:', error);
  }
  return [];
}

function saveWebhooks(webhooks: Webhook[]) {
  try {
    writeFileSync(WEBHOOKS_FILE, JSON.stringify(webhooks, null, 2));
  } catch (error) {
    console.error('Error saving webhooks:', error);
    throw error;
  }
}

export function getAllWebhooks(): Webhook[] {
  return loadWebhooks();
}

export function getWebhookById(id: string): Webhook | undefined {
  const webhooks = loadWebhooks();
  return webhooks.find(w => w.id === id);
}

export function createWebhook(
  name: string,
  projectId?: string,
  repoId?: string,
  expiryDate?: string
): Webhook {
  const webhooks = loadWebhooks();
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const webhookId = `${sanitizedName}-${Date.now()}`;
  
  const webhook: Webhook = {
    id: webhookId,
    name: name,
    displayName: name,
    endpoint: `/api/webhooks/${webhookId}`,
    projectId,
    repoId,
    branches: [],
    isActive: true,
    expiryDate: expiryDate || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    triggers: 0,
  };

  webhooks.push(webhook);
  saveWebhooks(webhooks);
  return webhook;
}

export function updateWebhook(
  id: string,
  updates: Partial<Webhook>
): Webhook | undefined {
  const webhooks = loadWebhooks();
  const webhookIndex = webhooks.findIndex(w => w.id === id);

  if (webhookIndex === -1) return undefined;

  webhooks[webhookIndex] = {
    ...webhooks[webhookIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveWebhooks(webhooks);
  return webhooks[webhookIndex];
}

export function updateWebhookLastTriggered(id: string): Webhook | undefined {
  const webhook = getWebhookById(id);
  if (!webhook) return undefined;
  
  return updateWebhook(id, {
    lastTriggered: new Date().toISOString(),
    triggers: (webhook.triggers || 0) + 1,
  });
}

export function deleteWebhook(id: string): boolean {
  const webhooks = loadWebhooks();
  const filteredWebhooks = webhooks.filter(w => w.id !== id);

  if (filteredWebhooks.length === webhooks.length) return false;

  saveWebhooks(filteredWebhooks);
  return true;
}

export function getActiveWebhooks(): Webhook[] {
  const webhooks = loadWebhooks();
  return webhooks.filter(w => w.isActive && (!w.expiryDate || new Date(w.expiryDate) > new Date()));
}

export function isWebhookExpired(webhook: Webhook): boolean {
  if (!webhook.expiryDate) return false;
  return new Date(webhook.expiryDate) < new Date();
}

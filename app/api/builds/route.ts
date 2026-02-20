import { NextRequest, NextResponse } from 'next/server';
import { getBuildLogs, getStats } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get('repo') || undefined;
    const branch = searchParams.get('branch') || undefined;
    const project = searchParams.get('project') || undefined;
    const type = searchParams.get('type') || 'logs';

    if (type === 'stats') {
      const stats = await getStats();
      return NextResponse.json(stats);
    }

    const logs = await getBuildLogs(repo || undefined, branch || undefined, project || undefined);
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch builds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch builds' },
      { status: 500 }
    );
  }
}

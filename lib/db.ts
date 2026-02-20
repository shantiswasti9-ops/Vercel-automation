import fs from 'fs/promises';
import path from 'path';
import { getAllProjects } from './projects';

const BUILDS_FILE = path.join(process.cwd(), '.builds.json');

interface BuildLog {
  repo: string;
  branch: string;
  commit: string;
  author: string;
  message: string;
  buildId: string;
  status: 'triggered' | 'running' | 'success' | 'failed';
  timestamp: Date;
  jenkinsUrl: string;
  duration?: number;
  projectId?: string;
  projectName?: string;
}

let buildsCache: BuildLog[] = [];
let cacheLoaded = false;

async function loadBuilds(): Promise<BuildLog[]> {
  if (cacheLoaded) return buildsCache;

  try {
    const data = await fs.readFile(BUILDS_FILE, 'utf-8');
    buildsCache = JSON.parse(data).map((build: any) => ({
      ...build,
      timestamp: new Date(build.timestamp),
    }));
  } catch {
    buildsCache = [];
  }

  cacheLoaded = true;
  return buildsCache;
}

async function saveBuilds(): Promise<void> {
  try {
    await fs.writeFile(BUILDS_FILE, JSON.stringify(buildsCache, null, 2));
  } catch (error) {
    console.error('Failed to save builds:', error);
  }
}

export async function storeBuildLog(build: BuildLog): Promise<void> {
  await loadBuilds();
  buildsCache.unshift(build);
  // Keep only last 100 builds
  if (buildsCache.length > 100) {
    buildsCache = buildsCache.slice(0, 100);
  }
  await saveBuilds();
}

export async function getBuildLogs(
  repo?: string,
  branch?: string,
  projectId?: string
): Promise<BuildLog[]> {
  await loadBuilds();

  let filtered = buildsCache;

  if (repo) {
    filtered = filtered.filter((b) => b.repo === repo);
  }

  if (branch) {
    filtered = filtered.filter((b) => b.branch === branch);
  }

  if (projectId) {
    filtered = filtered.filter((b) => b.projectId === projectId);
  }

  return filtered;
}

export async function getStats(): Promise<{
  totalBuilds: number;
  successCount: number;
  failedCount: number;
  repos: string[];
  branches: string[];
  projects?: { id: string; name: string; count: number }[];
}> {
  await loadBuilds();

  const repos = [...new Set(buildsCache.map((b) => b.repo))];
  const branches = [...new Set(buildsCache.map((b) => b.branch))];
  const successCount = buildsCache.filter((b) => b.status === 'success').length;
  const failedCount = buildsCache.filter((b) => b.status === 'failed').length;

  // Get projects with build counts
  const projects = await getAllProjects();
  const projectsWithCounts = projects.map((project) => {
    const count = buildsCache.filter((b) => b.projectId === project.id).length;
    return {
      id: project.id,
      name: project.name,
      count,
    };
  });

  return {
    totalBuilds: buildsCache.length,
    successCount,
    failedCount,
    repos,
    branches,
    projects: projectsWithCounts,
  };
}

export async function updateBuildStatus(
  buildId: string,
  status: BuildLog['status'],
  duration?: number
): Promise<void> {
  await loadBuilds();

  const build = buildsCache.find((b) => b.buildId === buildId);
  if (build) {
    build.status = status;
    if (duration) build.duration = duration;
  }

  await saveBuilds();
}

export async function clearOldBuilds(days: number = 30): Promise<void> {
  await loadBuilds();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  buildsCache = buildsCache.filter((b) => new Date(b.timestamp) > cutoffDate);
  await saveBuilds();
}

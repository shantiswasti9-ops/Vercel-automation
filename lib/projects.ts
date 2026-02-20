import fs from 'fs/promises';
import path from 'path';

export interface ProjectConfig {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  repos: RepoConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RepoConfig {
  id: string;
  url: string;
  branches: string[];
  token?: string; // PAT token for private repos
  isPrivate: boolean;
}

const PROJECTS_FILE = path.join(process.cwd(), '.projects.json');

let projectsCache: ProjectConfig[] = [];
let projectsCacheLoaded = false;

async function loadProjects(): Promise<ProjectConfig[]> {
  if (projectsCacheLoaded) return projectsCache;

  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
    projectsCache = JSON.parse(data).map((project: any) => ({
      ...project,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    }));
  } catch {
    projectsCache = [];
  }

  projectsCacheLoaded = true;
  return projectsCache;
}

async function saveProjects(): Promise<void> {
  try {
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projectsCache, null, 2));
  } catch (error) {
    console.error('Failed to save projects:', error);
  }
}

export async function createProject(
  name: string,
  type: 'single' | 'multiple',
  repos: RepoConfig[]
): Promise<ProjectConfig> {
  await loadProjects();

  const project: ProjectConfig = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type,
    repos,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  projectsCache.unshift(project);
  await saveProjects();

  return project;
}

export async function getProject(projectId: string): Promise<ProjectConfig | undefined> {
  await loadProjects();
  return projectsCache.find((p) => p.id === projectId);
}

export async function getAllProjects(): Promise<ProjectConfig[]> {
  await loadProjects();
  return projectsCache;
}

export async function updateProject(
  projectId: string,
  updates: Partial<ProjectConfig>
): Promise<ProjectConfig | undefined> {
  await loadProjects();

  const index = projectsCache.findIndex((p) => p.id === projectId);
  if (index === -1) return undefined;

  projectsCache[index] = {
    ...projectsCache[index],
    ...updates,
    updatedAt: new Date(),
  };

  await saveProjects();
  return projectsCache[index];
}

export async function deleteProject(projectId: string): Promise<boolean> {
  await loadProjects();

  const index = projectsCache.findIndex((p) => p.id === projectId);
  if (index === -1) return false;

  projectsCache.splice(index, 1);
  await saveProjects();

  return true;
}

export async function addRepoToProject(
  projectId: string,
  repo: RepoConfig
): Promise<ProjectConfig | undefined> {
  await loadProjects();

  const project = projectsCache.find((p) => p.id === projectId);
  if (!project) return undefined;

  project.repos.push(repo);
  project.updatedAt = new Date();

  await saveProjects();
  return project;
}

export async function removeRepoFromProject(
  projectId: string,
  repoId: string
): Promise<ProjectConfig | undefined> {
  await loadProjects();

  const project = projectsCache.find((p) => p.id === projectId);
  if (!project) return undefined;

  project.repos = project.repos.filter((r) => r.id !== repoId);
  project.updatedAt = new Date();

  await saveProjects();
  return project;
}

export async function updateProjectRepo(
  projectId: string,
  repoId: string,
  updates: Partial<RepoConfig>
): Promise<ProjectConfig | undefined> {
  await loadProjects();

  const project = projectsCache.find((p) => p.id === projectId);
  if (!project) return undefined;

  const repoIndex = project.repos.findIndex((r) => r.id === repoId);
  if (repoIndex === -1) return undefined;

  project.repos[repoIndex] = {
    ...project.repos[repoIndex],
    ...updates,
  };

  project.updatedAt = new Date();
  await saveProjects();

  return project;
}

export function extractRepoName(url: string): string {
  try {
    const match = url.match(/\/([^/]+?)(\.git)?$/);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const match = url.match(/github\.com[/:]([\w-]+)\/([\w.-]+?)(?:\.git)?$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  } catch {
    return null;
  }
  return null;
}

export function findProjectByRepo(
  projects: ProjectConfig[],
  repoUrl: string
): { project: ProjectConfig; repo: RepoConfig } | undefined {
  for (const project of projects) {
    for (const repo of project.repos) {
      if (normalizeGitUrl(repo.url) === normalizeGitUrl(repoUrl)) {
        return { project, repo };
      }
    }
  }
  return undefined;
}

export function normalizeGitUrl(url: string): string {
  return url.replace(/\.git$/, '').toLowerCase().trim();
}

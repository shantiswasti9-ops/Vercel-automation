import { NextRequest, NextResponse } from 'next/server';
import {
  createProject,
  deleteProject,
  getAllProjects,
  getProject,
  updateProject,
  addRepoToProject,
  removeRepoFromProject,
  updateProjectRepo,
  RepoConfig,
} from '@/lib/projects';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (projectId) {
      const project = await getProject(projectId);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(project);
    }

    const projects = await getAllProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectId, ...data } = body;

    if (action === 'create') {
      const { name, type, repos } = data;
      const project = await createProject(name, type, repos || []);
      return NextResponse.json(project, { status: 201 });
    }

    if (action === 'update') {
      const project = await updateProject(projectId, data);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(project);
    }

    if (action === 'delete') {
      const success = await deleteProject(projectId);
      if (!success) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'addRepo') {
      const { repo } = data;
      const project = await addRepoToProject(projectId, repo);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(project);
    }

    if (action === 'removeRepo') {
      const { repoId } = data;
      const project = await removeRepoFromProject(projectId, repoId);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(project);
    }

    if (action === 'updateRepo') {
      const { repoId, updates } = data;
      const project = await updateProjectRepo(projectId, repoId, updates);
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(project);
    }

    return NextResponse.json(
      { error: 'Unknown action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Failed to process project request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

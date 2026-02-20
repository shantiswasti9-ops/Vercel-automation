'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { ProjectConfig, RepoConfig } from '@/lib/projects';

interface Project {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  repos: RepoConfig[];
  createdAt: string | Date;
  updatedAt: string | Date;
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
      title="Toggle dark/light theme"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showRepoForm, setShowRepoForm] = useState<string | null>(null);
  const [editingRepoId, setEditingRepoId] = useState<string | null>(null);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<'single' | 'multiple'>('single');
  const [repoUrl, setRepoUrl] = useState('');
  const [patToken, setPatToken] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['main']);
  const [newBranch, setNewBranch] = useState('');
  
  // Editing repo state
  const [editingPatToken, setEditingPatToken] = useState('');
  const [editingBranches, setEditingBranches] = useState<string[]>(['main']);
  const [editingNewBranch, setEditingNewBranch] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProject() {
    if (!projectName.trim()) {
      alert('Project name is required');
      return;
    }

    const repos: RepoConfig[] = [];

    if (projectType === 'single' && repoUrl.trim()) {
      repos.push({
        id: `repo_${Date.now()}`,
        url: repoUrl,
        branches: selectedBranches,
        token: isPrivate ? patToken : undefined,
        isPrivate,
      });
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: projectName,
          type: projectType,
          repos,
        }),
      });

      if (res.ok) {
        setProjectName('');
        setProjectType('single');
        setRepoUrl('');
        setPatToken('');
        setIsPrivate(false);
        setSelectedBranches(['main']);
        setShowForm(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project');
    }
  }

  async function handleAddRepo(projectId: string) {
    if (!repoUrl.trim()) {
      alert('Repository URL is required');
      return;
    }

    if (selectedBranches.length === 0) {
      alert('At least one branch is required');
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addRepo',
          projectId,
          repo: {
            id: `repo_${Date.now()}`,
            url: repoUrl,
            branches: selectedBranches,
            token: isPrivate ? patToken : undefined,
            isPrivate,
          },
        }),
      });

      if (res.ok) {
        setRepoUrl('');
        setPatToken('');
        setIsPrivate(false);
        setSelectedBranches(['main']);
        setShowRepoForm(null);
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to add repo:', error);
      alert('Failed to add repository');
    }
  }

  async function handleUpdateProject() {
    if (!editingProject) return;
    
    if (!projectName.trim()) {
      alert('Project name is required');
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          projectId: editingProject.id,
          name: projectName,
        }),
      });

      if (res.ok) {
        setEditingProject(null);
        setProjectName('');
        setProjectType('single');
        setRepoUrl('');
        setSelectedBranches(['main']);
        setShowForm(false);
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      alert('Failed to update project');
    }
  }

  async function handleUpdateRepo(projectId: string, repoId: string) {
    if (!editingProject) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRepo',
          projectId,
          repoId,
          branches: editingBranches,
          token: editingPatToken || undefined,
        }),
      });

      if (res.ok) {
        setEditingRepoId(null);
        setEditingPatToken('');
        setEditingBranches(['main']);
        setEditingNewBranch('');
        fetchProjects();
        // Update the editingProject with the new data
        const updatedProjects = await fetch('/api/projects').then(r => r.json());
        const updated = updatedProjects.find((p: Project) => p.id === projectId);
        if (updated) setEditingProject(updated);
      }
    } catch (error) {
      console.error('Failed to update repo:', error);
      alert('Failed to update repository');
    }
  }

  async function handleDeleteProject(projectId: string) {
    if (!confirm('Delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          projectId,
        }),
      });

      if (res.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    }
  }

  async function handleRemoveRepo(projectId: string, repoId: string) {
    if (!confirm('Remove this repository?')) {
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removeRepo',
          projectId,
          repoId,
        }),
      });

      if (res.ok) {
        fetchProjects();
      }
    } catch (error) {
      console.error('Failed to remove repo:', error);
    }
  }

  function addBranch(projectId?: string) {
    if (!newBranch.trim()) return;

    if (!selectedBranches.includes(newBranch)) {
      setSelectedBranches([...selectedBranches, newBranch]);
    }
    setNewBranch('');
  }

  function removeBranch(branch: string) {
    setSelectedBranches(selectedBranches.filter((b) => b !== branch));
  }

  function addEditingBranch() {
    if (!editingNewBranch.trim()) return;

    if (!editingBranches.includes(editingNewBranch)) {
      setEditingBranches([...editingBranches, editingNewBranch]);
    }
    setEditingNewBranch('');
  }

  function removeEditingBranch(branch: string) {
    setEditingBranches(editingBranches.filter((b) => b !== branch));
  }

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Projects</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage repositories and branches to monitor
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              ← Dashboard
            </Link>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingProject(null);
                setProjectName('');
                setProjectType('single');
                setRepoUrl('');
                setSelectedBranches(['main']);
              }}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              {showForm && !editingProject ? 'Cancel' : '+ New Project'}
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Create/Edit Project Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h2>

            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Application"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Project Type - Only for new projects */}
              {!editingProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Project Type
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="single"
                        checked={projectType === 'single'}
                        onChange={(e) => setProjectType('single')}
                        className="w-4 h-4"
                      />
                      <span className="ml-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Single Repository
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          One repo with multiple branches
                        </p>
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="multiple"
                        checked={projectType === 'multiple'}
                        onChange={(e) => setProjectType('multiple')}
                        className="w-4 h-4"
                      />
                      <span className="ml-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Multiple Repositories
                        </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Multiple repos each with multiple branches
                        </p>
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Edit Mode: Show existing repos */}
              {editingProject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                    Repositories & Branches
                  </label>
                  <div className="space-y-3 max-h-96 overflow-y-auto bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    {editingProject.repos.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-sm">No repositories</p>
                    ) : (
                      editingProject.repos.map((repo) => (
                        <div key={repo.id} className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-700">
                          {editingRepoId === repo.id ? (
                            // Edit mode for this repo
                            <div className="space-y-3">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm mb-2 break-all">
                                  {repo.url}
                                </p>
                              </div>

                              {/* PAT Token Update */}
                              {repo.isPrivate && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Update PAT Token (if expired)
                                  </label>
                                  <input
                                    type="password"
                                    value={editingPatToken}
                                    onChange={(e) => setEditingPatToken(e.target.value)}
                                    placeholder="Leave empty to keep current token"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                  />
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Only enter if your PAT token has expired
                                  </p>
                                </div>
                              )}

                              {/* Branches Edit */}
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Branches
                                </label>
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="text"
                                    value={editingNewBranch}
                                    onChange={(e) => setEditingNewBranch(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') addEditingBranch();
                                    }}
                                    placeholder="Add branch..."
                                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                  />
                                  <button
                                    onClick={addEditingBranch}
                                    className="px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                                  >
                                    Add
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  {editingBranches.map((branch) => (
                                    <div
                                      key={branch}
                                      className="flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded text-xs"
                                    >
                                      {branch}
                                      <button
                                        onClick={() => removeEditingBranch(branch)}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <button
                                  onClick={() => handleUpdateRepo(editingProject.id, repo.id)}
                                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingRepoId(null);
                                    setEditingPatToken('');
                                    setEditingBranches(['main']);
                                    setEditingNewBranch('');
                                  }}
                                  className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View mode for this repo
                            <>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm break-all">
                                    {repo.url}
                                  </p>
                                  <div className="flex gap-2 mt-1">
                                    {repo.isPrivate && (
                                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                                        🔒 Private
                                      </span>
                                    )}
                                    {repo.token && (
                                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                                        ✓ PAT Set
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-2">
                                  <button
                                    onClick={() => {
                                      setEditingRepoId(repo.id);
                                      setEditingPatToken('');
                                      setEditingBranches(repo.branches);
                                      setEditingNewBranch('');
                                    }}
                                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                                    title="Edit repository"
                                  >
                                    ✎ Edit
                                  </button>
                                  <button
                                    onClick={() => handleRemoveRepo(editingProject.id, repo.id)}
                                    className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm"
                                    title="Remove repository"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                                <p className="text-xs font-medium text-gray-800 dark:text-gray-100 mb-2">
                                  Branches: {repo.branches.join(', ')}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 Use the Edit button to update PAT tokens (when expired) or modify branches
                  </p>
                </div>
              )}

              {/* Create Mode: Show repo/branch inputs */}
              {!editingProject && projectType === 'single' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Repository URL
                    </label>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/username/repo.git"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Can be added later if multiple repos
                    </p>
                  </div>

                  {/* Private Repo */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      This is a private repository
                    </span>
                  </label>

                  {/* PAT Token */}
                  {isPrivate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Personal Access Token (PAT)
                      </label>
                      <input
                        type="password"
                        value={patToken}
                        onChange={(e) => setPatToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        GitHub PAT with repo access. Will not be displayed after save.
                      </p>
                    </div>
                  )}

                  {/* Branches */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Branches to Monitor
                    </label>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newBranch}
                          onChange={(e) => setNewBranch(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addBranch();
                            }
                          }}
                          placeholder="main, develop, staging..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => addBranch()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedBranches.map((branch) => (
                          <div
                            key={branch}
                            className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm"
                          >
                            {branch}
                            <button
                              onClick={() => removeBranch(branch)}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={editingProject ? handleUpdateProject : handleCreateProject}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  {editingProject ? 'Update Project' : 'Create Project'}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingProject(null);
                    setProjectName('');
                    setProjectType('single');
                    setRepoUrl('');
                    setSelectedBranches(['main']);
                  }}
                  className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Projects List */}
        <div className="space-y-6">
          {projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-12 text-center border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No projects yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create a project to start monitoring repositories
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div 
                key={project.id} 
                className={`rounded-lg shadow overflow-hidden cursor-pointer transition-all ${
                  editingProject?.id === project.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                }`}
              >
                {/* Project Header */}
                <div className="flex items-start justify-between p-6 bg-gray-50 dark:bg-gray-800 border-b dark:border-b-gray-700">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {project.name}
                    </h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                      <span>
                        Type: <strong>{project.type === 'single' ? 'Single Repo' : 'Multiple Repos'}</strong>
                      </span>
                      <span>
                        Repos: <strong>{project.repos.length}</strong>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingProject(project);
                        setProjectName(project.name);
                        setShowForm(true);
                      }}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      ✎ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-sm font-medium transition"
                    >
                      🗑 Delete
                    </button>
                  </div>
                </div>

                {/* Repositories */}
                <div className="p-6 space-y-4">
                  {project.repos.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No repositories added yet</p>
                  ) : (
                    project.repos.map((repo) => (
                      <div
                        key={repo.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {repo.url}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {repo.isPrivate && (
                                <span className="inline-block bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded">
                                  🔒 Private
                                </span>
                              )}
                              {repo.token && (
                                <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs px-2 py-1 rounded">
                                  ✓ PAT Token Set
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveRepo(project.id, repo.id)
                            }
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm transition"
                          >
                            Remove
                          </button>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Branches:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {repo.branches.map((branch) => (
                              <span
                                key={branch}
                                className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded"
                              >
                                {branch}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Add Repository Button (for multiple type) */}
                  {project.type === 'multiple' && (
                    <div>
                      {showRepoForm === project.id ? (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                            Add Repository
                          </h4>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Repository URL
                              </label>
                              <input
                                type="text"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/username/repo.git"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>

                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="w-4 h-4"
                              />
                              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                This is a private repository
                              </span>
                            </label>

                            {isPrivate && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                  Personal Access Token (PAT)
                                </label>
                                <input
                                  type="password"
                                  value={patToken}
                                  onChange={(e) => setPatToken(e.target.value)}
                                  placeholder="ghp_xxxxxxxxxxxx"
                                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Branches
                              </label>
                              <div className="flex gap-2 mb-3">
                                <input
                                  type="text"
                                  value={newBranch}
                                  onChange={(e) => setNewBranch(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      addBranch();
                                    }
                                  }}
                                  placeholder="main, develop..."
                                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                  onClick={() => addBranch()}
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                                >
                                  Add
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {selectedBranches.map((branch) => (
                                  <div
                                    key={branch}
                                    className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm"
                                  >
                                    {branch}
                                    <button
                                      onClick={() => removeBranch(branch)}
                                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-3">
                              <button
                                onClick={() =>
                                  handleAddRepo(project.id)
                                }
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                              >
                                Add Repository
                              </button>
                              <button
                                onClick={() => {
                                  setShowRepoForm(null);
                                  setRepoUrl('');
                                  setPatToken('');
                                  setSelectedBranches(['main']);
                                }}
                                className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-700 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowRepoForm(project.id)}
                          className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 transition"
                        >
                          + Add Repository
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

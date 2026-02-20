'use client';

import { useEffect, useState } from 'react';
import { ProjectConfig, RepoConfig } from '@/lib/projects';

interface Project extends ProjectConfig {
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showRepoForm, setShowRepoForm] = useState<string | null>(null);

  // Form state
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState<'single' | 'multiple'>('single');
  const [repoUrl, setRepoUrl] = useState('');
  const [patToken, setPatToken] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>(['main']);
  const [newBranch, setNewBranch] = useState('');

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

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600">
              Manage repositories and branches to monitor
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingProject(null);
              setProjectName('');
              setProjectType('single');
              setRepoUrl('');
              setSelectedBranches(['main']);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        </div>

        {/* Create Project Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Create New Project
            </h2>

            <div className="space-y-6">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Application"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Project Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      <span className="font-medium text-gray-900">
                        Single Repository
                      </span>
                      <p className="text-sm text-gray-600">
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
                      <span className="font-medium text-gray-900">
                        Multiple Repositories
                      </span>
                      <p className="text-sm text-gray-600">
                        Multiple repos each with multiple branches
                      </p>
                    </span>
                  </label>
                </div>
              </div>

              {/* Repository URL (for single type) */}
              {projectType === 'single' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Repository URL
                    </label>
                    <input
                      type="text"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      placeholder="https://github.com/username/repo.git"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
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
                    <span className="ml-2 text-sm text-gray-700">
                      This is a private repository
                    </span>
                  </label>

                  {/* PAT Token */}
                  {isPrivate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Personal Access Token (PAT)
                      </label>
                      <input
                        type="password"
                        value={patToken}
                        onChange={(e) => setPatToken(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        GitHub PAT with repo access. Will not be displayed after save.
                      </p>
                    </div>
                  )}

                  {/* Branches */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          onClick={() => addBranch()}
                          className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {selectedBranches.map((branch) => (
                          <div
                            key={branch}
                            className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            {branch}
                            <button
                              onClick={() => removeBranch(branch)}
                              className="text-blue-600 hover:text-blue-800"
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
                  onClick={handleCreateProject}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Create Project
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400"
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
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects yet
              </h3>
              <p className="text-gray-600">
                Create a project to start monitoring repositories
              </p>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Project Header */}
                <div className="flex items-start justify-between p-6 bg-gray-50 border-b">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {project.name}
                    </h3>
                    <div className="flex gap-4 mt-2 text-sm text-gray-600">
                      <span>
                        Type: <strong>{project.type === 'single' ? 'Single Repo' : 'Multiple Repos'}</strong>
                      </span>
                      <span>
                        Repos: <strong>{project.repos.length}</strong>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>

                {/* Repositories */}
                <div className="p-6 space-y-4">
                  {project.repos.length === 0 ? (
                    <p className="text-gray-500 text-sm">No repositories added yet</p>
                  ) : (
                    project.repos.map((repo) => (
                      <div
                        key={repo.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {repo.url}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {repo.isPrivate && (
                                <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                  🔒 Private
                                </span>
                              )}
                              {repo.token && (
                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                  ✓ PAT Token Set
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleRemoveRepo(project.id, repo.id)
                            }
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            Branches:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {repo.branches.map((branch) => (
                              <span
                                key={branch}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
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
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                          <h4 className="font-medium text-gray-900 mb-4">
                            Add Repository
                          </h4>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Repository URL
                              </label>
                              <input
                                type="text"
                                value={repoUrl}
                                onChange={(e) => setRepoUrl(e.target.value)}
                                placeholder="https://github.com/username/repo.git"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="w-4 h-4"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                This is a private repository
                              </span>
                            </label>

                            {isPrivate && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Personal Access Token (PAT)
                                </label>
                                <input
                                  type="password"
                                  value={patToken}
                                  onChange={(e) => setPatToken(e.target.value)}
                                  placeholder="ghp_xxxxxxxxxxxx"
                                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => addBranch()}
                                  className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                                >
                                  Add
                                </button>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {selectedBranches.map((branch) => (
                                  <div
                                    key={branch}
                                    className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                                  >
                                    {branch}
                                    <button
                                      onClick={() => removeBranch(branch)}
                                      className="text-blue-600 hover:text-blue-800"
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
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
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
                                className="flex-1 bg-gray-300 text-gray-900 py-2 rounded-lg hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowRepoForm(project.id)}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400"
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

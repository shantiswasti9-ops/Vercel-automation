'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface BuildLog {
  repo: string;
  branch: string;
  commit: string;
  author: string;
  message: string;
  buildId: string;
  status: 'triggered' | 'running' | 'success' | 'failed';
  timestamp: string;
  jenkinsUrl: string;
  duration?: number;
  projectId?: string;
  projectName?: string;
}

interface Stats {
  totalBuilds: number;
  successCount: number;
  failedCount: number;
  repos: string[];
  branches: string[];
  projects?: { id: string; name: string; count: number }[];
}

export default function Dashboard() {
  const [builds, setBuilds] = useState<BuildLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [selectedProject, selectedRepo, selectedBranch]);

  async function fetchData() {
    try {
      const params = new URLSearchParams();
      if (selectedProject) params.append('project', selectedProject);
      if (selectedRepo) params.append('repo', selectedRepo);
      if (selectedBranch) params.append('branch', selectedBranch);

      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/builds?${params}`),
        fetch('/api/builds?type=stats'),
      ]);

      const logsData = await logsRes.json();
      const statsData = await statsRes.json();

      setBuilds(logsData || []);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'triggered':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'unknown';
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              GitHub → Jenkins Pipeline
            </h1>
            <p className="text-gray-600">
              Auto-triggered builds on repository push events
            </p>
          </div>
          <Link
            href="/projects"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            ⚙️ Manage Projects
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Total Builds</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalBuilds}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Success</div>
              <div className="text-3xl font-bold text-green-600">
                {stats.successCount}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Failed</div>
              <div className="text-3xl font-bold text-red-600">
                {stats.failedCount}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600">Repositories</div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.repos.length}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setSelectedRepo('');
                    setSelectedBranch('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Projects</option>
                  {stats.projects?.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.count})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repository
                </label>
                <select
                  value={selectedRepo}
                  onChange={(e) => {
                    setSelectedRepo(e.target.value);
                    setSelectedBranch('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Repositories</option>
                  {stats.repos.map((repo) => (
                    <option key={repo} value={repo}>
                      {repo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Branches</option>
                  {stats.branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Build History */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Build History
            </h2>
          </div>
          <div className="overflow-x-auto">
            {builds.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No builds found.{' '}
                <Link href="/projects" className="text-blue-600 hover:underline">
                  Create a project
                </Link>{' '}
                and push to a repository to trigger a build.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Repo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Commit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {builds.map((build) => (
                    <tr key={build.buildId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {build.projectName || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {build.repo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {build.branch}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600">
                        <a
                          href={build.jenkinsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-xs inline-block"
                        >
                          {build.commit.slice(0, 7)}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {build.author}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            build.status
                          )}`}
                        >
                          {build.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatTime(build.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📋 Getting Started
          </h3>
          <div className="text-blue-800 space-y-2 text-sm">
            <p>
              <strong>1. Create a Project:</strong>{' '}
              <Link href="/projects" className="text-blue-600 hover:underline">
                Go to Projects
              </Link>{' '}
              and add your repositories
            </p>
            <p>
              <strong>2. Configure GitHub Webhooks:</strong> Add webhooks to your repositories pointing to
              <code className="bg-white px-2 py-1 rounded ml-1">
                /api/webhooks/github
              </code>
            </p>
            <p>
              <strong>3. Create Jenkins Jobs:</strong> Create a parameterized job for each repo+branch combination
            </p>
            <p>
              <strong>4. Monitor Builds:</strong> Push code and watch builds appear here in real-time
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

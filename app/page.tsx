'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useTheme } from 'next-themes';

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

export default function Dashboard() {
  const [builds, setBuilds] = useState<BuildLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedRepo, setSelectedRepo] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [webhookCopied, setWebhookCopied] = useState(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showWebhookForm, setShowWebhookForm] = useState(false);
  const [webhookName, setWebhookName] = useState<string>('');
  const [webhookProjectId, setWebhookProjectId] = useState<string>('');
  const [webhookRepoId, setWebhookRepoId] = useState<string>('');
  const [webhookExpiryDate, setWebhookExpiryDate] = useState<string>('');
  const [testWebhookId, setTestWebhookId] = useState<string>('');
  const [testRepo, setTestRepo] = useState<string>('github.com/user/repo');
  const [testBranch, setTestBranch] = useState<string>('main');
  const [testCommit, setTestCommit] = useState<string>('');
  const [testAuthor, setTestAuthor] = useState<string>('test-user');
  const [testMessage, setTestMessage] = useState<string>('Test commit via webhook');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const [editingWebhookId, setEditingWebhookId] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editProjectId, setEditProjectId] = useState<string>('');
  const [editRepoId, setEditRepoId] = useState<string>('');
  const [editBranches, setEditBranches] = useState<string[]>([]);
  const [editExpiryDate, setEditExpiryDate] = useState<string>('');

  // Get repos and branches from selected project
  const projectRepos: any[] = selectedProject
    ? projects.find(p => p.id === selectedProject)?.repos || []
    : stats?.repos || [];
  
  const repoBranches: string[] = selectedRepo && selectedProject
    ? projectRepos.find((r: any) => r.url === selectedRepo)?.branches || []
    : stats?.branches || [];

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);

    // Refresh data when user comes back to the page (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedProject, selectedRepo, selectedBranch]);

  async function fetchData() {
    try {
      const params = new URLSearchParams();
      if (selectedProject) params.append('project', selectedProject);
      if (selectedRepo) params.append('repo', selectedRepo);
      if (selectedBranch) params.append('branch', selectedBranch);

      const [logsRes, statsRes, projectsRes, webhooksRes] = await Promise.all([
        fetch(`/api/builds?${params}`),
        fetch('/api/builds?type=stats'),
        fetch('/api/projects'),
        fetch('/api/webhooks'),
      ]);

      const logsData = await logsRes.json();
      const statsData = await statsRes.json();
      const projectsData = await projectsRes.json();
      const webhooksData = await webhooksRes.json();

      setBuilds(logsData || []);
      setStats(statsData);
      setProjects(projectsData || []);
      setWebhooks(webhooksData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'running':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
      case 'triggered':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700';
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'unknown';
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/github`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(webhookUrl).then(() => {
        setWebhookCopied(true);
        setTimeout(() => setWebhookCopied(false), 2000);
      }).catch(() => {
        fallbackCopy(webhookUrl);
      });
    } else {
      fallbackCopy(webhookUrl);
    }
  };

  const fallbackCopy = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setWebhookCopied(true);
      setTimeout(() => setWebhookCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
    document.body.removeChild(textarea);
  };

  const createNewWebhook = async () => {
    if (!webhookName.trim()) {
      alert('Please enter a webhook name');
      return;
    }

    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: webhookName,
          projectId: webhookProjectId || undefined,
          repoId: webhookRepoId || undefined,
          expiryDate: webhookExpiryDate || undefined,
        }),
      });

      if (!response.ok) throw new Error('Failed to create webhook');

      const newWebhook = await response.json();
      setWebhooks([...webhooks, newWebhook]);
      setWebhookName('');
      setWebhookProjectId('');
      setWebhookRepoId('');
      setWebhookExpiryDate('');
      setShowWebhookForm(false);
    } catch (error) {
      console.error('Error creating webhook:', error);
      alert('Failed to create webhook');
    }
  };

  const deleteWebhookItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });

      if (!response.ok) throw new Error('Failed to delete webhook');

      setWebhooks(webhooks.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting webhook:', error);
      alert('Failed to delete webhook');
    }
  };

  const toggleWebhookStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id,
          updates: { isActive: !isActive },
        }),
      });

      if (!response.ok) throw new Error('Failed to update webhook');

      setWebhooks(webhooks.map(w => (w.id === id ? { ...w, isActive: !isActive } : w)));
    } catch (error) {
      console.error('Error updating webhook:', error);
      alert('Failed to update webhook');
    }
  };

  const isWebhookExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const triggerTestWebhook = async () => {
    if (!testWebhookId) {
      alert('Please select a webhook to test');
      return;
    }

    setTestLoading(true);
    setTestResult('');

    try {
      // Generate a random commit hash if not provided
      const commit = testCommit || Math.random().toString(36).substring(7);

      const payload = {
        action: 'opened',
        repository: {
          full_name: testRepo,
        },
        ref: `refs/heads/${testBranch}`,
        head_commit: {
          id: commit,
          message: testMessage,
        },
        pusher: {
          name: testAuthor,
        },
      };

      const response = await fetch(`/api/webhooks/${testWebhookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        const jenkinsStatus = data.jenkinsTriggered ? '✅ Triggered' : '⚠️ Not triggered';
        const message = data.jenkinsMessage || (data.jenkinsTriggered ? 'Success' : 'Check configuration');
        setTestResult(`✅ Webhook Success!\n\nJenkins: ${jenkinsStatus}\n${message}\n\nBuild will appear shortly...`);
        // Refresh data to show the new build
        setTimeout(() => fetchData(), 1500);
      } else {
        setTestResult(`❌ Error: ${data.error || 'Failed to trigger webhook'}`);
      }
    } catch (error) {
      console.error('Error triggering webhook:', error);
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Failed to trigger webhook'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const startEditingWebhook = (webhook: any) => {
    setEditingWebhookId(webhook.id);
    setEditName(webhook.displayName);
    setEditProjectId(webhook.projectId || '');
    setEditRepoId(webhook.repoId || '');
    setEditBranches(webhook.branches || []);
    setEditExpiryDate(webhook.expiryDate || '');
  };

  const cancelEditingWebhook = () => {
    setEditingWebhookId('');
    setEditName('');
    setEditProjectId('');
    setEditRepoId('');
    setEditBranches([]);
    setEditExpiryDate('');
  };

  const saveWebhookEdit = async () => {
    if (!editName.trim()) {
      alert('Please enter a webhook name');
      return;
    }

    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          id: editingWebhookId,
          updates: {
            displayName: editName,
            projectId: editProjectId || undefined,
            repoId: editRepoId || undefined,
            branches: editBranches,
            expiryDate: editExpiryDate || undefined,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to update webhook');

      const updatedWebhook = await response.json();
      setWebhooks(webhooks.map(w => (w.id === editingWebhookId ? updatedWebhook : w)));
      cancelEditingWebhook();
    } catch (error) {
      console.error('Error updating webhook:', error);
      alert('Failed to update webhook');
    }
  };

  const addBranchToEdit = () => {
    if (editBranches.length === 0) {
      setEditBranches(['main']);
    } else {
      setEditBranches([...editBranches, '']);
    }
  };

  const removeBranchFromEdit = (index: number) => {
    setEditBranches(editBranches.filter((_, i) => i !== index));
  };

  const updateBranchInEdit = (index: number, value: string) => {
    const newBranches = [...editBranches];
    newBranches[index] = value;
    setEditBranches(newBranches);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              GitHub → Jenkins Pipeline
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Auto-triggered builds on repository push events
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setLoading(true);
                fetchData().finally(() => setLoading(false));
              }}
              className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              title="Refresh builds and projects"
            >
              🔄 Refresh
            </button>
            <Link
              href="/projects"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              ⚙️ Manage Projects
            </Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Builds</div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalBuilds}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">Success</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats.successCount}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats.failedCount}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <div className="text-sm text-gray-600 dark:text-gray-400">Repositories</div>
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.repos.length}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {stats && (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setSelectedRepo('');
                    setSelectedBranch('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Repository
                </label>
                <select
                  value={selectedRepo}
                  onChange={(e) => {
                    setSelectedRepo(e.target.value);
                    setSelectedBranch('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Repositories</option>
                  {selectedProject
                    ? projectRepos.map((repo: any) => (
                        <option key={repo.url} value={repo.url}>
                          {repo.url}
                        </option>
                      ))
                    : stats?.repos.map((repo) => (
                        <option key={repo} value={repo}>
                          {repo}
                        </option>
                      ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Branch
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">All Branches</option>
                  {selectedProject && selectedRepo
                    ? repoBranches.map((branch: any) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))
                    : stats?.branches.map((branch) => (
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
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow dark:shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Build History
            </h2>
          </div>
          <div className="overflow-x-auto">
            {builds.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No builds found.{' '}
                <Link href="/projects" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                  Create a project
                </Link>{' '}
                and push to a repository to trigger a build.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Project
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Repo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Commit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {builds.map((build) => (
                    <tr key={build.buildId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {build.projectName || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {build.repo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 rounded text-xs">
                          {build.branch}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                        <a
                          href={build.jenkinsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-xs inline-block"
                        >
                          {build.commit.slice(0, 7)}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
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
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatTime(build.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Webhook Configuration */}
        <div className="mt-8 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-300 mb-4">
            🔗 Webhook Configuration
          </h3>
          
          {/* Webhook URL Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-purple-800 dark:text-purple-200 mb-2">
              Generic Webhook URL (Use Individual Webhook URLs Below)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={
                  typeof window !== 'undefined'
                    ? `${process.env.NEXT_PUBLIC_WEBHOOK_DOMAIN || window.location.origin}/api/webhooks/[webhook-id]`
                    : '/api/webhooks/[webhook-id]'
                }
                className="flex-1 px-4 py-2 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-lg text-purple-900 dark:text-purple-100 font-mono text-sm"
              />
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
              Replace [webhook-id] with your specific webhook ID from the Manage Webhooks section below
            </p>
          </div>

          {/* Integration Instructions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-3">Integration Steps</h4>
            <div className="space-y-3 text-sm text-purple-800 dark:text-purple-200">
              <div>
                <strong className="block mb-1">📌 GitHub Setup:</strong>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
                  <li>Go to your repository → Settings → Webhooks</li>
                  <li>Click "Add webhook"</li>
                  <li>Paste the webhook URL above</li>
                  <li>Select "application/json" content type</li>
                  <li>Select "Push events" and "Pull request events"</li>
                  <li>Click "Add webhook"</li>
                </ol>
              </div>
              
              <div>
                <strong className="block mb-1">🚀 Jenkins Setup:</strong>
                <ol className="list-decimal list-inside space-y-1 ml-2 text-xs">
                  <li>Create a parameterized job for each repository/branch</li>
                  <li>Add parameters: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">repo</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">branch</code>, <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs">commit</code></li>
                  <li>Configure SCM with these parameters</li>
                  <li>Webhooks will trigger Jenkins jobs automatically on push</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Manage Webhooks */}
        <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">
              📦 Manage Webhooks
            </h3>
            <button
              onClick={() => setShowWebhookForm(!showWebhookForm)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg font-medium transition"
            >
              {showWebhookForm ? 'Cancel' : '+ New Webhook'}
            </button>
          </div>

          {/* Create Webhook Form */}
          {showWebhookForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-300 mb-4">Create New Webhook</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                    Webhook Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., My Repository Webhook"
                    value={webhookName}
                    onChange={(e) => setWebhookName(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-green-300 dark:border-green-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      Project (Optional)
                    </label>
                    <select
                      value={webhookProjectId}
                      onChange={(e) => {
                        setWebhookProjectId(e.target.value);
                        setWebhookRepoId('');
                      }}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-green-300 dark:border-green-700 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="">Select Project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                      Repository (Optional)
                    </label>
                    <select
                      value={webhookRepoId}
                      onChange={(e) => setWebhookRepoId(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-green-300 dark:border-green-700 rounded-lg text-gray-900 dark:text-white"
                    >
                      <option value="">Select Repository</option>
                      {webhookProjectId && projects.find(p => p.id === webhookProjectId)?.repos?.map((r: any) => (
                        <option key={r.url} value={r.url}>{r.url}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={webhookExpiryDate}
                    onChange={(e) => setWebhookExpiryDate(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-green-300 dark:border-green-700 rounded-lg text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Leave empty for no expiry
                  </p>
                </div>

                <button
                  onClick={createNewWebhook}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded-lg font-medium transition"
                >
                  Create Webhook
                </button>
              </div>
            </div>
          )}

          {/* Webhooks List */}
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-green-700 dark:text-green-300">
              <p className="mb-2">No webhooks created yet</p>
              <p className="text-sm">Create your first webhook to get started</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {webhooks.map(webhook => {
                const isExpired = isWebhookExpired(webhook.expiryDate);
                const projectName = webhook.projectId ? projects.find(p => p.id === webhook.projectId)?.name : 'All Projects';
                
                return (
                  <div
                    key={webhook.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 ${
                      isExpired
                        ? 'border-red-300 dark:border-red-700 opacity-75'
                        : webhook.isActive
                        ? 'border-green-300 dark:border-green-700'
                        : 'border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className={`font-semibold text-lg ${
                          isExpired
                            ? 'text-red-700 dark:text-red-400'
                            : webhook.isActive
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-gray-700 dark:text-gray-400'
                        }`}>
                          {webhook.displayName}
                          {isExpired && <span className="ml-2 text-xs bg-red-100 dark:bg-red-900 px-2 py-1 rounded text-red-700 dark:text-red-300">Expired</span>}
                          {!webhook.isActive && <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">Inactive</span>}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditingWebhook(webhook)}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition"
                        >
                          ✎ Edit
                        </button>
                        <button
                          onClick={() => toggleWebhookStatus(webhook.id, webhook.isActive)}
                          className={`px-3 py-1 rounded text-xs font-medium transition ${
                            webhook.isActive
                              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {webhook.isActive ? '✓ Active' : '○ Inactive'}
                        </button>
                        <button
                          onClick={() => deleteWebhookItem(webhook.id)}
                          className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {editingWebhookId === webhook.id ? (
                      // Edit Mode
                      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Webhook Name
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Project
                            </label>
                            <select
                              value={editProjectId}
                              onChange={(e) => {
                                setEditProjectId(e.target.value);
                                setEditRepoId('');
                              }}
                              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                            >
                              <option value="">Select Project</option>
                              {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Repository
                            </label>
                            <select
                              value={editRepoId}
                              onChange={(e) => setEditRepoId(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                            >
                              <option value="">Select Repository</option>
                              {editProjectId && projects.find(p => p.id === editProjectId)?.repos?.map((r: any) => (
                                <option key={r.url} value={r.url}>{r.url}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Branches (Multiple)
                          </label>
                          <div className="space-y-2">
                            {editBranches.map((branch, idx) => (
                              <div key={idx} className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g., main, develop, feature/*"
                                  value={branch}
                                  onChange={(e) => updateBranchInEdit(idx, e.target.value)}
                                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm"
                                />
                                <button
                                  onClick={() => removeBranchFromEdit(idx)}
                                  className="px-3 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={addBranchToEdit}
                              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              + Add Branch
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Add multiple branches - webhook will trigger for all of them on the same repository
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Expiry Date (Optional)
                          </label>
                          <input
                            type="date"
                            value={editExpiryDate}
                            onChange={(e) => setEditExpiryDate(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={saveWebhookEdit}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded font-medium text-sm transition"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEditingWebhook}
                            className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded font-medium text-sm transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className="space-y-2 text-sm">
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>Status:</strong> {webhook.isActive ? 'Active' : 'Inactive'}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>Project:</strong> {projectName}
                      </p>
                      {webhook.repoId && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>Repository:</strong> {webhook.repoId}
                        </p>
                      )}
                      {webhook.branches && webhook.branches.length > 0 && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>Branches:</strong> {webhook.branches.join(', ')}
                        </p>
                      )}
                      <p className="text-gray-600 dark:text-gray-400">
                        <strong>Triggers:</strong> {webhook.triggers || 0} {webhook.triggers === 1 ? 'time' : 'times'}
                      </p>
                      {webhook.expiryDate && (
                        <p className={`${
                          isExpired
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          <strong>Expires:</strong> {formatDate(webhook.expiryDate)} {isExpired && '(Expired)'}
                        </p>
                      )}
                      {webhook.lastTriggered && (
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>Last Triggered:</strong> {formatTime(webhook.lastTriggered)}
                        </p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Webhook URL:</strong>
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={
                              typeof window !== 'undefined'
                                ? `${process.env.NEXT_PUBLIC_WEBHOOK_DOMAIN || window.location.origin}${webhook.endpoint}`
                                : webhook.endpoint
                            }
                            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 font-mono text-xs"
                          />
                          <button
                            onClick={() => {
                              const url = `${
                                typeof window !== 'undefined'
                                  ? process.env.NEXT_PUBLIC_WEBHOOK_DOMAIN || window.location.origin
                                  : ''
                              }${webhook.endpoint}`;
                              if (navigator.clipboard && navigator.clipboard.writeText) {
                                navigator.clipboard.writeText(url).then(() => {
                                  alert('Webhook URL copied to clipboard!');
                                }).catch(() => {
                                  const textarea = document.createElement('textarea');
                                  textarea.value = url;
                                  document.body.appendChild(textarea);
                                  textarea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textarea);
                                  alert('Webhook URL copied to clipboard!');
                                });
                              }
                            }}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white rounded font-medium text-xs transition"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Use this URL in your GitHub webhook settings
                        </p>
                      </div>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Test Webhook Section - Local Testing */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
            🧪 Test Webhook (Local Testing - No Internet Required)
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Select Webhook to Test *
              </label>
              <select
                value={testWebhookId}
                onChange={(e) => setTestWebhookId(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">Choose a webhook...</option>
                {webhooks.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.displayName} {!w.isActive ? '(Inactive)' : ''} {isWebhookExpired(w.expiryDate) ? '(Expired)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Repository
                </label>
                <input
                  type="text"
                  placeholder="github.com/user/repo"
                  value={testRepo}
                  onChange={(e) => setTestRepo(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  placeholder="main"
                  value={testBranch}
                  onChange={(e) => setTestBranch(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Commit Hash (Optional - will auto-generate)
                </label>
                <input
                  type="text"
                  placeholder="abc123def456"
                  value={testCommit}
                  onChange={(e) => setTestCommit(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  placeholder="test-user"
                  value={testAuthor}
                  onChange={(e) => setTestAuthor(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Commit Message
              </label>
              <textarea
                placeholder="Test commit via webhook"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-blue-300 dark:border-blue-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 h-20"
              />
            </div>

            <button
              onClick={triggerTestWebhook}
              disabled={testLoading || !testWebhookId}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testLoading ? 'Testing...' : '🚀 Trigger Test Webhook'}
            </button>

            {testResult && (
              <div className={`p-4 rounded-lg text-sm ${
                testResult.includes('✅')
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'
              }`}>
                {testResult}
              </div>
            )}

            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <p><strong>💡 How to use:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Select a webhook from the dropdown</li>
                <li>Fill in repository, branch, and commit details (or use defaults)</li>
                <li>Click "Trigger Test Webhook" to simulate a GitHub push</li>
                <li>View the result immediately</li>
                <li>Check Build History to see the triggered build</li>
                <li>No internet connection required!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300 mb-3">
            📋 Getting Started
          </h3>
          <div className="text-indigo-800 dark:text-indigo-200 space-y-2 text-sm">
            <p>
              <strong>1. Create a Project:</strong>{' '}
              <Link href="/projects" className="text-indigo-600 hover:underline dark:text-indigo-400">
                Go to Projects
              </Link>{' '}
              and add your repositories
            </p>
            <p>
              <strong>2. Configure GitHub Webhooks:</strong> Use the webhook URL above to configure webhooks in your GitHub repositories
            </p>
            <p>
              <strong>3. Create Jenkins Jobs:</strong> Create parameterized jobs that match your repository/branch structure
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

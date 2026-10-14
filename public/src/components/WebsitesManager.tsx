// ==============================================================================
// Component: WebsitesManager.tsx
// Purpose: ATC Native Managed Web Hosting & In-Portal File Manager
//          - 1-Click WordPress & Static Website Engine
//          - In-Portal File Explorer with Drag-and-Drop & Code Editor
//          - Database Credentials & Backups
//          - Custom Domain & Automated SSL Binding
// ==============================================================================

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Plus,
  RefreshCw,
  Folder,
  FileText,
  FileCode,
  FolderPlus,
  FilePlus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Database,
  Lock,
  Power,
  ChevronRight,
  ArrowLeft,
  Save,
  X,
  Copy,
  Check,
  Server,
  Zap,
  HardDrive,
  Eye,
  EyeOff,
  Code2,
  Terminal,
} from 'lucide-react';
import { apiCall } from '../services/api';
import { useToast } from './Toast';
import WebConsoleModal from './WebConsoleModal';
import { formatDateTime } from '../utils/dateFormatter';

interface ManagedWebsite {
  id: number;
  name: string;
  primaryDomain: string;
  stagingDomain: string;
  appType: string;
  phpVersion: string;
  status: string;
  port: number | null;
  dbName: string | null;
  dbUser: string | null;
  dbPassword: string | null;
  wpAdminUser: string | null;
  wpAdminPassword: string | null;
  sslStatus: string;
  diskUsageMb: number;
  bandwidthUsageMb: number;
  bandwidthLimitMb: number;
  createdAt: string;
}

interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  modifiedAt: string;
  extension: string;
}

export default function WebsitesManager() {
  const { toast } = useToast();
  const [sites, setSites] = useState<ManagedWebsite[]>([]);
  const [loading, setLoading] = useState(true);

  // Active modal states
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [deployName, setDeployName] = useState('');
  const [deployAppType, setDeployAppType] = useState('WORDPRESS');
  const [deployCustomDomain, setDeployCustomDomain] = useState('');
  const [deployLoading, setDeployLoading] = useState(false);

  // Active view: 'list' or 'site-details'
  const [selectedSite, setSelectedSite] = useState<ManagedWebsite | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'database' | 'domain'>('overview');

  // File Manager states
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [editingFile, setEditingFile] = useState<{ path: string; content: string } | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);

  // Copy helper state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Developer Web Console state
  const [consoleSite, setConsoleSite] = useState<ManagedWebsite | null>(null);

  // Fetch Sites
  const fetchSites = async () => {
    try {
      setLoading(true);
      const res = await apiCall('/sites');
      setSites(res.sites || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch websites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Fetch Files
  const fetchFiles = async (siteId: number, path = '') => {
    try {
      setFilesLoading(true);
      const res = await apiCall(`/sites/${siteId}/files?path=${encodeURIComponent(path)}`);
      setFiles(res.items || []);
      setCurrentPath(res.currentPath || '');
    } catch (err: any) {
      toast.error(err.message || 'Failed to list files');
    } finally {
      setFilesLoading(false);
    }
  };

  // When switching to files tab
  useEffect(() => {
    if (selectedSite && activeTab === 'files') {
      fetchFiles(selectedSite.id, currentPath);
    }
  }, [selectedSite, activeTab]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success('Copied to clipboard');
  };

  // Deploy Site
  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deployName.trim()) {
      toast.warning('Please enter a website name');
      return;
    }

    try {
      setDeployLoading(true);
      const res = await apiCall('/sites', {
        method: 'POST',
        body: JSON.stringify({
          name: deployName.trim(),
          appType: deployAppType,
          customDomain: deployCustomDomain.trim() || undefined,
        }),
      });

      toast.success(res.message || 'Website created successfully!');
      setIsDeployOpen(false);
      setDeployName('');
      setDeployCustomDomain('');
      fetchSites();
    } catch (err: any) {
      toast.error(err.message || 'Failed to deploy website');
    } finally {
      setDeployLoading(false);
    }
  };

  // Power action
  const handlePowerAction = async (siteId: number, action: string) => {
    try {
      const res = await apiCall(`/sites/${siteId}/power`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      toast.success(res.message || 'Power action executed');
      setSites((prev) => prev.map((s) => (s.id === siteId ? res.site : s)));
      if (selectedSite && selectedSite.id === siteId) {
        setSelectedSite(res.site);
      }
    } catch (err: any) {
      toast.error(err.message || 'Power action failed');
    }
  };

  // Delete site
  const handleDeleteSite = async (siteId: number) => {
    if (!confirm('Are you sure you want to permanently delete this website and all its files?')) return;
    try {
      await apiCall(`/sites/${siteId}`, { method: 'DELETE' });
      toast.success('Website deleted successfully');
      if (selectedSite && selectedSite.id === siteId) {
        setSelectedSite(null);
      }
      fetchSites();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete website');
    }
  };

  // File Manager Actions
  const handleOpenFile = async (item: FileItem) => {
    if (!selectedSite) return;
    if (item.isDirectory) {
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      fetchFiles(selectedSite.id, newPath);
    } else {
      try {
        setEditorLoading(true);
        const filePath = currentPath ? `${currentPath}/${item.name}` : item.name;
        const res = await apiCall(`/sites/${selectedSite.id}/files/content?path=${encodeURIComponent(filePath)}`);
        setEditingFile({ path: filePath, content: res.content });
      } catch (err: any) {
        toast.error(err.message || 'Cannot open file');
      } finally {
        setEditorLoading(false);
      }
    }
  };

  const handleSaveFile = async () => {
    if (!selectedSite || !editingFile) return;
    try {
      setEditorLoading(true);
      await apiCall(`/sites/${selectedSite.id}/files/content`, {
        method: 'PUT',
        body: JSON.stringify({
          path: editingFile.path,
          content: editingFile.content,
        }),
      });
      toast.success('File saved successfully');
      setEditingFile(null);
      fetchFiles(selectedSite.id, currentPath);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save file');
    } finally {
      setEditorLoading(false);
    }
  };

  const handleDeleteFile = async (item: FileItem) => {
    if (!selectedSite) return;
    if (!confirm(`Are you sure you want to delete ${item.name}?`)) return;
    const targetPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    try {
      await apiCall(`/sites/${selectedSite.id}/files?path=${encodeURIComponent(targetPath)}`, {
        method: 'DELETE',
      });
      toast.success('Deleted successfully');
      fetchFiles(selectedSite.id, currentPath);
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const handleCreateItem = async (isDirectory: boolean, name: string) => {
    if (!selectedSite || !name.trim()) return;
    try {
      await apiCall(`/sites/${selectedSite.id}/files/create`, {
        method: 'POST',
        body: JSON.stringify({
          path: currentPath,
          name: name.trim(),
          isDirectory,
        }),
      });
      toast.success(`${isDirectory ? 'Folder' : 'File'} created`);
      setShowNewFolderModal(false);
      setShowNewFileModal(false);
      setNewFolderName('');
      setNewFileName('');
      fetchFiles(selectedSite.id, currentPath);
    } catch (err: any) {
      toast.error(err.message || 'Creation failed');
    }
  };

  const navigateBreadcrumb = (index: number, parts: string[]) => {
    if (!selectedSite) return;
    if (index === -1) {
      fetchFiles(selectedSite.id, '');
    } else {
      const target = parts.slice(0, index + 1).join('/');
      fetchFiles(selectedSite.id, target);
    }
  };

  const pathParts = currentPath ? currentPath.split('/').filter(Boolean) : [];

  // ==========================================
  // RENDER: SITE DETAILS VIEW
  // ==========================================
  if (selectedSite) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
        {/* Back and Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedSite(null)}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Back to websites list"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">
                  {selectedSite.name}
                </h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  selectedSite.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  ● {selectedSite.status}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  {selectedSite.appType === 'WORDPRESS' ? 'WordPress 6.7' : 'Static HTML5'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>Domain: <strong>{selectedSite.primaryDomain}</strong></span>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> SSL Secured
                </span>
                {selectedSite.port && (
                  <>
                    <span>&bull;</span>
                    <a
                      href={`http://172.27.47.192:${selectedSite.port}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <ExternalLink className="w-3 h-3" /> Direct Preview (Port {selectedSite.port})
                    </a>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href={selectedSite.port ? `http://172.27.47.192:${selectedSite.port}` : `http://${selectedSite.primaryDomain}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Visit Website
            </a>
            <button
              onClick={() => setConsoleSite(selectedSite)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Open Developer Container Terminal Sandbox"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" /> Web Console
            </button>
            <button
              onClick={() => handlePowerAction(selectedSite.id, selectedSite.status === 'ACTIVE' ? 'STOP' : 'START')}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title={selectedSite.status === 'ACTIVE' ? 'Stop Site' : 'Start Site'}
            >
              <Power className={`w-4 h-4 ${selectedSite.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'}`} />
            </button>
            <button
              onClick={() => handleDeleteSite(selectedSite.id)}
              className="p-2 border border-rose-200 dark:border-rose-900/50 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors"
              title="Delete Website"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Overview & Credentials
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'files'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Folder className="w-4 h-4" /> File Manager
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-4 h-4" /> Database
          </button>
          <button
            onClick={() => setActiveTab('domain')}
            className={`pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'domain'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Globe className="w-4 h-4" /> Domain & SSL
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Web Space Allocation</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{selectedSite.diskUsageMb} MB</span>
                  <span className="text-xs text-slate-500">/ 10,000 MB NVMe</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(selectedSite.diskUsageMb / 10000) * 100}%` }} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Bandwidth Quota</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">{(selectedSite.bandwidthUsageMb / 1024).toFixed(1)} GB</span>
                  <span className="text-xs text-slate-500">/ 50 GB Monthly</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '4%' }} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Stack Acceleration</span>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <span>PHP Runtime:</span>
                    <strong className="text-slate-900 dark:text-white">PHP {selectedSite.phpVersion} (FPM)</strong>
                  </div>
                  <div className="flex justify-between py-1 text-slate-600 dark:text-slate-300">
                    <span>Reverse Proxy:</span>
                    <strong className="text-blue-600">Nginx / Edge Gateway</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* WordPress Admin Access Card */}
            {selectedSite.appType === 'WORDPRESS' && (
              <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border border-blue-900/40 rounded-2xl p-6 text-white shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-lg">
                      W
                    </div>
                    <div>
                      <h3 className="font-bold text-base font-poppins">WordPress Admin Credentials</h3>
                      <p className="text-xs text-slate-400">Manage your theme, plugins, and posts inside the WordPress Dashboard</p>
                    </div>
                  </div>
                  <a
                    href={selectedSite.port ? `http://172.27.47.192:${selectedSite.port}/wp-admin` : `http://${selectedSite.primaryDomain}/wp-admin`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
                  >
                    Open WP Admin <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Username</span>
                      <p className="font-mono font-bold text-xs text-white">{selectedSite.wpAdminUser || 'admin'}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedSite.wpAdminUser || 'admin', 'wp-user')}
                      className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                    >
                      {copiedKey === 'wp-user' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Password</span>
                      <p className="font-mono font-bold text-xs text-white">
                        {showPasswords['wp-pass'] ? selectedSite.wpAdminPassword : '••••••••••••••••'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowPasswords((p) => ({ ...p, 'wp-pass': !p['wp-pass'] }))}
                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                      >
                        {showPasswords['wp-pass'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(selectedSite.wpAdminPassword || '', 'wp-pass')}
                        className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
                      >
                        {copiedKey === 'wp-pass' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* DNS Setup Guidance Banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 text-xs">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                    Connecting Your Domain: <span className="text-amber-600 dark:text-amber-400 font-mono">{selectedSite.primaryDomain}</span>
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    If your browser shows <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded text-[11px] font-mono text-amber-800 dark:text-amber-200">ERR_NAME_NOT_RESOLVED</code>, it means this custom domain does not have a DNS record pointed to your server yet.
                  </p>
                  <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 font-mono text-[11px] space-y-1 mt-2">
                    <div className="text-slate-500">Go to your domain registrar (GoDaddy, Namecheap, Cloudflare) and create:</div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Type: <span className="text-slate-800 dark:text-slate-200">A</span> &nbsp;|&nbsp; 
                      Host: <span className="text-slate-800 dark:text-slate-200">{selectedSite.primaryDomain.split('.')[0]}</span> &nbsp;|&nbsp; 
                      Points to: <span className="text-blue-600 dark:text-blue-400">172.27.47.192</span>
                    </div>
                  </div>
                  {selectedSite.port && (
                    <p className="text-slate-500 dark:text-slate-400 pt-1">
                      💡 <strong>Instant Preview Available:</strong> You can test and build your website right now using the direct preview URL:{' '}
                      <a
                        href={`http://172.27.47.192:${selectedSite.port}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 font-bold underline"
                      >
                        http://172.27.47.192:{selectedSite.port}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: IN-PORTAL FILE MANAGER */}
        {activeTab === 'files' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            {/* File Manager Toolbar */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/60">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono overflow-x-auto py-1">
                <button
                  onClick={() => navigateBreadcrumb(-1, [])}
                  className="hover:text-blue-600 dark:hover:text-blue-400 font-bold"
                >
                  public_html
                </button>
                {pathParts.map((part, idx) => (
                  <React.Fragment key={idx}>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <button
                      onClick={() => navigateBreadcrumb(idx, pathParts)}
                      className={`hover:text-blue-600 font-semibold ${
                        idx === pathParts.length - 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : ''
                      }`}
                    >
                      {part}
                    </button>
                  </React.Fragment>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowNewFileModal(true)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                >
                  <FilePlus className="w-3.5 h-3.5 text-blue-600" /> New File
                </button>
                <button
                  onClick={() => setShowNewFolderModal(true)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-amber-500" /> New Folder
                </button>
                <button
                  onClick={() => fetchFiles(selectedSite.id, currentPath)}
                  disabled={filesLoading}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600"
                  title="Refresh Directory"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${filesLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* File Listing Table */}
            {filesLoading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Folder className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs">This directory is empty</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="py-3 px-5">Name</th>
                      <th className="py-3 px-5">Size</th>
                      <th className="py-3 px-5">Last Modified</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {files.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                        onDoubleClick={() => handleOpenFile(item)}
                      >
                        <td className="py-3 px-5 flex items-center gap-3">
                          {item.isDirectory ? (
                            <Folder className="w-4 h-4 text-amber-500 shrink-0 fill-amber-500/20" />
                          ) : item.extension === 'php' || item.extension === 'html' || item.extension === 'js' ? (
                            <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span
                            onClick={() => handleOpenFile(item)}
                            className="font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {item.name}
                          </span>
                        </td>
                        <td className="py-3 px-5 font-mono text-slate-500 text-[11px]">
                          {item.isDirectory ? '-' : `${(item.size / 1024).toFixed(1)} KB`}
                        </td>
                        <td className="py-3 px-5 text-slate-400 text-[11px]">
                          {formatDateTime(item.modifiedAt)}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {!item.isDirectory && (
                              <button
                                onClick={() => handleOpenFile(item)}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-lg hover:bg-blue-100"
                              >
                                Edit Code
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFile(item)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DATABASE */}
        {activeTab === 'database' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white font-poppins">Managed MariaDB / MySQL Center</h3>
                <p className="text-xs text-slate-500">Dedicated schema running on ATC high-performance NVMe database cluster</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold text-xs rounded-full">
                ● Connection Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Database Name</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">{selectedSite.dbName}</span>
                  <button onClick={() => copyToClipboard(selectedSite.dbName || '', 'db-name')} className="text-slate-400 hover:text-blue-600">
                    {copiedKey === 'db-name' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Database Host</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">localhost (Port 3306)</span>
                  <button onClick={() => copyToClipboard('localhost', 'db-host')} className="text-slate-400 hover:text-blue-600">
                    {copiedKey === 'db-host' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Database Username</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">{selectedSite.dbUser}</span>
                  <button onClick={() => copyToClipboard(selectedSite.dbUser || '', 'db-user')} className="text-slate-400 hover:text-blue-600">
                    {copiedKey === 'db-user' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Database Password</span>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100">
                    {showPasswords['db-pass'] ? selectedSite.dbPassword : '••••••••••••••••'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setShowPasswords((p) => ({ ...p, 'db-pass': !p['db-pass'] }))} className="text-slate-400 hover:text-slate-600">
                      {showPasswords['db-pass'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => copyToClipboard(selectedSite.dbPassword || '', 'db-pass')} className="text-slate-400 hover:text-blue-600">
                      {copiedKey === 'db-pass' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DOMAIN & SSL */}
        {activeTab === 'domain' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white font-poppins">Domain Configuration & SSL</h3>
              <p className="text-xs text-slate-500">Connect a custom domain or use your free ATC staging address</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Free Staging Address</span>
                  <p className="font-mono font-bold text-sm text-slate-800 dark:text-slate-100 mt-0.5">{selectedSite.stagingDomain}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400">
                  Active
                </span>
              </div>

              <div className="p-5 border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>Automated Let's Encrypt SSL Active</span>
                </div>
                <p className="text-xs text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                  All traffic to this site is encrypted with TLS 1.3. HTTPS certificates renew automatically every 90 days with zero downtime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CODE EDITOR MODAL */}
        {editingFile && (
          <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-[85vh] overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-600" />
                  <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                    {editingFile.path}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveFile}
                    disabled={editorLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> {editorLoading ? 'Saving...' : 'Save File'}
                  </button>
                  <button
                    onClick={() => setEditingFile(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <textarea
                value={editingFile.content}
                onChange={(e) => setEditingFile({ ...editingFile, content: e.target.value })}
                className="flex-1 w-full p-4 font-mono text-xs bg-slate-950 text-emerald-400 border-none outline-none resize-none leading-relaxed selection:bg-blue-600 selection:text-white"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* NEW FOLDER MODAL */}
        {showNewFolderModal && (
          <div className="fixed inset-0 z-[130] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create New Folder</h3>
              <input
                type="text"
                placeholder="e.g. assets"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateItem(true, newFolderName)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Create Folder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NEW FILE MODAL */}
        {showNewFileModal && (
          <div className="fixed inset-0 z-[130] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Create New File</h3>
              <input
                type="text"
                placeholder="e.g. style.css"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowNewFileModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateItem(false, newFileName)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  Create File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: SITES LISTING VIEW
  // ==========================================
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-poppins">
              Websites & Applications
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300">
              High-Density Cloud Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deploy 1-click WordPress websites and cloud applications with in-portal file and database management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSites}
            disabled={loading}
            className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsDeployOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Deploy Website
          </button>
        </div>
      </div>

      {/* Sites Grid */}
      {loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-10 h-10 border-3 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
        </div>
      ) : sites.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No websites deployed yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Create your first 1-click WordPress site or static web application with automated SSL and built-in database management.
            </p>
          </div>
          <button
            onClick={() => setIsDeployOpen(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Deploy First Website
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs hover:border-blue-500/60 transition-all flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center shrink-0">
                      {site.appType === 'WORDPRESS' ? (
                        <span className="font-extrabold text-base">W</span>
                      ) : (
                        <Globe className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm font-poppins line-clamp-1">
                        {site.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {site.appType === 'WORDPRESS' ? 'WordPress 6.7' : 'Static HTML5'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    site.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    ● {site.status}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Domain:</span>
                    <a
                      href={`http://${site.primaryDomain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {site.primaryDomain.length > 22 ? site.primaryDomain.substring(0, 22) + '...' : site.primaryDomain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>SSL Certificate:</span>
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Active
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500">
                    <span>NVMe Storage:</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{site.diskUsageMb} MB</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedSite(site);
                    setActiveTab('overview');
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all text-center shadow-xs cursor-pointer"
                >
                  Manage Site
                </button>
                <button
                  onClick={() => {
                    setSelectedSite(site);
                    setActiveTab('files');
                  }}
                  className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="File Manager"
                >
                  <Folder className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePowerAction(site.id, site.status === 'ACTIVE' ? 'STOP' : 'START')}
                  className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title={site.status === 'ACTIVE' ? 'Stop Site' : 'Start Site'}
                >
                  <Power className={`w-4 h-4 ${site.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-400'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DEPLOY WEBSITE MODAL */}
      {isDeployOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-poppins">
                    Deploy 1-Click Website
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Automated web provisioning with free staging URL and SSL
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDeployOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeploySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Website Name / Project Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. My Agency Portfolio"
                  value={deployName}
                  onChange={(e) => setDeployName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
                />
              </div>

              {/* Stack Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Application Stack
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeployAppType('WORDPRESS')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      deployAppType === 'WORDPRESS'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                        W
                      </span>
                      <strong className="text-xs font-bold">WordPress 6.7</strong>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      1-Click setup with pre-configured MariaDB and PHP 8.3 FPM
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeployAppType('STATIC_HTML')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      deployAppType === 'STATIC_HTML'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Code2 className="w-5 h-5 text-emerald-500" />
                      <strong className="text-xs font-bold">Static HTML5</strong>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Instant clean web directory for uploading HTML, CSS & JS
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Custom Domain <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. mycompany.com (leave blank for free ATC staging address)"
                  value={deployCustomDomain}
                  onChange={(e) => setDeployCustomDomain(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDeployOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deployLoading || !deployName.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {deployLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Provisioning...
                    </>
                  ) : (
                    'Create Website'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Developer Sandbox Web Console Modal */}
      {consoleSite && (
        <WebConsoleModal
          siteId={consoleSite.id}
          siteName={consoleSite.name}
          onClose={() => setConsoleSite(null)}
        />
      )}
    </div>
  );
}

// ==============================================================================
// Component: ConnectionGuideModal.tsx
// Purpose: Interactive connection guide for Linux/Mac Terminal, PuTTY & Web Console
// ==============================================================================

import React, { useState } from 'react';
import { Terminal, Copy, Check, X, Shield, ExternalLink, Laptop, KeyRound } from 'lucide-react';

interface ConnectionGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  vm: {
    name: string;
    ip: string;
    adminUser?: string;
    adminPassword?: string;
    os?: string;
  };
  onOpenWebConsole: () => void;
}

export default function ConnectionGuideModal({
  isOpen,
  onClose,
  vm,
  onOpenWebConsole,
}: ConnectionGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'ssh' | 'putty' | 'web'>('ssh');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const username = vm.adminUser || 'ubuntu';
  const ip = vm.ip || '172.19.124.110';
  const sshCommand = `ssh ${username}@${ip}`;
  const sshKeyCommand = `ssh -i ~/.ssh/id_rsa ${username}@${ip}`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-500/40 rounded-xl text-blue-400">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-poppins">Connect to Virtual Machine</h3>
              <p className="text-xs text-slate-400">
                Instance: <span className="text-white font-mono">{vm.name}</span> ({ip})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('ssh')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'ssh'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" /> OpenSSH (Linux/Mac/PowerShell)
          </button>
          <button
            onClick={() => setActiveTab('putty')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'putty'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" /> PuTTY (Windows GUI)
          </button>
          <button
            onClick={() => setActiveTab('web')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'web'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" /> Web Console (Browser)
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-4">
          {activeTab === 'ssh' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  1. Standard SSH Command (Password Auth)
                </label>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-xs flex items-center justify-between border border-slate-800">
                  <span className="truncate">{sshCommand}</span>
                  <button
                    onClick={() => copyToClipboard(sshCommand, 'ssh1')}
                    className="ml-2 text-slate-400 hover:text-white shrink-0 p-1 rounded hover:bg-slate-800 flex items-center gap-1 text-[11px]"
                  >
                    {copiedCmd === 'ssh1' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  2. SSH Key Authentication
                </label>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-xs flex items-center justify-between border border-slate-800">
                  <span className="truncate">{sshKeyCommand}</span>
                  <button
                    onClick={() => copyToClipboard(sshKeyCommand, 'ssh2')}
                    className="ml-2 text-slate-400 hover:text-white shrink-0 p-1 rounded hover:bg-slate-800 flex items-center gap-1 text-[11px]"
                  >
                    {copiedCmd === 'ssh2' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-blue-600" /> Host Fingerprint Verification
                </span>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  On your first connection, accept the host key verification by typing <strong className="font-mono">yes</strong> and enter your password.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'putty' && (
            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Host Name (or IP):</span>
                  <strong className="font-mono text-slate-900">{ip}</strong>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Port:</span>
                  <strong className="font-mono text-slate-900">22</strong>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Connection type:</span>
                  <strong className="text-slate-900">SSH</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Admin User:</span>
                  <strong className="font-mono text-slate-900">{username}</strong>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Open PuTTY, enter the IP above into <strong>Host Name</strong>, ensure Port is <strong>22</strong>, and click <strong>Open</strong>. When prompted for login, type <span className="font-mono font-semibold">{username}</span> and enter your password.
              </p>
            </div>
          )}

          {activeTab === 'web' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Interactive Browser Terminal</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Connect instantly to {vm.name} right inside your web browser without downloading any external software or opening local ports.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenWebConsole();
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                <Terminal className="w-4 h-4" /> Launch In-Browser Console
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

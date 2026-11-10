const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'public', 'src', 'pages', 'Dashboard.tsx');
let code = fs.readFileSync(dashPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Update instance table action buttons (lines 2002-2114)
const tableActionsTarget = `                                  <>
                                {/* POWER BUTTON */}
                                <button
                                  onClick={(e) =>
                                    handlePowerAction(
                                      inst.vmId,
                                      inst.status === 'running' ? 'STOP' : 'START',
                                      e
                                    )
                                  }
                                  disabled={actionLoadingId === inst.vmId}
                                  title={inst.status === 'running' ? 'Power Off' : 'Power On'}
                                  className={\`p-1.5 rounded-lg border transition-all cursor-pointer \${
                                    inst.status === 'running'
                                      ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-800'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 hover:border-emerald-200 dark:hover:border-emerald-800'
                                  }\`}
                                >
                                  <Power className={\`w-3.5 h-3.5 \${actionLoadingId === inst.vmId ? 'animate-spin' : ''}\`} />
                                </button>

                                {/* REBOOT BUTTON */}
                                <button
                                  onClick={(e) => handlePowerAction(inst.vmId, 'RESTART', e)}
                                  disabled={actionLoadingId === inst.vmId}
                                  title="Reboot / Restart Server"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-200 dark:hover:border-amber-800 transition-all cursor-pointer"
                                >
                                  <RefreshCw className={\`w-3.5 h-3.5 \${actionLoadingId === inst.vmId ? 'animate-spin' : ''}\`} />
                                </button>

                                {/* PAUSE / RESUME BUTTON */}
                                <button
                                  onClick={(e) => handlePowerAction(inst.vmId, inst.status === 'paused' ? 'RESUME' : 'PAUSE', e)}
                                  disabled={actionLoadingId === inst.vmId || inst.status === 'stopped'}
                                  title={inst.status === 'paused' ? 'Resume Server' : 'Pause Server'}
                                  className={\`p-1.5 rounded-lg border transition-all \${
                                    inst.status === 'stopped'
                                      ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400'
                                      : inst.status === 'paused'
                                      ? 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer'
                                  }\`}
                                >
                                  {inst.status === 'paused' ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-indigo-500" />}
                                </button>

                                {/* SSH CONNECTION GUIDE BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConnectGuideVm(inst);
                                  }}
                                  title="SSH Connection Guide (Terminal / PuTTY)"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                {/* WEB TERMINAL / WINDOWS DESKTOP BUTTON */}
                                {inst.status === 'running' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenConsoleOrDesktop(inst);
                                    }}
                                    title={inst.os?.toLowerCase().includes('win') ? "Open Windows Desktop (Separate Screen)" : "Open In-Browser Web Console Terminal"}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-200 dark:border-sky-800 transition-all cursor-pointer"
                                  >
                                    {inst.os?.toLowerCase().includes('win') ? (
                                      <Monitor className="w-3.5 h-3.5 text-sky-500" />
                                    ) : (
                                      <Terminal className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}

                                {/* 1-CLICK APPS MARKETPLACE BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMarketplaceTargetVmId(inst.vmId);
                                    setActiveTab('marketplace');
                                  }}
                                  title="Install 1-Click Marketplace Apps on this VM"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer"
                                >
                                  <Boxes className="w-3.5 h-3.5" />
                                </button>

                                {/* RESIZE SPECS BUTTON */}
                                <button
                                  onClick={(e) => openResizeModal(inst, e)}
                                  title="Scale CPU & RAM Specs"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                                  </>
                                )}
                                
                                {/* DELETE ACTION BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingInstance(inst);
                                  }}
                                  title="Terminate / Destroy Server"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>`;

const tableActionsReplacement = `                                  currentMemberRole === 'viewer' ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none" title="Viewer role: Read-only monitoring (CIA Security Policy)">
                                      <Eye className="w-3.5 h-3.5" /> Read-Only
                                    </span>
                                  ) : (
                                  <>
                                {/* POWER BUTTON */}
                                <button
                                  onClick={(e) =>
                                    handlePowerAction(
                                      inst.vmId,
                                      inst.status === 'running' ? 'STOP' : 'START',
                                      e
                                    )
                                  }
                                  disabled={actionLoadingId === inst.vmId}
                                  title={inst.status === 'running' ? 'Power Off' : 'Power On'}
                                  className={\`p-1.5 rounded-lg border transition-all cursor-pointer \${
                                    inst.status === 'running'
                                      ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 hover:border-rose-200 dark:hover:border-rose-800'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 hover:border-emerald-200 dark:hover:border-emerald-800'
                                  }\`}
                                >
                                  <Power className={\`w-3.5 h-3.5 \${actionLoadingId === inst.vmId ? 'animate-spin' : ''}\`} />
                                </button>

                                {/* REBOOT BUTTON */}
                                <button
                                  onClick={(e) => handlePowerAction(inst.vmId, 'RESTART', e)}
                                  disabled={actionLoadingId === inst.vmId}
                                  title="Reboot / Restart Server"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-200 dark:hover:border-amber-800 transition-all cursor-pointer"
                                >
                                  <RefreshCw className={\`w-3.5 h-3.5 \${actionLoadingId === inst.vmId ? 'animate-spin' : ''}\`} />
                                </button>

                                {/* PAUSE / RESUME BUTTON */}
                                <button
                                  onClick={(e) => handlePowerAction(inst.vmId, inst.status === 'paused' ? 'RESUME' : 'PAUSE', e)}
                                  disabled={actionLoadingId === inst.vmId || inst.status === 'stopped'}
                                  title={inst.status === 'paused' ? 'Resume Server' : 'Pause Server'}
                                  className={\`p-1.5 rounded-lg border transition-all \${
                                    inst.status === 'stopped'
                                      ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400'
                                      : inst.status === 'paused'
                                      ? 'border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer'
                                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800 cursor-pointer'
                                  }\`}
                                >
                                  {inst.status === 'paused' ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-indigo-500" />}
                                </button>

                                {/* SSH CONNECTION GUIDE BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConnectGuideVm(inst);
                                  }}
                                  title="SSH Connection Guide (Terminal / PuTTY)"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                {/* WEB TERMINAL / WINDOWS DESKTOP BUTTON */}
                                {inst.status === 'running' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenConsoleOrDesktop(inst);
                                    }}
                                    title={inst.os?.toLowerCase().includes('win') ? "Open Windows Desktop (Separate Screen)" : "Open In-Browser Web Console Terminal"}
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:border-sky-200 dark:hover:border-sky-800 transition-all cursor-pointer"
                                  >
                                    {inst.os?.toLowerCase().includes('win') ? (
                                      <Monitor className="w-3.5 h-3.5 text-sky-500" />
                                    ) : (
                                      <Terminal className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                )}

                                {/* 1-CLICK APPS MARKETPLACE BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMarketplaceTargetVmId(inst.vmId);
                                    setActiveTab('marketplace');
                                  }}
                                  title="Install 1-Click Marketplace Apps on this VM"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all cursor-pointer"
                                >
                                  <Boxes className="w-3.5 h-3.5" />
                                </button>

                                {/* RESIZE SPECS BUTTON (Only Owner & Admin) */}
                                {(currentMemberRole === 'owner' || currentMemberRole === 'admin') && (
                                  <button
                                    onClick={(e) => openResizeModal(inst, e)}
                                    title="Scale CPU & RAM Specs"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* DELETE ACTION BUTTON (Only Owner & Admin) */}
                                {(currentMemberRole === 'owner' || currentMemberRole === 'admin') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeletingInstance(inst);
                                    }}
                                    title="Terminate / Destroy Server"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                  </>
                                )}`;

if (!code.includes(tableActionsTarget)) {
  console.error('tableActionsTarget not found in Dashboard.tsx!');
  process.exit(1);
}
code = code.replace(tableActionsTarget, tableActionsReplacement);

// 2. In drawer password copy button
const drawerPassTarget = `                    <div className="flex items-center gap-1.5 font-mono">
                      <strong className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {selectedInstance.os?.toLowerCase().includes('win') && !selectedInstance.adminPassword ? 'None (Direct)' : (drawerShowPassword ? (selectedInstance.adminPassword || 'root') : '••••••••')}
                      </strong>
                      <button
                        onClick={() => setDrawerShowPassword(!drawerShowPassword)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title={drawerShowPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {drawerShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedInstance.adminPassword || 'root');
                          setCopiedDrawerPassword(true);
                          setTimeout(() => setCopiedDrawerPassword(false), 2000);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="Copy Password"
                      >
                        {copiedDrawerPassword ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>`;

const drawerPassReplacement = `                    <div className="flex items-center gap-1.5 font-mono">
                      {currentMemberRole === 'viewer' ? (
                        <span className="text-slate-400 font-mono text-xs italic">Protected (Viewer role)</span>
                      ) : (
                        <>
                          <strong className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                            {selectedInstance.os?.toLowerCase().includes('win') && !selectedInstance.adminPassword ? 'None (Direct)' : (drawerShowPassword ? (selectedInstance.adminPassword || 'root') : '••••••••')}
                          </strong>
                          <button
                            onClick={() => setDrawerShowPassword(!drawerShowPassword)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title={drawerShowPassword ? 'Hide Password' : 'Show Password'}
                          >
                            {drawerShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedInstance.adminPassword || 'root');
                              setCopiedDrawerPassword(true);
                              setTimeout(() => setCopiedDrawerPassword(false), 2000);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedDrawerPassword ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                    </div>`;

if (!code.includes(drawerPassTarget)) {
  console.error('drawerPassTarget not found in Dashboard.tsx!');
  process.exit(1);
}
code = code.replace(drawerPassTarget, drawerPassReplacement);

// 3. In drawer console launch button
const drawerConsoleTarget = `                {/* Primary Web Console / Desktop Button */}
                {selectedInstance.status === 'running' ? (`;

const drawerConsoleReplacement = `                {/* Primary Web Console / Desktop Button */}
                {currentMemberRole === 'viewer' ? (
                  <div className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 select-none">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span>Console Access Restricted for Viewer (CIA Security)</span>
                  </div>
                ) : selectedInstance.status === 'running' ? (`;

if (!code.includes(drawerConsoleTarget)) {
  console.error('drawerConsoleTarget not found in Dashboard.tsx!');
  process.exit(1);
}
code = code.replace(drawerConsoleTarget, drawerConsoleReplacement);

// 4. In drawer Reset Pass & Rebuild OS buttons
const drawerOpsTarget = `                  <button
                    type="button"
                    onClick={() => {
                      setResetPasswordTargetVm(selectedInstance);
                      setNewResetPassword('');
                      setIsResetPasswordOpen(true);
                    }}
                    className="py-2.5 px-3 bg-white dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer group"
                    title="Reset guest root/admin password"
                  >
                    <Key className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span>Reset Pass</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRebuildTargetVm(selectedInstance);
                      setRebuildPassword('');
                      setRebuildConfirmHostname('');
                      setIsRebuildOpen(true);
                    }}
                    className="py-2.5 px-3 bg-white dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer group"
                    title="Rebuild VM with clean OS"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    <span>Rebuild OS</span>
                  </button>`;

const drawerOpsReplacement = `                  <button
                    type="button"
                    disabled={currentMemberRole === 'viewer'}
                    onClick={() => {
                      if (currentMemberRole === 'viewer') return;
                      setResetPasswordTargetVm(selectedInstance);
                      setNewResetPassword('');
                      setIsResetPasswordOpen(true);
                    }}
                    className={\`py-2.5 px-3 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border shadow-xs group \${
                      currentMemberRole === 'viewer'
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 border-slate-200 dark:border-slate-700 cursor-pointer'
                    }\`}
                    title={currentMemberRole === 'viewer' ? "Action restricted for Viewers (CIA Integrity)" : "Reset guest root/admin password"}
                  >
                    <Key className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                    <span>Reset Pass</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentMemberRole === 'viewer'}
                    onClick={() => {
                      if (currentMemberRole === 'viewer') return;
                      setRebuildTargetVm(selectedInstance);
                      setRebuildPassword('');
                      setRebuildConfirmHostname('');
                      setIsRebuildOpen(true);
                    }}
                    className={\`py-2.5 px-3 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border shadow-xs group \${
                      currentMemberRole === 'viewer'
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border-slate-200 dark:border-slate-700 cursor-pointer'
                    }\`}
                    title={currentMemberRole === 'viewer' ? "Action restricted for Viewers (CIA Integrity)" : "Rebuild VM with clean OS"}
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
                    <span>Rebuild OS</span>
                  </button>`;

if (!code.includes(drawerOpsTarget)) {
  console.error('drawerOpsTarget not found in Dashboard.tsx!');
  process.exit(1);
}
code = code.replace(drawerOpsTarget, drawerOpsReplacement);

code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(dashPath, code, 'utf8');
console.log('Successfully applied CIA security role controls in Dashboard.tsx!');

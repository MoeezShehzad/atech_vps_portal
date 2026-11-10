const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'public', 'src', 'pages', 'Dashboard.tsx');
let code = fs.readFileSync(dashPath, 'utf8').replace(/\r\n/g, '\n');

// 1. In table actions, if viewer, display Read-Only badge
const t1 = `                                    ) : (
                                    <>
                                  {/* POWER BUTTON */}`;

const r1 = `                                    ) : currentMemberRole === 'viewer' ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none" title="Viewer role: Read-only monitoring (CIA Security Policy)">
                                        <Eye className="w-3.5 h-3.5" /> Read-Only
                                      </span>
                                    ) : (
                                    <>
                                  {/* POWER BUTTON */}`;

if (!code.includes(t1)) {
  console.error('Target 1 not found!');
  process.exit(1);
}
code = code.replace(t1, r1);

// 2. Protect Resize specs button to Owner & Admin only
const t2 = `                                  {/* RESIZE SPECS BUTTON */}
                                  <button
                                    onClick={(e) => openResizeModal(inst, e)}
                                    title="Scale CPU & RAM Specs"
                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>`;

const r2 = `                                  {/* RESIZE SPECS BUTTON (Owner & Admin only) */}
                                  {(currentMemberRole === 'owner' || currentMemberRole === 'admin') && (
                                    <button
                                      onClick={(e) => openResizeModal(inst, e)}
                                      title="Scale CPU & RAM Specs"
                                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer"
                                    >
                                      <Sliders className="w-3.5 h-3.5" />
                                    </button>
                                  )}`;

if (!code.includes(t2)) {
  console.error('Target 2 not found!');
  process.exit(1);
}
code = code.replace(t2, r2);

// 3. Protect Delete action button to Owner & Admin only
const t3 = `                                  {/* DELETE ACTION BUTTON */}
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

const r3 = `                                  {/* DELETE ACTION BUTTON (Owner & Admin only) */}
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
                                  )}`;

if (!code.includes(t3)) {
  console.error('Target 3 not found!');
  process.exit(1);
}
code = code.replace(t3, r3);

// 4. In drawer password copy button
const t4 = `                    <div className="flex items-center gap-1.5 font-mono">
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

const r4 = `                    <div className="flex items-center gap-1.5 font-mono">
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

if (!code.includes(t4)) {
  console.error('Target 4 not found!');
  process.exit(1);
}
code = code.replace(t4, r4);

// 5. In drawer console launch button
const t5 = `                {/* Primary Web Console / Desktop Button */}
                {selectedInstance.status === 'running' ? (`;

const r5 = `                {/* Primary Web Console / Desktop Button */}
                {currentMemberRole === 'viewer' ? (
                  <div className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 select-none">
                    <Eye className="w-4 h-4 text-slate-400" />
                    <span>Console Access Restricted for Viewer (CIA Security)</span>
                  </div>
                ) : selectedInstance.status === 'running' ? (`;

if (!code.includes(t5)) {
  console.error('Target 5 not found!');
  process.exit(1);
}
code = code.replace(t5, r5);

// 6. In drawer Reset Pass & Rebuild OS buttons
const t6 = `                  <button
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

const r6 = `                  <button
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

if (!code.includes(t6)) {
  console.error('Target 6 not found!');
  process.exit(1);
}
code = code.replace(t6, r6);

code = code.replace(/\n/g, '\r\n');
fs.writeFileSync(dashPath, code, 'utf8');
console.log('Successfully applied all CIA security role controls in Dashboard.tsx!');

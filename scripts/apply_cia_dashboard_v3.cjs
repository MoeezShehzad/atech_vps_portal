const fs = require('fs');
const path = require('path');

const dashPath = path.join(__dirname, '..', 'public', 'src', 'pages', 'Dashboard.tsx');
let content = fs.readFileSync(dashPath, 'utf8');

// Replace 1: Viewer badge instead of power buttons
const search1 = `                                      Reactivate\r\n                                    </button>\r\n                                  ) : (\r\n                                  <>\r\n                                {/* POWER BUTTON */}`;

const replace1 = `                                      Reactivate\r\n                                    </button>\r\n                                  ) : currentMemberRole === 'viewer' ? (\r\n                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none" title="Viewer role: Read-only monitoring (CIA Security Policy)">\r\n                                      <Eye className="w-3.5 h-3.5" /> Read-Only\r\n                                    </span>\r\n                                  ) : (\r\n                                  <>\r\n                                {/* POWER BUTTON */}`;

console.log('Search 1 in content:', content.includes(search1));
if (content.includes(search1)) {
  content = content.replace(search1, replace1);
}

// Replace 2: Resize specs button (Only Owner & Admin)
const search2 = `                                {/* RESIZE SPECS BUTTON */}\r\n                                <button\r\n                                  onClick={(e) => openResizeModal(inst, e)}`;

const replace2 = `                                {/* RESIZE SPECS BUTTON (Owner & Admin only) */}\r\n                                {(currentMemberRole === 'owner' || currentMemberRole === 'admin') && (\r\n                                <button\r\n                                  onClick={(e) => openResizeModal(inst, e)}`;

console.log('Search 2 in content:', content.includes(search2));
if (content.includes(search2)) {
  content = content.replace(search2, replace2);
}

const search2Close = `                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer"\r\n                                >\r\n                                  <Sliders className="w-3.5 h-3.5" />\r\n                                </button>`;

const replace2Close = `                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer"\r\n                                >\r\n                                  <Sliders className="w-3.5 h-3.5" />\r\n                                </button>\r\n                                )}`;

console.log('Search 2Close in content:', content.includes(search2Close));
if (content.includes(search2Close)) {
  content = content.replace(search2Close, replace2Close);
}

// Replace 3: Delete instance button (Only Owner & Admin)
const search3 = `                                {/* DELETE ACTION BUTTON */}\r\n                                <button\r\n                                  onClick={(e) => {\r\n                                    e.stopPropagation();\r\n                                    setDeletingInstance(inst);`;

const replace3 = `                                {/* DELETE ACTION BUTTON (Owner & Admin only) */}\r\n                                {(currentMemberRole === 'owner' || currentMemberRole === 'admin') && (\r\n                                <button\r\n                                  onClick={(e) => {\r\n                                    e.stopPropagation();\r\n                                    setDeletingInstance(inst);`;

console.log('Search 3 in content:', content.includes(search3));
if (content.includes(search3)) {
  content = content.replace(search3, replace3);
}

const search3Close = `                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer"\r\n                                >\r\n                                  <Trash2 className="w-3.5 h-3.5" />\r\n                                </button>`;

const replace3Close = `                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 transition-all cursor-pointer"\r\n                                >\r\n                                  <Trash2 className="w-3.5 h-3.5" />\r\n                                </button>\r\n                                )}`;

console.log('Search 3Close in content:', content.includes(search3Close));
if (content.includes(search3Close)) {
  content = content.replace(search3Close, replace3Close);
}

// Replace 4: Drawer password copy
const search4 = `<div className="flex items-center gap-1.5 font-mono">\r\n                      <strong className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">\r\n                        {selectedInstance.os?.toLowerCase().includes('win') && !selectedInstance.adminPassword ? 'None (Direct)' : (drawerShowPassword ? (selectedInstance.adminPassword || 'root') : '••••••••')}\r\n                      </strong>\r\n                      <button\r\n                        onClick={() => setDrawerShowPassword(!drawerShowPassword)}\r\n                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"\r\n                        title={drawerShowPassword ? 'Hide Password' : 'Show Password'}\r\n                      >\r\n                        {drawerShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}\r\n                      </button>\r\n                      <button\r\n                        onClick={() => {\r\n                          navigator.clipboard.writeText(selectedInstance.adminPassword || 'root');\r\n                          setCopiedDrawerPassword(true);\r\n                          setTimeout(() => setCopiedDrawerPassword(false), 2000);\r\n                        }}\r\n                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"\r\n                        title="Copy Password"\r\n                      >\r\n                        {copiedDrawerPassword ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}\r\n                      </button>\r\n                    </div>`;

const replace4 = `<div className="flex items-center gap-1.5 font-mono">\r\n                      {currentMemberRole === 'viewer' ? (\r\n                        <span className="text-slate-400 font-mono text-xs italic">Protected (Viewer role)</span>\r\n                      ) : (\r\n                        <>\r\n                          <strong className="text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">\r\n                            {selectedInstance.os?.toLowerCase().includes('win') && !selectedInstance.adminPassword ? 'None (Direct)' : (drawerShowPassword ? (selectedInstance.adminPassword || 'root') : '••••••••')}\r\n                          </strong>\r\n                          <button\r\n                            onClick={() => setDrawerShowPassword(!drawerShowPassword)}\r\n                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"\r\n                            title={drawerShowPassword ? 'Hide Password' : 'Show Password'}\r\n                          >\r\n                            {drawerShowPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}\r\n                          </button>\r\n                          <button\r\n                            onClick={() => {\r\n                              navigator.clipboard.writeText(selectedInstance.adminPassword || 'root');\r\n                              setCopiedDrawerPassword(true);\r\n                              setTimeout(() => setCopiedDrawerPassword(false), 2000);\r\n                            }}\r\n                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"\r\n                            title="Copy Password"\r\n                          >\r\n                            {copiedDrawerPassword ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}\r\n                          </button>\r\n                        </>\r\n                      )}\r\n                    </div>`;

console.log('Search 4 in content:', content.includes(search4));
if (content.includes(search4)) {
  content = content.replace(search4, replace4);
}

// Replace 5: Drawer console button
const search5 = `                {/* Primary Web Console / Desktop Button */}\r\n                {selectedInstance.status === 'running' ? (`;

const replace5 = `                {/* Primary Web Console / Desktop Button */}\r\n                {currentMemberRole === 'viewer' ? (\r\n                  <div className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 select-none">\r\n                    <Eye className="w-4 h-4 text-slate-400" />\r\n                    <span>Console Access Restricted for Viewer (CIA Security)</span>\r\n                  </div>\r\n                ) : selectedInstance.status === 'running' ? (`;

console.log('Search 5 in content:', content.includes(search5));
if (content.includes(search5)) {
  content = content.replace(search5, replace5);
}

// Replace 6: Drawer Reset Pass & Rebuild OS buttons
const search6 = `                  <button\r\n                    type="button"\r\n                    onClick={() => {\r\n                      setResetPasswordTargetVm(selectedInstance);\r\n                      setNewResetPassword('');\r\n                      setIsResetPasswordOpen(true);\r\n                    }}\r\n                    className="py-2.5 px-3 bg-white dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer group"\r\n                    title="Reset guest root/admin password"\r\n                  >\r\n                    <Key className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />\r\n                    <span>Reset Pass</span>\r\n                  </button>\r\n\r\n                  <button\r\n                    type="button"\r\n                    onClick={() => {\r\n                      setRebuildTargetVm(selectedInstance);\r\n                      setRebuildPassword('');\r\n                      setRebuildConfirmHostname('');\r\n                      setIsRebuildOpen(true);\r\n                    }}\r\n                    className="py-2.5 px-3 bg-white dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer group"\r\n                    title="Rebuild VM with clean OS"\r\n                  >\r\n                    <RotateCcw className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />\r\n                    <span>Rebuild OS</span>\r\n                  </button>`;

const replace6 = `                  <button\r\n                    type="button"\r\n                    disabled={currentMemberRole === 'viewer'}\r\n                    onClick={() => {\r\n                      if (currentMemberRole === 'viewer') return;\r\n                      setResetPasswordTargetVm(selectedInstance);\r\n                      setNewResetPassword('');\r\n                      setIsResetPasswordOpen(true);\r\n                    }}\r\n                    className={\`py-2.5 px-3 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border shadow-xs group \${\r\n                      currentMemberRole === 'viewer'\r\n                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'\r\n                        : 'bg-white dark:bg-slate-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 border-slate-200 dark:border-slate-700 cursor-pointer'\r\n                    }\`}\r\n                    title={currentMemberRole === 'viewer' ? "Action restricted for Viewers (CIA Integrity)" : "Reset guest root/admin password"}\r\n                  >\r\n                    <Key className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />\r\n                    <span>Reset Pass</span>\r\n                  </button>\r\n\r\n                  <button\r\n                    type="button"\r\n                    disabled={currentMemberRole === 'viewer'}\r\n                    onClick={() => {\r\n                      if (currentMemberRole === 'viewer') return;\r\n                      setRebuildTargetVm(selectedInstance);\r\n                      setRebuildPassword('');\r\n                      setRebuildConfirmHostname('');\r\n                      setIsRebuildOpen(true);\r\n                    }}\r\n                    className={\`py-2.5 px-3 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all border shadow-xs group \${\r\n                      currentMemberRole === 'viewer'\r\n                        ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'\r\n                        : 'bg-white dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 border-slate-200 dark:border-slate-700 cursor-pointer'\r\n                    }\`}\r\n                    title={currentMemberRole === 'viewer' ? "Action restricted for Viewers (CIA Integrity)" : "Rebuild VM with clean OS"}\r\n                  >\r\n                    <RotateCcw className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />\r\n                    <span>Rebuild OS</span>\r\n                  </button>`;

console.log('Search 6 in content:', content.includes(search6));
if (content.includes(search6)) {
  content = content.replace(search6, replace6);
}

fs.writeFileSync(dashPath, content, 'utf8');
console.log('Done!');

const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../public/src/pages/Dashboard.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Top Header Deploy / Order Button
const oldTopDeploy = `                <button 
                  disabled={isLoading}
                  onClick={() => {
                    if (activeSlot) {
                      handleOpenDeployModal();
                    } else if (instances.length === 0 && (!activeSubscriptions || activeSubscriptions.length === 0)) {
                      setTrialCardholder(user?.fullName || '');
                      setIsTrialModalOpen(true);
                    } else {
                      navigate('/configure');
                    }
                  }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>{activeSlot ? 'Deploy Instance' : (instances.length === 0 && (!activeSubscriptions || activeSubscriptions.length === 0) ? 'Claim Free Trial' : 'Order New VPS')}</span>
                    </>
                  )}
                </button>`;

const newTopDeploy = `                {currentMemberRole !== 'viewer' && (
                  <button 
                    disabled={isLoading}
                    onClick={() => {
                      if (activeSlot) {
                        handleOpenDeployModal();
                      } else if (instances.length === 0 && (!activeSubscriptions || activeSubscriptions.length === 0)) {
                        setTrialCardholder(user?.fullName || '');
                        setIsTrialModalOpen(true);
                      } else {
                        navigate('/configure');
                      }
                    }}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>{activeSlot ? 'Deploy Instance' : (instances.length === 0 && (!activeSubscriptions || activeSubscriptions.length === 0) ? 'Claim Free Trial' : 'Order New VPS')}</span>
                      </>
                    )}
                  </button>
                )}`;

// 2. Active Slot Banner Setup button
const oldSlotBannerButton = `                  <div className="shrink-0">
                    <button
                      onClick={handleOpenDeployModal}
                      className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Zap className="w-4 h-4" /> Set Up VPS ($0.00)
                    </button>
                  </div>`;

const newSlotBannerButton = `                  {currentMemberRole !== 'viewer' && (
                    <div className="shrink-0">
                      <button
                        onClick={handleOpenDeployModal}
                        className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Zap className="w-4 h-4" /> Set Up VPS ($0.00)
                      </button>
                    </div>
                  )}`;

// 3. 1-Click Apps Install button
const oldInstall1Click = `                  <button
                    type="button"
                    onClick={() => {
                      const targetVmId = selectedInstance.vmId;
                      setSelectedInstance(null);
                      setMarketplaceTargetVmId(targetVmId);
                      setActiveTab('marketplace');
                    }}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <Zap className="w-3 h-3" />
                    <span>+ Install 1-Click App</span>
                  </button>`;

const newInstall1Click = `                  {currentMemberRole !== 'viewer' && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetVmId = selectedInstance.vmId;
                        setSelectedInstance(null);
                        setMarketplaceTargetVmId(targetVmId);
                        setActiveTab('marketplace');
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Zap className="w-3 h-3" />
                      <span>+ Install 1-Click App</span>
                    </button>
                  )}`;

// 4. Drawer Resize Specs button
const oldDrawerResize = `                  <button
                    onClick={(e) => openResizeModal(selectedInstance, e)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Resize Specs
                  </button>`;

const newDrawerResize = `                  {(currentMemberRole === 'owner' || currentMemberRole === 'admin') && (
                    <button
                      onClick={(e) => openResizeModal(selectedInstance, e)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" /> Resize Specs
                    </button>
                  )}`;

// 5. Backups Create and Restore/Delete
const oldBackupCreate = `                  <button
                    type="button"
                    onClick={handleCreateBackup}
                    disabled={backupActionLoading}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    {backupActionLoading ? 'Working...' : '+ Create Backup Now'}
                  </button>`;

const newBackupCreate = `                  {currentMemberRole !== 'viewer' && (
                    <button
                      type="button"
                      onClick={handleCreateBackup}
                      disabled={backupActionLoading}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      {backupActionLoading ? 'Working...' : '+ Create Backup Now'}
                    </button>
                  )}`;

const oldBackupItemActions = `                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestoreBackup(b.backupId, b.backupLocation)}
                            disabled={backupActionLoading}
                            className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-emerald-200/60 dark:border-emerald-800/60"
                            title="Restore server from this backup point"
                          >
                            Restore Server
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBackup(b.backupId)}
                            disabled={backupActionLoading}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete recovery snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>`;

const newBackupItemActions = `                        {currentMemberRole !== 'viewer' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRestoreBackup(b.backupId, b.backupLocation)}
                              disabled={backupActionLoading}
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-emerald-200/60 dark:border-emerald-800/60"
                              title="Restore server from this backup point"
                            >
                              Restore Server
                            </button>
                            {(currentMemberRole === 'owner' || currentMemberRole === 'admin') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBackup(b.backupId)}
                                disabled={backupActionLoading}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete recovery snapshot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}`;

// 6. Firewall Add Rule & Delete rule
const oldFirewallAdd = `                  <button
                    type="button"
                    onClick={() => setIsAddRuleOpen(!isAddRuleOpen)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddRuleOpen ? 'Cancel' : 'Add Rule'}</span>
                  </button>`;

const newFirewallAdd = `                  {currentMemberRole !== 'viewer' && (
                    <button
                      type="button"
                      onClick={() => setIsAddRuleOpen(!isAddRuleOpen)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded-xl text-[11px] font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddRuleOpen ? 'Cancel' : 'Add Rule'}</span>
                    </button>
                  )}`;

const oldFirewallItemDelete = `                          {!rule.isSystem && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFirewallRule(rule.id)}
                              disabled={firewallActionLoading}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}`;

const newFirewallItemDelete = `                          {currentMemberRole !== 'viewer' && !rule.isSystem && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFirewallRule(rule.id)}
                              disabled={firewallActionLoading}
                              className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}`;

// 7. Checkpoints / Snapshots Create & Actions
const oldSnapshotCreate = `                <form onSubmit={handleCreateSnapshot} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Snapshot name (e.g. pre-update)"
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={snapshotActionLoading || !newSnapshotName.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {snapshotActionLoading ? 'Saving...' : 'Take Snapshot'}
                  </button>
                </form>`;

const newSnapshotCreate = `                {currentMemberRole !== 'viewer' && (
                  <form onSubmit={handleCreateSnapshot} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Snapshot name (e.g. pre-update)"
                      value={newSnapshotName}
                      onChange={(e) => setNewSnapshotName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs font-mono focus:border-blue-500 focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={snapshotActionLoading || !newSnapshotName.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {snapshotActionLoading ? 'Saving...' : 'Take Snapshot'}
                    </button>
                  </form>
                )}`;

const oldSnapshotItemActions = `                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRestoreSnapshot(snap.snapshotId, snap.name || snap.snapshotName)}
                            disabled={snapshotActionLoading}
                            className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-amber-200/60 dark:border-amber-800/60"
                            title="Roll back to this checkpoint"
                          >
                            Rollback
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSnapshot(snap.snapshotId, snap.name || snap.snapshotName)}
                            disabled={snapshotActionLoading}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>`;

const newSnapshotItemActions = `                        {currentMemberRole !== 'viewer' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleRestoreSnapshot(snap.snapshotId, snap.name || snap.snapshotName)}
                              disabled={snapshotActionLoading}
                              className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-400 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-amber-200/60 dark:border-amber-800/60"
                              title="Roll back to this checkpoint"
                            >
                              Rollback
                            </button>
                            {(currentMemberRole === 'owner' || currentMemberRole === 'admin') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSnapshot(snap.snapshotId, snap.name || snap.snapshotName)}
                                disabled={snapshotActionLoading}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete snapshot"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}`;

// 8. Sticky Drawer Footer Actions
const oldDrawerFooter = `            {/* STICKY DRAWER FOOTER ACTIONS */}
            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 md:p-5 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedInstance(null)}
                className="py-2.5 px-3.5 rounded-xl font-semibold text-xs transition-all border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>

              {selectedInstance.isSuspended || selectedInstance.status === 'suspended' ? (
                <button
                  onClick={(e) => handleReactivateVM(selectedInstance.vmId, e)}
                  disabled={reactivatingVmId === selectedInstance.vmId}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {reactivatingVmId === selectedInstance.vmId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Reactivate ($ \${selectedInstance.monthlyPrice.toFixed(2)})</span>
                </button>
              ) : (
                <>
              <button
                onClick={(e) =>
                  handlePowerAction(
                    selectedInstance.vmId,
                    selectedInstance.status === 'running' ? 'STOP' : 'START',
                    e
                  )
                }
                disabled={actionLoadingId === selectedInstance.vmId}
                className={\`py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-xs \${
                  selectedInstance.status === 'running'
                    ? 'border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                    : 'border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }\`}
              >
                <Power className={\`w-3.5 h-3.5 \${actionLoadingId === selectedInstance.vmId ? 'animate-spin' : ''}\`} />
                {selectedInstance.status === 'running' ? 'Power Off' : 'Power On'}
              </button>

              <button
                onClick={(e) => handlePowerAction(selectedInstance.vmId, 'RESTART', e)}
                disabled={actionLoadingId === selectedInstance.vmId || selectedInstance.status !== 'running'}
                className="py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                title="Reboot Guest VM"
              >
                <RefreshCw className={\`w-3.5 h-3.5 \${actionLoadingId === selectedInstance.vmId ? 'animate-spin' : ''}\`} />
                Reboot
              </button>

              <button
                onClick={(e) =>
                  handlePowerAction(
                    selectedInstance.vmId,
                    selectedInstance.status === 'paused' ? 'RESUME' : 'PAUSE',
                    e
                  )
                }
                disabled={actionLoadingId === selectedInstance.vmId || (selectedInstance.status !== 'running' && selectedInstance.status !== 'paused')}
                className="py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-400 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                title={selectedInstance.status === 'paused' ? 'Resume VM Execution' : 'Pause (Suspend) VM Execution'}
              >
                {selectedInstance.status === 'paused' ? (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    Pause
                  </>
                )}
              </button>

                </>
              )}
              <button
                onClick={() => setDeletingInstance(selectedInstance)}
                className="ml-auto py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Destroy
              </button>
            </div>`;

const newDrawerFooter = `            {/* STICKY DRAWER FOOTER ACTIONS */}
            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-4 md:p-5 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedInstance(null)}
                className="py-2.5 px-3.5 rounded-xl font-semibold text-xs transition-all border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>

              {currentMemberRole === 'viewer' ? (
                <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 select-none">
                  <Eye className="w-3.5 h-3.5" />
                  Read-Only Mode (CIA Security)
                </span>
              ) : (
                <>
                  {selectedInstance.isSuspended || selectedInstance.status === 'suspended' ? (
                    (currentMemberRole === 'owner' || currentMemberRole === 'admin') && (
                      <button
                        onClick={(e) => handleReactivateVM(selectedInstance.vmId, e)}
                        disabled={reactivatingVmId === selectedInstance.vmId}
                        className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {reactivatingVmId === selectedInstance.vmId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Reactivate ($ \${selectedInstance.monthlyPrice.toFixed(2)})</span>
                      </button>
                    )
                  ) : (
                    <>
                      <button
                        onClick={(e) =>
                          handlePowerAction(
                            selectedInstance.vmId,
                            selectedInstance.status === 'running' ? 'STOP' : 'START',
                            e
                          )
                        }
                        disabled={actionLoadingId === selectedInstance.vmId}
                        className={\`py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border shadow-xs \${
                          selectedInstance.status === 'running'
                            ? 'border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                            : 'border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                        }\`}
                      >
                        <Power className={\`w-3.5 h-3.5 \${actionLoadingId === selectedInstance.vmId ? 'animate-spin' : ''}\`} />
                        {selectedInstance.status === 'running' ? 'Power Off' : 'Power On'}
                      </button>

                      <button
                        onClick={(e) => handlePowerAction(selectedInstance.vmId, 'RESTART', e)}
                        disabled={actionLoadingId === selectedInstance.vmId || selectedInstance.status !== 'running'}
                        className="py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                        title="Reboot Guest VM"
                      >
                        <RefreshCw className={\`w-3.5 h-3.5 \${actionLoadingId === selectedInstance.vmId ? 'animate-spin' : ''}\`} />
                        Reboot
                      </button>

                      <button
                        onClick={(e) =>
                          handlePowerAction(
                            selectedInstance.vmId,
                            selectedInstance.status === 'paused' ? 'RESUME' : 'PAUSE',
                            e
                          )
                        }
                        disabled={actionLoadingId === selectedInstance.vmId || (selectedInstance.status !== 'running' && selectedInstance.status !== 'paused')}
                        className="py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-400 bg-purple-50/60 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                        title={selectedInstance.status === 'paused' ? 'Resume VM Execution' : 'Pause (Suspend) VM Execution'}
                      >
                        {selectedInstance.status === 'paused' ? (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            Pause
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {(currentMemberRole === 'owner' || currentMemberRole === 'admin') && (
                    <button
                      onClick={() => setDeletingInstance(selectedInstance)}
                      className="ml-auto py-2.5 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Destroy
                    </button>
                  )}
                </>
              )}
            </div>`;

function normalize(s) {
  return s.replace(/\r\n/g, '\n').trim();
}

const replacements = [
  { name: '1. Top Header Deploy Button', old: oldTopDeploy, new: newTopDeploy },
  { name: '2. Active Slot Banner Setup Button', old: oldSlotBannerButton, new: newSlotBannerButton },
  { name: '3. 1-Click Apps Install Button', old: oldInstall1Click, new: newInstall1Click },
  { name: '4. Drawer Resize Specs Button', old: oldDrawerResize, new: newDrawerResize },
  { name: '5a. Backups Create Button', old: oldBackupCreate, new: newBackupCreate },
  { name: '5b. Backups Restore/Delete Buttons', old: oldBackupItemActions, new: newBackupItemActions },
  { name: '6a. Firewall Add Rule Button', old: oldFirewallAdd, new: newFirewallAdd },
  { name: '6b. Firewall Item Delete Button', old: oldFirewallItemDelete, new: newFirewallItemDelete },
  { name: '7a. Snapshots Create Form', old: oldSnapshotCreate, new: newSnapshotCreate },
  { name: '7b. Snapshots Restore/Delete Buttons', old: oldSnapshotItemActions, new: newSnapshotItemActions },
  { name: '8. Drawer Footer Actions', old: oldDrawerFooter, new: newDrawerFooter },
];

let normalizedContent = content.replace(/\r\n/g, '\n');

for (const rep of replacements) {
  const normOld = normalize(rep.old);
  const normNew = normalize(rep.new);
  if (!normalizedContent.includes(normOld)) {
    console.error(`FAILED to find: ${rep.name}`);
    process.exit(1);
  }
  normalizedContent = normalizedContent.replace(normOld, normNew);
  console.log(`Successfully matched and replaced: ${rep.name}`);
}

// Write back with appropriate line breaks (preserve \r\n on Windows)
fs.writeFileSync(targetFile, normalizedContent.replace(/\n/g, '\r\n'), 'utf8');
console.log('All Dashboard.tsx CIA security updates applied successfully!');

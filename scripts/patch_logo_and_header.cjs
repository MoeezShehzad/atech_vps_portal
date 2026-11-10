const fs = require('fs');
const path = require('path');

// 1. Patch Dashboard.tsx
const dashboardPath = path.join(__dirname, '..', 'public', 'src', 'pages', 'Dashboard.tsx');
let dashboard = fs.readFileSync(dashboardPath, 'utf8');

// Remove import
dashboard = dashboard.replace(/import WorkspaceSwitcher from '\.\.\/components\/WorkspaceSwitcher';\r?\n/, '');

// Remove component usage
const wsUsageRegex = /\{?\/\* ENTERPRISE WORKSPACE \/ ORGANIZATION SWITCHER \*\/\}\r?\n\s*<WorkspaceSwitcher\r?\n\s*currentWorkspace=\{currentWorkspace\}\r?\n\s*onSelectWorkspace=\{handleWorkspaceSwitch\}\r?\n\s*\/>\r?\n/;
if (wsUsageRegex.test(dashboard)) {
  dashboard = dashboard.replace(wsUsageRegex, '');
  console.log('Successfully removed WorkspaceSwitcher from Dashboard.tsx');
} else {
  console.warn('WorkspaceSwitcher regex did not match in Dashboard.tsx, checking manual replace...');
  const needle = `<WorkspaceSwitcher
                  currentWorkspace={currentWorkspace}
                  onSelectWorkspace={handleWorkspaceSwitch}
                />`;
  if (dashboard.includes(needle)) {
    dashboard = dashboard.replace(needle, '');
    console.log('Manually replaced WorkspaceSwitcher in Dashboard.tsx');
  }
}
fs.writeFileSync(dashboardPath, dashboard, 'utf8');

// 2. Patch AccountSettings.tsx
const accountPath = path.join(__dirname, '..', 'public', 'src', 'components', 'AccountSettings.tsx');
let account = fs.readFileSync(accountPath, 'utf8');

const oldLogoBox = `<div className="w-18 h-18 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden text-slate-400 dark:text-slate-500 font-bold text-xl shadow-xs">
                  {uploadingLogo ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : companyLogoPreview ? (
                    <img src={companyLogoPreview} alt="Company Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-blue-600/70" />
                  )}
                </div>`;

const newLogoBox = `<div className="w-40 sm:w-48 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 flex items-center justify-center overflow-hidden text-slate-400 dark:text-slate-500 font-bold shadow-xs">
                  {uploadingLogo ? (
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  ) : companyLogoPreview ? (
                    <img src={companyLogoPreview} alt="Company Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
                      <Building2 className="w-6 h-6 text-blue-600/70" />
                      <span className="text-[10px] font-medium">No Logo</span>
                    </div>
                  )}
                </div>`;

const normAccount = account.replace(/\r\n/g, '\n');
const normOldLogo = oldLogoBox.replace(/\r\n/g, '\n');
if (normAccount.includes(normOldLogo)) {
  account = normAccount.replace(normOldLogo, newLogoBox.replace(/\r\n/g, '\n'));
  fs.writeFileSync(accountPath, account, 'utf8');
  console.log('Successfully updated logo box in AccountSettings.tsx');
} else {
  console.error('Could not find oldLogoBox in AccountSettings.tsx');
}

// 3. Patch TeamManagement.tsx
const teamPath = path.join(__dirname, '..', 'public', 'src', 'components', 'TeamManagement.tsx');
let team = fs.readFileSync(teamPath, 'utf8');

const oldTeamLogo = `<div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {uploadingLogo ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : editLogoUrl ? (
                    <img src={editLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-400" />
                  )}
                </div>`;

const newTeamLogo = `<div className="w-32 h-14 rounded-xl bg-white dark:bg-slate-700 p-1.5 border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {uploadingLogo ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : editLogoUrl ? (
                    <img src={editLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6 text-slate-400" />
                  )}
                </div>`;

const normTeam = team.replace(/\r\n/g, '\n');
const normOldTeam = oldTeamLogo.replace(/\r\n/g, '\n');
if (normTeam.includes(normOldTeam)) {
  team = normTeam.replace(normOldTeam, newTeamLogo.replace(/\r\n/g, '\n'));
  fs.writeFileSync(teamPath, team, 'utf8');
  console.log('Successfully updated logo box in TeamManagement.tsx');
} else {
  console.error('Could not find oldTeamLogo in TeamManagement.tsx');
}

// 4. Patch WorkspaceSwitcher.tsx (replace object-cover with object-contain for logos)
const wsPath = path.join(__dirname, '..', 'public', 'src', 'components', 'WorkspaceSwitcher.tsx');
let ws = fs.readFileSync(wsPath, 'utf8');
ws = ws.replace(/className="w-full h-full object-cover"/g, 'className="max-w-full max-h-full object-contain"');
fs.writeFileSync(wsPath, ws, 'utf8');
console.log('Successfully updated WorkspaceSwitcher.tsx');

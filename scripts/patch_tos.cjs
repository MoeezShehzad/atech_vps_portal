const fs = require('fs');

const path = 'public/src/pages/TermsOfService.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add imports
content = content.replace(
  "import React, { useState } from 'react';",
  "import React, { useState, useEffect } from 'react';\r\nimport DynamicPolicyRenderer from '../components/DynamicPolicyRenderer';"
);

content = content.replace(
  "Layers, KeyRound, Globe, Ban, AlertOctagon",
  "Layers, KeyRound, Globe, Ban, AlertOctagon, History, AlertTriangle"
);

// 2. Add state inside TermsOfService component
const stateTarget = '  const lastUpdated = "October 17, 2026";';
const stateReplacement = `  const fallbackLastUpdated = "October 17, 2026";
  const [dbPolicy, setDbPolicy] = useState<any>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [selectedVer, setSelectedVer] = useState<string>('');
  const [loadingVer, setLoadingVer] = useState(false);

  useEffect(() => {
    fetch('/api/policies/terms-of-service')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.policy) setDbPolicy(data.policy);
      })
      .catch(() => {});

    fetch('/api/policies/terms-of-service/versions')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.versions) setVersionHistory(data.versions);
      })
      .catch(() => {});
  }, []);

  const handleSelectVersion = async (ver: string) => {
    setSelectedVer(ver);
    if (!ver) {
      fetch('/api/policies/terms-of-service')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.policy) setDbPolicy(data.policy);
        });
      return;
    }

    try {
      setLoadingVer(true);
      const res = await fetch(\`/api/policies/terms-of-service/versions/\${encodeURIComponent(ver)}\`);
      const data = await res.json();
      if (data && data.success && data.policy) setDbPolicy(data.policy);
    } catch (_) {
    } finally {
      setLoadingVer(false);
    }
  };

  const currentDisplayDate = dbPolicy?.effectiveAt
    ? new Date(dbPolicy.effectiveAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : fallbackLastUpdated;

  const currentDisplayVersion = dbPolicy?.version || 'v1.0';`;

content = content.replace(stateTarget, stateReplacement);

// 3. Add archive notice banner right before Hero
const heroTarget = '        {/* ENTERPRISE HERO */}';
const heroReplacement = `        {/* ARCHIVE NOTICE BANNER (IF VIEWING HISTORICAL VERSION) */}
        {dbPolicy && !dbPolicy.isCurrent && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                <strong>Historical Archive Notice:</strong> You are viewing archived version{' '}
                <span className="font-mono font-bold">{dbPolicy.version}</span>.
                {dbPolicy.summaryOfChanges && (
                  <span className="block text-xs mt-0.5 text-amber-800 dark:text-amber-300">
                    Reason/Summary: {dbPolicy.summaryOfChanges}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSelectVersion('')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shrink-0 transition-colors cursor-pointer"
            >
              Switch to Live Version
            </button>
          </div>
        )}

        {/* ENTERPRISE HERO */}`;

content = content.replace(heroTarget, heroReplacement);

// 4. Update Version and Effective date badges in hero
const badgesTarget = `<span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Version: ATC-MSA 2026.4
              </span>
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Effective: {lastUpdated}
              </span>`;

const badgesReplacement = `<span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                Version: {currentDisplayVersion}
              </span>
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                Effective: {currentDisplayDate}
              </span>
              {versionHistory.length > 1 && (
                <div className="flex items-center gap-1.5 ml-1">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedVer}
                    onChange={(e) => handleSelectVersion(e.target.value)}
                    disabled={loadingVer}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">Live Version ({versionHistory.find((v) => v.isCurrent)?.version || 'Current'})</option>
                    {versionHistory
                      .filter((v) => !v.isCurrent)
                      .map((v) => (
                        <option key={v.id} value={v.version}>
                          Archive {v.version} ({new Date(v.effectiveAt).toLocaleDateString()})
                        </option>
                      ))}
                  </select>
                </div>
              )}`;

content = content.replace(badgesTarget, badgesReplacement);

// 5. Wrap content rendering with dbPolicy?.content check
const twoColTarget = '        {/* TWO-COLUMN LAYOUT: SIDEBAR TABLE OF CONTENTS + EXPANDED ARTICLES */}';
const twoColReplacement = `        {/* POLICY CONTENT RENDERING (DYNAMIC FROM DB OR STATIC FALLBACK) */}
        {dbPolicy?.content ? (
          <DynamicPolicyRenderer content={dbPolicy.content} policyTitle={dbPolicy.title} />
        ) : (
        /* TWO-COLUMN LAYOUT: SIDEBAR TABLE OF CONTENTS + EXPANDED ARTICLES */`;

content = content.replace(twoColTarget, twoColReplacement);

const closingTarget = '      </div>\r\n    </div>\r\n  );\r\n}';
const closingReplacement = '        )}\r\n      </div>\r\n    </div>\r\n  );\r\n}';
content = content.replace(closingTarget, closingReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log('TermsOfService.tsx updated successfully!');

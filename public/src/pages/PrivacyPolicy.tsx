import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Eye, Database, Globe, UserCheck, 
  FileText, Bell, ChevronRight, Server, CheckCircle2, KeyRound,
  ShieldAlert, HardDrive, Cpu, Terminal, History, AlertTriangle
} from 'lucide-react';
import DynamicPolicyRenderer from '../components/DynamicPolicyRenderer';

export default function PrivacyPolicy() {
  const fallbackLastUpdated = "October 17, 2026";
  const [activeSection, setActiveSection] = useState('atcpriv-1');

  // Database-driven policy state
  const [dbPolicy, setDbPolicy] = useState<any>(null);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  const [selectedVer, setSelectedVer] = useState<string>('');
  const [loadingVer, setLoadingVer] = useState(false);

  useEffect(() => {
    // 1. Fetch current active policy
    fetch('/api/policies/privacy-policy')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.policy) {
          setDbPolicy(data.policy);
        }
      })
      .catch(() => {});

    // 2. Fetch public version history
    fetch('/api/policies/privacy-policy/versions')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.versions) {
          setVersionHistory(data.versions);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectVersion = async (ver: string) => {
    setSelectedVer(ver);
    if (!ver) {
      // Reload current live
      fetch('/api/policies/privacy-policy')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && data.policy) setDbPolicy(data.policy);
        });
      return;
    }

    try {
      setLoadingVer(true);
      const res = await fetch(`/api/policies/privacy-policy/versions/${encodeURIComponent(ver)}`);
      const data = await res.json();
      if (data && data.success && data.policy) {
        setDbPolicy(data.policy);
      }
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

  const currentDisplayVersion = dbPolicy?.version || 'v1.0';

  const tableOfContents = [
    { id: 'atcpriv-1', title: '1. Institutional Scope & Regulatory Jurisdiction' },
    { id: 'atcpriv-2', title: '2. The Four Foundational Privacy Commitments' },
    { id: 'atcpriv-3', title: '3. Customer Data vs Account Data Demarcation' },
    { id: 'atcpriv-4', title: '4. Information We Collect' },
    { id: 'atcpriv-5', title: '5. Lawful Bases for Processing' },
    { id: 'atcpriv-6', title: '6. Payment Processing & PCI-DSS Level 1' },
    { id: 'atcpriv-7', title: '7. Infrastructure Telemetry & Perimeter Security' },
    { id: 'atcpriv-8', title: '8. Controlled Subprocessors & Third Parties' },
    { id: 'atcpriv-9', title: '9. Absolute Prohibition on Sale of Data' },
    { id: 'atcpriv-10', title: '10. Government Demands & Subpoena Scrutiny' },
    { id: 'atcpriv-11', title: '11. Cryptographic Erasure & NIST SP 800-88' },
    { id: 'atcpriv-12', title: '12. Global Privacy Rights (GDPR & CCPA/CPRA)' },
    { id: 'atcpriv-13', title: '13. Essential Cookies & GPC Signal Handling' },
    { id: 'atcpriv-14', title: '14. Security Safeguards & Defense-in-Depth' },
    { id: 'atcpriv-15', title: '15. Protection of Minors' },
    { id: 'atcpriv-16', title: '16. Data Protection Officer & Legal Notices' },
  ];

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* ARCHIVE NOTICE BANNER (IF VIEWING HISTORICAL VERSION) */}
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

        {/* PRIVACY HERO */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Analytical Technical Consulting (ATC) • Enterprise Privacy Architecture
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-poppins">
                  {dbPolicy?.title || 'Cloud Privacy Notice'}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-mono">
                Version: {currentDisplayVersion}
              </span>

              <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Effective: {currentDisplayDate}
              </span>

              {/* Version History Archive Dropdown */}
              {versionHistory.length > 1 && (
                <div className="flex items-center gap-1.5 ml-1">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={selectedVer}
                    onChange={(e) => handleSelectVersion(e.target.value)}
                    disabled={loadingVer}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-hidden cursor-pointer"
                  >
                    <option value="">Live Version ({versionHistory.find(v => v.isCurrent)?.version || 'Current'})</option>
                    {versionHistory
                      .filter((v) => !v.isCurrent)
                      .map((v) => (
                        <option key={v.id} value={v.version}>
                          Archive {v.version} ({new Date(v.effectiveAt).toLocaleDateString()})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            At <strong>Analytical Technical Consulting (ATC)</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), 
            we operate our enterprise cloud infrastructure under rigorous data privacy, sovereignty, and trust commitments. 
            This Cloud Privacy Notice delineates how we handle, process, and secure Customer Data and Account Information across our enterprise 
            virtualization clusters, SSD block storage networks, APIs, and portals in compliance with GDPR, UK GDPR, CCPA/CPRA, and federal U.S. data protection statutes.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5" /> Customer Data Sovereignty (You Own Your Data)
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800">
              <Lock className="w-3.5 h-3.5" /> PCI-DSS Level 1 Tokenized Billing
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border border-slate-200 dark:border-slate-700">
              <Database className="w-3.5 h-3.5" /> NIST SP 800-88 Cryptographic Sanitization
            </span>
          </div>
        </div>

        {/* POLICY CONTENT RENDERING (DYNAMIC FROM DB OR STATIC FALLBACK) */}
        {dbPolicy?.content ? (
          <DynamicPolicyRenderer content={dbPolicy.content} policyTitle={dbPolicy.title} />
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* DESKTOP STICKY SIDEBAR NAVIGATION */}
            <aside className="hidden lg:block lg:col-span-4 sticky top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4 px-2">
                Privacy Notice Articles
              </h3>
              <nav className="space-y-1">
                {tableOfContents.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                      activeSection === item.id 
                        ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-500/20' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="truncate">{item.title}</span>
                    <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${activeSection === item.id ? 'translate-x-0.5' : 'opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
                <p className="font-semibold text-slate-800 dark:text-slate-300">Data Protection Officer</p>
                <p>For GDPR/CCPA verifications or subpoena requests:</p>
                <a href="mailto:privacy@atechconsult.com" className="text-emerald-600 dark:text-emerald-400 font-bold underline block">
                  privacy@atechconsult.com
                </a>
              </div>
            </aside>

            {/* MAIN ARTICLES CONTAINER */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-12 shadow-sm space-y-12 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
              <section id="atcpriv-1" className="space-y-4 pt-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white font-poppins flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold">1</span>
                  Institutional Scope &amp; Regulatory Jurisdiction
                </h2>
                <p>
                  This Cloud Privacy Notice applies to all cloud infrastructure services provided by <strong>Analytical Technical Consulting (ATC)</strong>, 
                  an Illinois entity operating cloud infrastructure facilities located in 
                  <strong> Illinois, United States</strong>.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const fs = require('fs');

const file = 'public/src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes("import AdminPoliciesTab from '../components/AdminPoliciesTab';")) {
  content = content.replace(
    "import { jsPDF } from 'jspdf';",
    "import { jsPDF } from 'jspdf';\r\nimport AdminPoliciesTab from '../components/AdminPoliciesTab';"
  );
}

// 2. Add 'policies' to activeTab state type
if (!content.includes("| 'policies'")) {
  content = content.replace(
    "| 'audit'",
    "| 'audit'\r\n    | 'policies'"
  );
}

// 3. Add to navItems
if (!content.includes("id: 'policies'")) {
  content = content.replace(
    "{ id: 'audit', label: 'Audit Trail', icon: ShieldCheck, badge: null, alert: false },",
    "{ id: 'audit', label: 'Audit Trail', icon: ShieldCheck, badge: null, alert: false },\r\n    { id: 'policies', label: 'Legal Policies', icon: FileText, badge: null, alert: false },"
  );
}

// 4. Add header title
if (!content.includes("activeTab === 'policies'")) {
  content = content.replace(
    "{activeTab === 'audit' && 'Cluster Audit Trail & Event Stream'}",
    "{activeTab === 'audit' && 'Cluster Audit Trail & Event Stream'}\r\n                  {activeTab === 'policies' && 'Legal Policies & Compliance Suite'}"
  );
}

// 5. Add tab rendering right after audit tab
if (!content.includes("{activeTab === 'policies' && (")) {
  const auditEndTarget = "        {activeTab === 'audit' && (\r\n          <div className=\"bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden\">";
  const auditReplacement = "        {activeTab === 'policies' && (\r\n          <AdminPoliciesTab />\r\n        )}\r\n\r\n" + auditEndTarget;
  content = content.replace(auditEndTarget, auditReplacement);
}

fs.writeFileSync(file, content, 'utf8');
console.log('AdminDashboard.tsx patched successfully!');

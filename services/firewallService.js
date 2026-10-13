// ==============================================================================
// Service: firewallService.js
// Purpose: Enterprise Cloud Firewall (Security Groups) rule manager per VM
// ==============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const FIREWALL_FILE = path.join(DATA_DIR, 'firewall_rules.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    console.warn('[Firewall Service] Error creating data directory:', e.message);
  }
}

function getDefaultRules(vmId) {
  return [
    {
      id: `rule_ssh_${vmId}`,
      direction: 'INBOUND',
      protocol: 'TCP',
      port: '22',
      cidr: '0.0.0.0/0',
      action: 'ALLOW',
      description: 'Default SSH Management Port',
      isSystem: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: `rule_http_${vmId}`,
      direction: 'INBOUND',
      protocol: 'TCP',
      port: '80',
      cidr: '0.0.0.0/0',
      action: 'ALLOW',
      description: 'Standard Web Traffic (HTTP)',
      isSystem: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: `rule_https_${vmId}`,
      direction: 'INBOUND',
      protocol: 'TCP',
      port: '443',
      cidr: '0.0.0.0/0',
      action: 'ALLOW',
      description: 'Secure Web Traffic (HTTPS / SSL)',
      isSystem: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: `rule_icmp_${vmId}`,
      direction: 'INBOUND',
      protocol: 'ICMP',
      port: 'Echo Reply',
      cidr: '0.0.0.0/0',
      action: 'ALLOW',
      description: 'ICMP Ping Diagnostics',
      isSystem: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: `rule_egress_all_${vmId}`,
      direction: 'OUTBOUND',
      protocol: 'ALL',
      port: 'All Ports',
      cidr: '0.0.0.0/0',
      action: 'ALLOW',
      description: 'Default Outbound Internet Gateway Access',
      isSystem: true,
      createdAt: new Date().toISOString(),
    },
  ];
}

class FirewallService {
  constructor() {
    this._loadRules();
  }

  _loadRules() {
    try {
      if (fs.existsSync(FIREWALL_FILE)) {
        const raw = fs.readFileSync(FIREWALL_FILE, 'utf-8');
        this.cache = JSON.parse(raw);
      } else {
        this.cache = {};
        this._saveRules();
      }
    } catch (e) {
      console.warn('[Firewall Service] Could not read firewall_rules.json, initializing empty cache:', e.message);
      this.cache = {};
    }
  }

  _saveRules() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(FIREWALL_FILE, JSON.stringify(this.cache, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Firewall Service] Error writing firewall_rules.json:', e.message);
    }
  }

  getRules(vmId) {
    const key = String(vmId);
    if (!this.cache[key] || !Array.isArray(this.cache[key])) {
      this.cache[key] = getDefaultRules(vmId);
      this._saveRules();
    }
    return this.cache[key];
  }

  addRule(vmId, { direction = 'INBOUND', protocol = 'TCP', port = '80', cidr = '0.0.0.0/0', action = 'ALLOW', description = '' }) {
    const key = String(vmId);
    if (!this.cache[key]) {
      this.cache[key] = getDefaultRules(vmId);
    }

    const newRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      direction: direction.toUpperCase(),
      protocol: protocol.toUpperCase(),
      port: String(port).trim(),
      cidr: (cidr || '0.0.0.0/0').trim(),
      action: action.toUpperCase(),
      description: (description || `Custom ${direction} rule`).trim(),
      isSystem: false,
      createdAt: new Date().toISOString(),
    };

    this.cache[key].push(newRule);
    this._saveRules();
    return newRule;
  }

  deleteRule(vmId, ruleId) {
    const key = String(vmId);
    if (!this.cache[key]) return false;

    const initialLen = this.cache[key].length;
    this.cache[key] = this.cache[key].filter((r) => r.id !== ruleId);
    const deleted = this.cache[key].length < initialLen;
    if (deleted) {
      this._saveRules();
    }
    return deleted;
  }
}

export default new FirewallService();

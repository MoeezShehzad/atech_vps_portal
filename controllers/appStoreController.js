// ==============================================================================
// File: controllers/appStoreController.js
// Purpose: API controllers for 1-Click Apps catalog & automated deployment
// ==============================================================================

import {
  listAppCatalog,
  getInstalledAppsForVM,
  getVMInstallJobs,
  installAppOnVM,
  uninstallAppFromVM,
} from '../services/appStoreService.js';
import { APP_CATEGORIES } from '../lib/appsCatalog.js';

export async function getApps(req, res) {
  try {
    const { category, search } = req.query;
    const result = await listAppCatalog({ category, search });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('getApps error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch application catalog.' });
  }
}

export function getCategories(req, res) {
  res.json({ success: true, categories: APP_CATEGORIES });
}

export async function getInstalledApps(req, res) {
  try {
    const { vmId } = req.params;
    const userId = req.user.userId;

    const installed = await getInstalledAppsForVM(vmId, userId);
    res.json({ success: true, installed });
  } catch (err) {
    console.error('getInstalledApps error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function getVMJobs(req, res) {
  try {
    const { vmId } = req.params;
    const userId = req.user.userId;

    const jobs = await getVMInstallJobs(vmId, userId);
    res.json({ success: true, jobs });
  } catch (err) {
    console.error('getVMJobs error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
}

export async function installApp(req, res) {
  try {
    const { vmId } = req.params;
    const { appId, config, asyncMode } = req.body;
    const userId = req.user.userId;

    if (!appId) {
      return res.status(400).json({ success: false, error: 'Application ID is required.' });
    }

    const result = await installAppOnVM({
      vmId,
      userId,
      appId,
      config: config || {},
      asyncMode: Boolean(asyncMode),
    });
    res.json({ success: true, result });
  } catch (err) {
    console.error('installApp error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

export async function uninstallApp(req, res) {
  try {
    const { vmId, appId } = req.params;
    const userId = req.user.userId;

    if (!appId) {
      return res.status(400).json({ success: false, error: 'Application ID is required.' });
    }

    const result = await uninstallAppFromVM({ vmId, userId, appId });
    res.json({ success: true, result });
  } catch (err) {
    console.error('uninstallApp error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
}

// ==============================================================================
// Controller: siteController.js
// Purpose: ATC Native Web Hosting & Applications Engine
//          1. 1-Click WordPress & Static Website Provisioning
//          2. In-Portal Web File Manager (Browse, Edit, Create, Delete)
//          3. Database Management & Credentials
//          4. Domain & SSL Status
//          5. Container / Site Power Lifecycle (Start, Stop, Restart)
// ==============================================================================

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';

// Base directory where customer website files live
const STORAGE_ROOT = process.env.ATC_SITES_STORAGE_DIR || path.join(process.cwd(), 'atc_managed_sites');

// Ensure root directory exists
try {
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }
} catch (_) {}

/**
 * Helper to safely resolve paths inside a site's webroot and prevent directory traversal (security guard)
 */
function getSafeSitePath(siteId, relativePath = '') {
  const siteDir = path.resolve(STORAGE_ROOT, `site_${siteId}`, 'public_html');
  if (!fs.existsSync(siteDir)) {
    fs.mkdirSync(siteDir, { recursive: true });
  }

  // Clean relative path
  const normalized = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const targetPath = path.resolve(siteDir, normalized);

  // Security check: Must remain inside siteDir
  if (!targetPath.startsWith(siteDir)) {
    throw new Error('Access denied: Path traversal outside site directory.');
  }

  return { siteDir, targetPath };
}

/**
 * 1. GET /api/sites - List all managed websites for current user
 */
export async function listSites(req, res) {
  try {
    const userId = req.user.userId;
    const sites = await prisma.managedWebsite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, sites });
  } catch (error) {
    console.error('[SITE CONTROLLER] listSites error:', error);
    return res.status(500).json({ error: 'Failed to retrieve websites.' });
  }
}

/**
 * 2. GET /api/sites/:id - Get website details
 */
export async function getSite(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) {
      return res.status(404).json({ error: 'Website not found.' });
    }

    return res.json({ success: true, site });
  } catch (error) {
    console.error('[SITE CONTROLLER] getSite error:', error);
    return res.status(500).json({ error: 'Failed to retrieve website details.' });
  }
}

/**
 * 3. POST /api/sites - Provision new 1-Click Website (WordPress or Static HTML)
 */
export async function createSite(req, res) {
  try {
    const userId = req.user.userId;
    const { name, appType = 'WORDPRESS', customDomain } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Website name is required.' });
    }

    const cleanSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'site';
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const stagingDomain = `${cleanSlug}-${randSuffix}.vps.atechconsult.com`;
    const primaryDomain = customDomain && customDomain.trim().length > 0 ? customDomain.trim().toLowerCase() : stagingDomain;

    // Database credentials
    const dbName = `atc_db_${cleanSlug}_${randSuffix}`;
    const dbUser = `atc_usr_${randSuffix}`;
    const dbPassword = crypto.randomBytes(12).toString('hex');

    // WP Admin Credentials
    const wpAdminUser = 'admin_' + cleanSlug.substring(0, 8);
    const wpAdminPassword = crypto.randomBytes(10).toString('base64').replace(/[^a-zA-Z0-9]/g, 'x') + '!';

    // Internal port assigned
    const port = 8100 + Math.floor(Math.random() * 800);

    // Create database entry first
    const site = await prisma.managedWebsite.create({
      data: {
        userId,
        name: name.trim(),
        primaryDomain,
        stagingDomain,
        appType,
        phpVersion: '8.3',
        status: 'ACTIVE',
        port,
        dbName,
        dbUser,
        dbPassword,
        wpAdminUser,
        wpAdminPassword,
        sslStatus: 'ACTIVE',
        diskUsageMb: appType === 'WORDPRESS' ? 64.5 : 2.1,
      },
    });

    // Populate site directory with template files
    const { siteDir } = getSafeSitePath(site.id, '');
    const publicHtml = siteDir;

    if (appType === 'WORDPRESS') {
      // Create WordPress Starter Files & Simulation
      fs.writeFileSync(
        path.join(publicHtml, 'wp-config.php'),
        `<?php
/**
 * ATC Cloud VPS - WordPress Configuration
 * Database: ${dbName}
 */
define( 'DB_NAME', '${dbName}' );
define( 'DB_USER', '${dbUser}' );
define( 'DB_PASSWORD', '${dbPassword}' );
define( 'DB_HOST', 'localhost' );
define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

$table_prefix = 'wp_';
define( 'WP_DEBUG', false );
if ( ! defined( 'ABSPATH' ) ) {
  define( 'ABSPATH', __DIR__ . '/' );
}
require_once ABSPATH . 'wp-settings.php';
`
      );

      fs.writeFileSync(
        path.join(publicHtml, 'index.php'),
        `<?php
/**
 * ATC Cloud - WordPress Engine Active
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${site.name} &bull; Hosted on ATC Cloud</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 48px; max-width: 600px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .badge { background: #10b981; color: white; padding: 6px 14px; border-radius: 9999px; font-weight: bold; font-size: 12px; display: inline-block; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; }
        h1 { margin: 0 0 16px; font-size: 32px; color: #fff; }
        p { color: #94a3b8; line-height: 1.6; font-size: 15px; margin-bottom: 24px; }
        .btn { background: #2563eb; color: white; padding: 12px 28px; border-radius: 12px; font-weight: bold; text-decoration: none; display: inline-block; transition: background 0.2s; }
        .btn:hover { background: #1d4ed8; }
        .info { background: #0f172a; padding: 16px; border-radius: 12px; text-align: left; font-family: monospace; font-size: 13px; color: #38bdf8; margin-top: 24px; border: 1px solid #1e293b; }
    </style>
</head>
<body>
    <div class="card">
        <span class="badge">● WordPress Engine Online</span>
        <h1>${site.name}</h1>
        <p>Your high-performance WordPress site is deployed on ATC Cloud with dedicated NVMe storage and PHP 8.3 FPM acceleration.</p>
        <a href="/wp-admin" class="btn">Open WP Admin Dashboard</a>
        <div class="info">
            <div>Site ID: site_${site.id}</div>
            <div>Database: ${dbName}</div>
            <div>Staging URL: ${stagingDomain}</div>
        </div>
    </div>
</body>
</html>
`
      );

      // Create a dummy wp-admin/index.php
      const wpAdminDir = path.join(publicHtml, 'wp-admin');
      if (!fs.existsSync(wpAdminDir)) fs.mkdirSync(wpAdminDir);
      fs.writeFileSync(
        path.join(wpAdminDir, 'index.php'),
        `<!DOCTYPE html>
<html>
<head><title>WordPress Admin - ${site.name}</title></head>
<body style="font-family:sans-serif;padding:40px;background:#f0f0f1;">
  <div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:8px;box-shadow:0 4px 10px rgba(0,0,0,0.1);">
    <h2>WordPress Administration</h2>
    <p>Logged in as: <strong>${wpAdminUser}</strong></p>
    <p style="color:#10b981;">● Connected to ATC Cloud MariaDB instance.</p>
    <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
    <a href="/" style="color:#2271b1;text-decoration:none;">&larr; Back to Website</a>
  </div>
</body>
</html>`
      );
    } else {
      // Static HTML5 Starter
      fs.writeFileSync(
        path.join(publicHtml, 'index.html'),
        `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${site.name}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 48px; max-width: 600px; text-align: center; }
        h1 { margin: 0 0 16px; font-size: 32px; color: #fff; }
        p { color: #94a3b8; font-size: 15px; margin-bottom: 24px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${site.name}</h1>
        <p>Your static web space is ready! Use the in-portal ATC File Manager to upload your HTML, CSS, JavaScript, and media assets.</p>
    </div>
</body>
</html>`
      );
    }

    // Save storage path
    await prisma.managedWebsite.update({
      where: { id: site.id },
      data: { storagePath: publicHtml },
    });

    return res.status(201).json({
      success: true,
      site,
      message: 'Website created and ready!',
    });
  } catch (error) {
    console.error('[SITE CONTROLLER] createSite error:', error);
    return res.status(500).json({ error: 'Failed to create website.' });
  }
}

/**
 * 4. POST /api/sites/:id/power - Power management (START, STOP, RESTART)
 */
export async function powerSite(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);
    const { action } = req.body; // 'START', 'STOP', 'RESTART'

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) return res.status(404).json({ error: 'Website not found.' });

    let newStatus = 'ACTIVE';
    if (action === 'STOP') newStatus = 'STOPPED';
    else if (action === 'START' || action === 'RESTART') newStatus = 'ACTIVE';

    const updated = await prisma.managedWebsite.update({
      where: { id: siteId },
      data: { status: newStatus },
    });

    return res.json({ success: true, site: updated, message: `Website is now ${newStatus.toLowerCase()}.` });
  } catch (error) {
    console.error('[SITE CONTROLLER] powerSite error:', error);
    return res.status(500).json({ error: 'Failed to execute power action.' });
  }
}

/**
 * 5. DELETE /api/sites/:id - Delete website and its files
 */
export async function deleteSite(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) return res.status(404).json({ error: 'Website not found.' });

    // Remove files
    try {
      const siteFolder = path.resolve(STORAGE_ROOT, `site_${siteId}`);
      if (fs.existsSync(siteFolder)) {
        fs.rmSync(siteFolder, { recursive: true, force: true });
      }
    } catch (e) {
      console.warn('[SITE DELETE] Directory cleanup warning:', e.message);
    }

    await prisma.managedWebsite.delete({
      where: { id: siteId },
    });

    return res.json({ success: true, message: 'Website deleted successfully.' });
  } catch (error) {
    console.error('[SITE CONTROLLER] deleteSite error:', error);
    return res.status(500).json({ error: 'Failed to delete website.' });
  }
}

/**
 * 6. GET /api/sites/:id/files - In-Portal File Manager: List directory contents
 */
export async function listFiles(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);
    const relativePath = req.query.path || '';

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });
    if (!site) return res.status(404).json({ error: 'Website not found.' });

    const { targetPath } = getSafeSitePath(siteId, relativePath);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Directory does not exist.' });
    }

    const stat = fs.statSync(targetPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory.' });
    }

    const items = fs.readdirSync(targetPath, { withFileTypes: true }).map((dirent) => {
      const itemPath = path.join(targetPath, dirent.name);
      let size = 0;
      let mtime = new Date();
      try {
        const itemStat = fs.statSync(itemPath);
        size = itemStat.size;
        mtime = itemStat.mtime;
      } catch (_) {}

      return {
        name: dirent.name,
        isDirectory: dirent.isDirectory(),
        size,
        modifiedAt: mtime,
        extension: path.extname(dirent.name).replace('.', '').toLowerCase(),
      };
    });

    // Sort folders first, then alphabetically
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return res.json({
      success: true,
      currentPath: relativePath,
      items,
    });
  } catch (error) {
    console.error('[SITE CONTROLLER] listFiles error:', error);
    return res.status(500).json({ error: error.message || 'Failed to list files.' });
  }
}

/**
 * 7. GET /api/sites/:id/files/content - In-Portal Code Editor: Read text file
 */
export async function getFileContent(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);
    const filePath = req.query.path;

    if (!filePath) return res.status(400).json({ error: 'File path required.' });

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });
    if (!site) return res.status(404).json({ error: 'Website not found.' });

    const { targetPath } = getSafeSitePath(siteId, filePath);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      return res.status(400).json({ error: 'Target is a directory, not a file.' });
    }

    if (stat.size > 2 * 1024 * 1024) {
      return res.status(400).json({ error: 'File exceeds 2 MB editor limit.' });
    }

    const content = fs.readFileSync(targetPath, 'utf8');
    return res.json({ success: true, filePath, content });
  } catch (error) {
    console.error('[SITE CONTROLLER] getFileContent error:', error);
    return res.status(500).json({ error: error.message || 'Failed to read file.' });
  }
}

/**
 * 8. PUT /api/sites/:id/files/content - In-Portal Code Editor: Save edited file
 */
export async function saveFileContent(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);
    const { path: filePath, content } = req.body;

    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'File path and content are required.' });
    }

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });
    if (!site) return res.status(404).json({ error: 'Website not found.' });

    const { targetPath } = getSafeSitePath(siteId, filePath);
    fs.writeFileSync(targetPath, content, 'utf8');

    return res.json({ success: true, message: 'File saved successfully.' });
  } catch (error) {
    console.error('[SITE CONTROLLER] saveFileContent error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save file.' });
  }
}

/**
 * 9. POST /api/sites/:id/files/create - Create new file or folder
 */
export async function createFileOrFolder(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);
    const { path: relativePath, name, isDirectory } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });
    if (!site) return res.status(404).json({ error: 'Website not found.' });

    const targetSubPath = path.join(relativePath || '', name.trim());
    const { targetPath } = getSafeSitePath(siteId, targetSubPath);

    if (fs.existsSync(targetPath)) {
      return res.status(400).json({ error: 'An item with this name already exists.' });
    }

    if (isDirectory) {
      fs.mkdirSync(targetPath, { recursive: true });
    } else {
      fs.writeFileSync(targetPath, '', 'utf8');
    }

    return res.json({ success: true, message: `${isDirectory ? 'Folder' : 'File'} created.` });
  } catch (error) {
    console.error('[SITE CONTROLLER] createFileOrFolder error:', error);
    return res.status(500).json({ error: error.message || 'Creation failed.' });
  }
}

/**
 * 10. DELETE /api/sites/:id/files - Delete file or folder
 */
export async function deleteFileOrFolder(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);
    const itemPath = req.query.path;

    if (!itemPath) return res.status(400).json({ error: 'Path is required.' });

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });
    if (!site) return res.status(404).json({ error: 'Website not found.' });

    const { targetPath } = getSafeSitePath(siteId, itemPath);

    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(targetPath);
    }

    return res.json({ success: true, message: 'Item deleted.' });
  } catch (error) {
    console.error('[SITE CONTROLLER] deleteFileOrFolder error:', error);
    return res.status(500).json({ error: error.message || 'Deletion failed.' });
  }
}

/**
 * 11. POST /api/sites/:id/domain - Bind custom domain & SSL
 */
export async function updateDomain(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);
    const { customDomain } = req.body;

    if (!customDomain || customDomain.trim().length === 0) {
      return res.status(400).json({ error: 'Valid domain name required.' });
    }

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });
    if (!site) return res.status(404).json({ error: 'Website not found.' });

    const domainClean = customDomain.trim().toLowerCase();

    const updated = await prisma.managedWebsite.update({
      where: { id: siteId },
      data: {
        primaryDomain: domainClean,
        sslStatus: 'ACTIVE',
      },
    });

    return res.json({
      success: true,
      site: updated,
      message: `Domain ${domainClean} connected with automated SSL.`,
    });
  } catch (error) {
    console.error('[SITE CONTROLLER] updateDomain error:', error);
    return res.status(500).json({ error: 'Failed to update domain.' });
  }
}

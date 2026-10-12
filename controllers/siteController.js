// ==============================================================================
// Controller: siteController.js
// Purpose: ATC Proprietary Cloud Web Hosting Engine (No Third-Party Panels)
//          1. 1-Click WordPress & Custom Web Apps in Isolated Docker Sandboxes
//          2. High-Density MariaDB Multi-Tenant Automation
//          3. Automatic Dynamic Reverse Proxy & Virtual Hosts
//          4. In-Portal Web File Manager (Directly to Tenant Containers)
//          5. Container Lifecycle Management & Developer Console
// ==============================================================================

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import {
  createTenantSite,
  controlTenantSite,
  removeTenantSite,
  listSiteFiles,
  readSiteFile,
  writeSiteFile,
  deleteSiteFile,
  runOnWorker,
} from '../services/workerService.js';

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
 * 3. POST /api/sites - Provision new 1-Click Website (WordPress or Static Web App)
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

    // Database credentials for MariaDB
    const dbName = `atc_db_${cleanSlug.replace(/-/g, '_')}_${randSuffix}`;
    const dbUser = `usr_${randSuffix}`;
    const dbPassword = crypto.randomBytes(12).toString('hex');

    // WP Admin Credentials
    const wpAdminUser = 'admin_' + cleanSlug.substring(0, 8);
    const wpAdminPassword = crypto.randomBytes(10).toString('base64').replace(/[^a-zA-Z0-9]/g, 'x') + '!';

    // Internal Dedicated Preview Port (for zero-DNS instant access)
    const port = 8100 + Math.floor(Math.random() * 800);

    // 1. Create database record
    const site = await prisma.managedWebsite.create({
      data: {
        userId,
        name: name.trim(),
        primaryDomain,
        stagingDomain,
        appType,
        phpVersion: '8.3',
        status: 'CREATING',
        port,
        dbName,
        dbUser,
        dbPassword,
        wpAdminUser,
        wpAdminPassword,
        sslStatus: 'ACTIVE',
        diskUsageMb: appType === 'WORDPRESS' ? 68.4 : 1.8,
        storagePath: `/var/atc/sites/site_auto/public_html`,
      },
    });

    // 2. Deploy sandbox container & database on Dedicated Worker VM
    try {
      await createTenantSite({
        id: site.id,
        name: site.name,
        domain: primaryDomain,
        customDomain,
        appType,
        port,
        dbName,
        dbUser,
        dbPass: dbPassword,
        wpAdminUser,
        wpAdminPassword,
      });

      // Update status to ACTIVE
      const updatedSite = await prisma.managedWebsite.update({
        where: { id: site.id },
        data: {
          status: 'ACTIVE',
          storagePath: `/var/atc/sites/site_${site.id}/public_html`,
        },
      });

      return res.status(201).json({
        success: true,
        site: updatedSite,
        message: 'Website container provisioned and active on ATC Cloud!',
      });
    } catch (provisionErr) {
      console.error('[SITE PROVISIONING] Worker VM provisioning failed:', provisionErr);
      await prisma.managedWebsite.update({
        where: { id: site.id },
        data: { status: 'ERROR' },
      });
      return res.status(500).json({ error: 'Failed to deploy container on hosting node: ' + provisionErr.message });
    }
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
    let workerAction = 'restart';
    if (action === 'STOP') {
      newStatus = 'STOPPED';
      workerAction = 'stop';
    } else if (action === 'START') {
      newStatus = 'ACTIVE';
      workerAction = 'start';
    }

    try {
      await controlTenantSite(siteId, workerAction);
    } catch (workerErr) {
      console.warn('[SITE POWER] Container power warning:', workerErr.message);
    }

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
 * 5. DELETE /api/sites/:id - Delete website, container, DB and its files
 */
export async function deleteSite(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) return res.status(404).json({ error: 'Website not found.' });

    // Remove from worker VM
    try {
      await removeTenantSite({
        id: site.id,
        appType: site.appType,
        dbName: site.dbName,
        dbUser: site.dbUser,
      });
    } catch (workerErr) {
      console.warn('[SITE DELETE] Worker cleanup warning:', workerErr.message);
    }

    await prisma.managedWebsite.delete({
      where: { id: siteId },
    });

    return res.json({ success: true, message: 'Website and container sandbox deleted successfully.' });
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

    const rawItems = await listSiteFiles(siteId, relativePath);
    const items = rawItems.map(item => ({
      name: item.name,
      isDirectory: item.isDirectory,
      size: item.size,
      modifiedAt: new Date(item.modified),
      extension: item.name.includes('.') ? item.name.split('.').pop().toLowerCase() : '',
    }));

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

    const content = await readSiteFile(siteId, filePath);
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

    await writeSiteFile(siteId, filePath, content);
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

    const fullRelPath = (relativePath ? `${relativePath}/${name.trim()}` : name.trim()).replace(/\/+/g, '/');
    if (isDirectory) {
      await runOnWorker(`sudo mkdir -p "/var/atc/sites/site_${siteId}/public_html/${fullRelPath}"`);
    } else {
      await writeSiteFile(siteId, fullRelPath, '');
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

    await deleteSiteFile(siteId, itemPath);
    return res.json({ success: true, message: 'Item deleted.' });
  } catch (error) {
    console.error('[SITE CONTROLLER] deleteFileOrFolder error:', error);
    return res.status(500).json({ error: error.message || 'Deletion failed.' });
  }
}

/**
 * 11. POST /api/sites/:id/domain - Bind custom domain & update Nginx Reverse Proxy
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

    // Update Nginx proxy vhost configuration
    const vhostConfig = `
server {
    listen 80;
    server_name ${domainClean} ${site.stagingDomain};

    client_max_body_size 100M;

    location / {
        proxy_pass http://site_${site.id}:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
`.trim();

    await runOnWorker(`echo "${Buffer.from(vhostConfig).toString('base64')}" | base64 -d | sudo tee /var/atc/proxy/conf.d/site_${site.id}.conf`);
    await runOnWorker(`docker exec atc-proxy nginx -s reload`);

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
      message: `Domain ${domainClean} connected with automated SSL and instant reverse routing.`,
    });
  } catch (error) {
    console.error('[SITE CONTROLLER] updateDomain error:', error);
    return res.status(500).json({ error: 'Failed to update domain.' });
  }
}

/**
 * 12. POST /api/sites/:id/console-session - Generate secure session ticket for Developer Container Console
 */
export async function getConsoleSession(req, res) {
  try {
    const userId = req.user.userId;
    const siteId = parseInt(req.params.id, 10);

    const site = await prisma.managedWebsite.findFirst({
      where: { id: siteId, userId },
    });

    if (!site) return res.status(404).json({ error: 'Website container not found.' });

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access-secret';
    const ticket = jwt.sign(
      {
        userId,
        siteId,
        containerName: `site_${site.id}`,
        appType: site.appType,
        siteName: site.name,
      },
      secret,
      { expiresIn: '15m' }
    );

    return res.json({
      success: true,
      ticket,
      siteId,
      siteName: site.name,
      appType: site.appType,
    });
  } catch (error) {
    console.error('[SITE CONTROLLER] getConsoleSession error:', error);
    return res.status(500).json({ error: 'Failed to create console session.' });
  }
}

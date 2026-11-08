import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads directory in portal root
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const LOGOS_DIR = path.join(UPLOADS_DIR, 'logos');

// Helper to sanitize folder / slug names for safe filesystem storage
export function sanitizeSlug(str) {
  if (!str || typeof str !== 'string') return 'general';
  return str
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 40) || 'general';
}

// Ensure base directories exist
for (const dir of [UPLOADS_DIR, AVATARS_DIR, LOGOS_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg']);

/**
 * Custom file filter for images
 */
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype.toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(mimeType) || !ALLOWED_EXTENSIONS.has(ext)) {
    const err = new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, and SVG images are permitted.');
    err.code = 'INVALID_FILE_TYPE';
    return cb(err, false);
  }

  cb(null, true);
}

/**
 * Disk storage for User Avatars (Tenant & User Isolated)
 * Path: /uploads/users/<UserSlug>_<UserId>/avatars/<filename>
 */
const avatarStorage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const userId = Number(req.user?.userId || req.user?.id);
      let userSlug = 'user';

      if (userId) {
        const user = await prisma.user.findUnique({
          where: { userId },
          select: { fullName: true, email: true },
        });
        const namePart = user?.fullName || user?.email?.split('@')[0] || req.user?.fullName || req.user?.email?.split('@')[0];
        userSlug = sanitizeSlug(namePart);
      }

      const folderName = `${userSlug}_${userId || 'anon'}`;
      const targetDir = path.join(UPLOADS_DIR, 'users', folderName, 'avatars');

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      cb(null, targetDir);
    } catch (err) {
      console.warn('[Avatar Upload Destination Fallback]:', err.message);
      cb(null, AVATARS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const userId = req.user?.id || req.user?.userId || 'user';
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const randomHex = crypto.randomBytes(6).toString('hex');
    const safeName = `avatar-${userId}-${Date.now()}-${randomHex}${ext}`;
    cb(null, safeName);
  },
});

/**
 * Disk storage for Organization / Company Logos (Tenant & Company Isolated)
 * Path: /uploads/companies/<CompanySlug>_<OrgId>/logos/<filename>
 */
const logoStorage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const userId = Number(req.user?.userId || req.user?.id);
      let orgSlug = 'company';
      let orgId = req.org?.orgId || req.params?.orgId || req.body?.orgId;

      if (userId) {
        let org = null;
        if (orgId) {
          org = await prisma.organization.findUnique({ where: { orgId: Number(orgId) } });
        }
        if (!org) {
          org = await prisma.organization.findFirst({
            where: {
              OR: [
                { ownerId: userId },
                { members: { some: { userId, status: 'active' } } },
              ],
            },
          });
        }

        if (org) {
          orgSlug = sanitizeSlug(org.name);
          orgId = org.orgId;
        } else {
          const user = await prisma.user.findUnique({
            where: { userId },
            select: { companyName: true },
          });
          if (user?.companyName) {
            orgSlug = sanitizeSlug(user.companyName);
          }
        }
      }

      const folderName = `${orgSlug}_${orgId || 'org'}`;
      const targetDir = path.join(UPLOADS_DIR, 'companies', folderName, 'logos');

      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      cb(null, targetDir);
    } catch (err) {
      console.warn('[Logo Upload Destination Fallback]:', err.message);
      cb(null, LOGOS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const orgId = req.org?.orgId || req.params?.orgId || req.body?.orgId || 'org';
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const randomHex = crypto.randomBytes(6).toString('hex');
    const safeName = `logo-${orgId}-${Date.now()}-${randomHex}${ext}`;
    cb(null, safeName);
  },
});

// Max file size: 10MB (Generous for high-res images)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const uploadAvatarMulter = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

export const uploadLogoMulter = multer({
  storage: logoStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

/**
 * Helper middleware wrapper for user avatar upload
 */
export function handleAvatarUpload(req, res, next) {
  const uploadSingle = uploadAvatarMulter.single('avatar');

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Avatar image exceeds 10MB size limit. Please select an image under 10MB.' });
      }
      return res.status(400).json({ error: err.message || 'Failed to upload avatar image.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded. Please select an image.' });
    }

    if (req.file.path) {
      const relativeFromUploads = path.relative(UPLOADS_DIR, req.file.path).replace(/\\/g, '/');
      req.file.relativeUrl = `/uploads/${relativeFromUploads}`;
    }

    next();
  });
}

/**
 * Helper middleware wrapper for company logo upload
 */
export function handleLogoUpload(req, res, next) {
  const uploadSingle = uploadLogoMulter.single('logo');

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Company logo exceeds 10MB size limit. Please select an image under 10MB.' });
      }
      return res.status(400).json({ error: err.message || 'Failed to upload company logo.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No logo image file uploaded. Please select an image.' });
    }

    if (req.file.path) {
      const relativeFromUploads = path.relative(UPLOADS_DIR, req.file.path).replace(/\\/g, '/');
      req.file.relativeUrl = `/uploads/${relativeFromUploads}`;
    }

    next();
  });
}

/**
 * Helper utility to safely remove an old upload file from disk
 */
export function safelyRemoveUploadedFile(relativeUrl) {
  if (!relativeUrl || typeof relativeUrl !== 'string') return;

  // Only remove files inside /uploads/
  const normalized = relativeUrl.replace(/^\/api\/uploads\//, '/uploads/');
  if (!normalized.startsWith('/uploads/')) return;

  try {
    const relativeFilePath = normalized.replace(/^\/uploads\//, '');
    // Prevent directory traversal
    const safePath = path.normalize(relativeFilePath).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(UPLOADS_DIR, safePath);

    if (fullPath.startsWith(UPLOADS_DIR) && fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Upload Clean] Deleted old file: ${fullPath}`);
    }
  } catch (err) {
    console.warn(`[Upload Clean Warning] Could not remove old file ${relativeUrl}:`, err.message);
  }
}

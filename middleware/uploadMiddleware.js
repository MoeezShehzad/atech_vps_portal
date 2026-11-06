import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base uploads directory in portal root
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const LOGOS_DIR = path.join(UPLOADS_DIR, 'logos');

// Ensure directories exist
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
 * Disk storage for User Avatars
 */
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, AVATARS_DIR);
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
 * Disk storage for Organization / Company Logos
 */
const logoStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, LOGOS_DIR);
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

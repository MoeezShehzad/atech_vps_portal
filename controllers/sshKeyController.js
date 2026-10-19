import crypto from 'crypto';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { execFile } from 'child_process';
import prisma from '../lib/prisma.js';

/**
 * Calculate standard OpenSSH SHA256 fingerprint for a public key string
 */
function calculateFingerprint(publicKeyStr) {
  try {
    const parts = publicKeyStr.trim().split(/\s+/);
    if (parts.length < 2) return null;
    const keyData = Buffer.from(parts[1], 'base64');
    const hash = crypto.createHash('sha256').update(keyData).digest('base64');
    // Remove padding per OpenSSH standard
    return `SHA256:${hash.replace(/=+$/, '')}`;
  } catch (e) {
    return null;
  }
}

/**
 * 1. GET /api/ssh-keys - Retrieve user's saved SSH keys
 */
export async function getSSHKeys(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const keys = await prisma.sSHKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        keyId: true,
        name: true,
        fingerprint: true,
        keyType: true,
        publicKey: true,
        createdAt: true,
      },
    });

    return res.json({ success: true, keys });
  } catch (error) {
    console.error('[SSH Keys] Error fetching keys:', error);
    return res.status(500).json({ error: 'Failed to retrieve SSH keys.' });
  }
}

/**
 * 2. POST /api/ssh-keys - Save a public SSH key
 */
export async function addSSHKey(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, publicKey } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'A descriptive key name is required.' });
    }
    if (!publicKey || !publicKey.trim()) {
      return res.status(400).json({ error: 'SSH public key content is required.' });
    }

    const cleanKey = publicKey.trim();
    const parts = cleanKey.split(/\s+/);
    const validPrefixes = ['ssh-rsa', 'ssh-ed25519', 'ecdsa-sha2-nistp256', 'ecdsa-sha2-nistp384', 'ecdsa-sha2-nistp521'];
    
    if (parts.length < 2 || !validPrefixes.includes(parts[0])) {
      return res.status(400).json({
        error: 'Invalid SSH key format. Must begin with ssh-rsa, ssh-ed25519, or ecdsa-... followed by base64 data.',
      });
    }

    const fingerprint = calculateFingerprint(cleanKey);
    if (!fingerprint) {
      return res.status(400).json({ error: 'Failed to parse public key base64 data.' });
    }

    const keyType = parts[0].toUpperCase().replace('SSH-', '');

    const newKey = await prisma.sSHKey.create({
      data: {
        userId,
        name: name.trim(),
        publicKey: cleanKey,
        fingerprint,
        keyType,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'SSH key added successfully.',
      key: {
        keyId: newKey.keyId,
        name: newKey.name,
        fingerprint: newKey.fingerprint,
        keyType: newKey.keyType,
        publicKey: newKey.publicKey,
        createdAt: newKey.createdAt,
      },
    });
  } catch (error) {
    console.error('[SSH Keys] Error adding key:', error);
    return res.status(500).json({ error: 'Failed to save SSH key.' });
  }
}

/**
 * 3. DELETE /api/ssh-keys/:keyId - Remove an SSH key
 */
export async function deleteSSHKey(req, res) {
  try {
    const userId = req.user?.userId;
    const keyId = Number(req.params.keyId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const existing = await prisma.sSHKey.findFirst({
      where: { keyId, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'SSH key not found or unauthorized.' });
    }

    await prisma.sSHKey.delete({
      where: { keyId },
    });

    return res.json({ success: true, message: 'SSH key deleted successfully.' });
  } catch (error) {
    console.error('[SSH Keys] Error deleting key:', error);
    return res.status(500).json({ error: 'Failed to delete SSH key.' });
  }
}

/**
 * 4. POST /api/ssh-keys/generate - Generate a brand new Ed25519 key pair
 */
export async function generateSSHKeyPair(req, res) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const keyName = req.body.name?.trim() || `ATC-Key-${Date.now().toString().slice(-4)}`;
    const tempKeyFile = path.join(os.tmpdir(), `atc_ssh_${Date.now()}_${Math.floor(Math.random() * 10000)}`);

    execFile(
      'ssh-keygen',
      ['-t', 'ed25519', '-N', '', '-C', `${keyName}@atc-cloud`, '-f', tempKeyFile],
      async (err) => {
        if (err) {
          console.error('[SSH Keys] ssh-keygen generation failed:', err);
          return res.status(500).json({ error: 'Failed to generate SSH key pair.' });
        }

        try {
          const privateKey = fs.readFileSync(tempKeyFile, 'utf8');
          const publicKey = fs.readFileSync(`${tempKeyFile}.pub`, 'utf8').trim();

          // Cleanup temp files
          fs.unlinkSync(tempKeyFile);
          fs.unlinkSync(`${tempKeyFile}.pub`);

          const fingerprint = calculateFingerprint(publicKey) || 'SHA256:Generated';

          // Save public key into database
          const savedKey = await prisma.sSHKey.create({
            data: {
              userId,
              name: keyName,
              publicKey,
              fingerprint,
              keyType: 'ED25519',
            },
          });

          return res.status(201).json({
            success: true,
            message: 'SSH key pair generated and public key saved to your account.',
            key: savedKey,
            privateKey, // Returned once so user can download it
          });
        } catch (readErr) {
          console.error('[SSH Keys] Error reading generated keys:', readErr);
          return res.status(500).json({ error: 'Failed to read generated key pair.' });
        }
      }
    );
  } catch (error) {
    console.error('[SSH Keys] Error in generate key:', error);
    return res.status(500).json({ error: 'Failed to process key generation request.' });
  }
}

import crypto from 'crypto';

// Reversible AES-256-GCM encryption for VM credentials at rest in the database.
// Secret key derived from VM_ENCRYPTION_SECRET, JWT_SECRET, or fallback consistent hash.
const SECRET_SEED = process.env.VM_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'atc_cloud_super_secret_vm_key_2026';
const KEY = crypto.createHash('sha256').update(SECRET_SEED).digest(); // 32 bytes for aes-256
const ALGO = 'aes-256-gcm';
const PREFIX = '$enc$gcm$v1$';

/**
 * Encrypt a plaintext VM password for safe database storage
 * @param {string} plaintext
 * @returns {string} Encrypted ciphertext string starting with $enc$gcm$v1$
 */
export function encryptVmPassword(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') {
    return '';
  }

  // If already encrypted, return as-is
  if (typeof plaintext === 'string' && plaintext.startsWith(PREFIX)) {
    return plaintext;
  }

  try {
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv(ALGO, KEY, iv);
    
    let encrypted = cipher.update(String(plaintext), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: $enc$gcm$v1$<iv_hex>$<authTag_hex>$<encrypted_hex>
    return `${PREFIX}${iv.toString('hex')}$${authTag}$${encrypted}`;
  } catch (err) {
    console.error('[CryptoService] Failed to encrypt VM password:', err.message);
    return plaintext; // Fallback to avoid breaking operations
  }
}

/**
 * Decrypt a stored ciphertext VM password back to plaintext for RDP / SSH operations
 * Gracefully handles legacy unencrypted passwords without errors.
 * @param {string} ciphertextOrPlaintext
 * @returns {string} Plaintext password
 */
export function decryptVmPassword(ciphertextOrPlaintext) {
  if (ciphertextOrPlaintext === null || ciphertextOrPlaintext === undefined || ciphertextOrPlaintext === '') {
    return '';
  }

  const str = String(ciphertextOrPlaintext);

  // If not prefixed with our encryption marker, it's a legacy unencrypted password: return as-is
  if (!str.startsWith(PREFIX)) {
    return str;
  }

  try {
    const parts = str.slice(PREFIX.length).split('$');
    if (parts.length !== 3) {
      console.warn('[CryptoService] Invalid encrypted payload format, returning string');
      return str;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGO, KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('[CryptoService] Failed to decrypt VM password:', err.message);
    return str;
  }
}

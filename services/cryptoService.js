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

// ==============================================================================
// Obfuscated Resource Identifiers (Cloud Provider Style: e.g. vps_87592f38...)
// High-entropy, non-sequential, tamper-resistant reversible IDs (No IDOR scraping)
// ==============================================================================
const RES_MAGIC = 0x41544331; // 'ATC1'

/**
 * Encodes an integer database ID into a secure opaque resource identifier
 * e.g., encodeResourceId('vps', 2961) -> "vps_87592f38044f9e1235608375faf3e2d4"
 * @param {string} prefix - e.g. 'vps', 'inv', 'sub'
 * @param {number|string} id - integer primary key
 * @returns {string} Obfuscated identifier
 */
export function encodeResourceId(prefix, id) {
  const num = Number(id);
  if (!num || isNaN(num)) return String(id || '');

  try {
    const cipher = crypto.createCipheriv('aes-256-ecb', KEY, null);
    cipher.setAutoPadding(false);
    const buf = Buffer.alloc(16, 0);
    buf.writeUInt32BE(RES_MAGIC, 0);
    buf.writeBigUInt64BE(BigInt(num), 8);
    const enc = Buffer.concat([cipher.update(buf), cipher.final()]);
    const hex = enc.toString('hex');
    return prefix ? `${prefix}_${hex}` : hex;
  } catch (err) {
    console.error('[CryptoService] Failed to encode resource ID:', err.message);
    return String(id);
  }
}

/**
 * Decodes an opaque resource identifier or integer back to its numeric database ID
 * Accepts both obfuscated tokens ("vps_8759...") and legacy numeric IDs (2961 or "2961")
 * @param {string|number} encoded - token or numeric ID
 * @returns {number|null} Integer ID or null if invalid
 */
export function decodeResourceId(encoded) {
  if (encoded === null || encoded === undefined || encoded === '') return null;
  if (typeof encoded === 'number') return encoded;

  const s = String(encoded).trim();
  // Fast path: if already pure numeric, return as integer
  if (/^\d+$/.test(s)) {
    return parseInt(s, 10);
  }

  const idx = s.indexOf('_');
  const hex = idx !== -1 ? s.slice(idx + 1) : s;
  if (hex.length !== 32) return null;

  try {
    const decipher = crypto.createDecipheriv('aes-256-ecb', KEY, null);
    decipher.setAutoPadding(false);
    const buf = Buffer.from(hex, 'hex');
    const dec = Buffer.concat([decipher.update(buf), decipher.final()]);
    if (dec.readUInt32BE(0) !== RES_MAGIC) return null;
    return Number(dec.readBigUInt64BE(8));
  } catch (err) {
    return null;
  }
}


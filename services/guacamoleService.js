import crypto from 'crypto';
import GuacamoleLite from 'guacamole-lite';

// Derived 32-byte key for AES-256-CBC encryption of Guacamole connection tokens
const GUAC_SECRET = process.env.GUACAMOLE_SECRET || process.env.JWT_SECRET || 'atc_cloud_guacamole_master_secret_2026!';
const GUAC_KEY = crypto.createHash('sha256').update(GUAC_SECRET).digest();

/**
 * Encrypt a Guacamole connection payload into a secure base64 token
 * readable by guacamole-lite's Crypt decipher.
 */
export function generateGuacamoleToken(connectionData) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('AES-256-CBC', GUAC_KEY, iv);

  let encrypted = cipher.update(JSON.stringify(connectionData), 'utf8', 'binary');
  encrypted += cipher.final('binary');

  const payload = {
    iv: Buffer.from(iv).toString('base64'),
    value: Buffer.from(encrypted, 'binary').toString('base64'),
  };

  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Build default optimized RDP settings for private Windows VMs behind NAT
 */
export function buildRdpConnectionPayload({ ip, username, password, width = 1280, height = 720 }) {
  return {
    connection: {
      type: 'rdp',
      settings: {
        hostname: ip,
        port: '3389',
        username: username || 'Administrator',
        password: password || '',
        'ignore-cert': 'true',
        'security': 'any',
        'color-depth': '16',             // High performance 16-bit color (saves 50% RAM/CPU/BW)
        'disable-wallpaper': 'true',       // Cut bandwidth & CPU
        'disable-theming': 'true',
        'disable-font-smoothing': 'true',
        'disable-full-window-drag': 'true',
        'disable-menu-animations': 'true',
        'resize-method': 'display-update', // Seamless dynamic resizing in modern RDP
        'enable-audio': 'true',
        'enable-clipboard': 'true',
        'width': String(width),
        'height': String(height),
        'dpi': '96',
      },
    },
  };
}

let guacServerInstance = null;

/**
 * Initialize GuacamoleLite WebSocket server and bridge
 */
export function setupGuacamoleWebSocket(server) {
  const guacdHost = process.env.GUACD_HOST || '172.21.39.51';
  const guacdPort = parseInt(process.env.GUACD_PORT || '4822', 10);

  guacServerInstance = new GuacamoleLite(
    {
      server: undefined,
      noServer: true,
    },
    {
      host: guacdHost,
      port: guacdPort,
    },
    {
      crypt: {
        cypher: 'AES-256-CBC',
        key: GUAC_KEY,
      },
      log: {
        level: 20, // NORMAL
        stdLog: (...args) => console.log('[Guacamole Gateway]:', ...args),
        errorLog: (...args) => console.error('[Guacamole Gateway Error]:', ...args),
      },
    }
  );

  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      if (url.pathname === '/ws/guacamole' || url.pathname === '/api/ws/guacamole') {
        guacServerInstance.webSocketServer.handleUpgrade(request, socket, head, (ws) => {
          if (ws._socket) {
            ws._socket.setNoDelay(true);
          }
          guacServerInstance.webSocketServer.emit('connection', ws, request);
        });
      }
    } catch (e) {
      console.error('[Guacamole Gateway Upgrade Error]:', e.message);
    }
  });

  console.log(`[Guacamole Gateway] Initialized and attached to /ws/guacamole (guacd at ${guacdHost}:${guacdPort})`);
  return guacServerInstance;
}

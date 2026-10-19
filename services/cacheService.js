// ==============================================================================
// Service: cacheService.js
// Purpose: High-performance, zero-dependency in-memory TTL caching layer
//          for caching expensive database queries and API responses.
// ==============================================================================

class MemoryCache {
  constructor(defaultTtlMs = 5 * 60 * 1000) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;

    // Background eviction interval every 60 seconds
    setInterval(() => this.cleanup(), 60000).unref();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set(key, data, ttlMs = this.defaultTtlMs) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  del(key) {
    this.cache.delete(key);
  }

  delPrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  flush() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new MemoryCache();
export default apiCache;

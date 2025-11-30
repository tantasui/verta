/**
 * LRU (Least Recently Used) Cache implementation
 * with a maximum size limit in bytes
 */

interface CacheEntry {
  data: ArrayBuffer;
  timestamp: number;
  size: number;
}

export class LRUCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number; // Maximum size in bytes
  private currentSize: number;

  constructor(maxSizeInMB: number = 500) {
    this.cache = new Map();
    this.maxSize = maxSizeInMB * 1024 * 1024; // Convert MB to bytes
    this.currentSize = 0;
  }

  /**
   * Get a value from cache
   */
  get(key: string): ArrayBuffer | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Update timestamp (LRU)
    entry.timestamp = Date.now();
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Set a value in cache
   */
  set(key: string, data: ArrayBuffer): void {
    const size = data.byteLength;

    // If the data is larger than max size, don't cache it
    if (size > this.maxSize) {
      console.warn(`Data size (${size} bytes) exceeds cache max size (${this.maxSize} bytes)`);
      return;
    }

    // If key already exists, remove it first
    if (this.cache.has(key)) {
      const existingEntry = this.cache.get(key)!;
      this.currentSize -= existingEntry.size;
      this.cache.delete(key);
    }

    // Evict oldest entries until we have enough space
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictOldest();
    }

    // Add new entry
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      size
    };

    this.cache.set(key, entry);
    this.currentSize += size;
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    entries: number;
    utilizationPercent: number;
  } {
    return {
      size: this.currentSize,
      maxSize: this.maxSize,
      entries: this.cache.size,
      utilizationPercent: (this.currentSize / this.maxSize) * 100
    };
  }

  /**
   * Evict the oldest (least recently used) entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.currentSize -= entry.size;
      this.cache.delete(oldestKey);
      console.log(`Evicted cache entry: ${oldestKey} (${entry.size} bytes)`);
    }
  }
}

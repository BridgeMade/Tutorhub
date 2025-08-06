import { supabase } from '../lib/supabase';
import { logger, LogCategory } from '../lib/logger';

// ===========================================
// CACHE SERVICE - PERFORMANCE OPTIMIZATION
// ===========================================

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  tags?: string[];
}

export interface CacheConfig {
  defaultTTL: number;
  maxEntries: number;
  enableCompression: boolean;
  enablePersistence: boolean;
  persistenceKey: string;
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  lastCleanup: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;
  private lastCleanup = Date.now();
  
  private readonly config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxEntries: 1000,
    enableCompression: false,
    enablePersistence: true,
    persistenceKey: 'tutorhub_cache'
  };

  constructor() {
    this.loadFromPersistence();
    this.startCleanupInterval();
  }

  /**
   * Get cached data by key
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      logger.debug(LogCategory.PERFORMANCE, `Cache miss for key: ${key}`);
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.misses++;
      logger.debug(LogCategory.PERFORMANCE, `Cache expired for key: ${key}`);
      return null;
    }

    this.hits++;
    logger.debug(LogCategory.PERFORMANCE, `Cache hit for key: ${key}`);
    return entry.data as T;
  }

  /**
   * Set cached data with optional TTL and tags
   */
  async set<T>(
    key: string, 
    data: T, 
    ttl: number = this.config.defaultTTL,
    tags: string[] = []
  ): Promise<void> {
    // Check cache size limit
    if (this.cache.size >= this.config.maxEntries) {
      await this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: Date.now(),
      ttl,
      tags
    };

    this.cache.set(key, entry);
    
    // Persist to localStorage if enabled
    if (this.config.enablePersistence) {
      this.saveToPersistence();
    }

    logger.debug(LogCategory.PERFORMANCE, `Cached data for key: ${key}`, {
      ttl,
      tags,
      size: JSON.stringify(data).length
    });
  }

  /**
   * Remove specific cache entry
   */
  async delete(key: string): Promise<boolean> {
    const deleted = this.cache.delete(key);
    
    if (deleted && this.config.enablePersistence) {
      this.saveToPersistence();
      logger.debug(LogCategory.PERFORMANCE, `Removed cache entry: ${key}`);
    }

    return deleted;
  }

  /**
   * Clear cache entries by tags
   */
  async clearByTags(tags: string[]): Promise<number> {
    let cleared = 0;
    
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.tags?.some((tag: string) => tags.includes(tag))) {
        this.cache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0 && this.config.enablePersistence) {
      this.saveToPersistence();
      logger.info(LogCategory.PERFORMANCE, `Cleared ${cleared} cache entries by tags`, { tags });
    }

    return cleared;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    const size = this.cache.size;
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    
    if (this.config.enablePersistence) {
      localStorage.removeItem(this.config.persistenceKey);
    }

    logger.info(LogCategory.PERFORMANCE, `Cleared all cache entries`, { previousSize: size });
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    
    return {
      totalEntries: this.cache.size,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
      missRate: total > 0 ? (this.misses / total) * 100 : 0,
      totalHits: this.hits,
      totalMisses: this.misses,
      memoryUsage: this.calculateMemoryUsage(),
      lastCleanup: this.lastCleanup
    };
  }

  /**
   * Cached API call wrapper
   */
  async cachedCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    ttl?: number,
    tags?: string[]
  ): Promise<T> {
    // Try to get from cache first
    const cachedData = await this.get<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }

    // Execute API call
    try {
      const data = await apiCall();
      await this.set(key, data, ttl, tags);
      return data;
    } catch (error) {
      logger.error(LogCategory.PERFORMANCE, `Failed to execute cached API call`, error as Error, { key });
      throw error;
    }
  }

  /**
   * Cached Supabase query wrapper
   */
  async cachedQuery<T>(
    key: string,
    query: () => Promise<{ data: T | null; error: any }>,
    ttl?: number,
    tags?: string[]
  ): Promise<{ data: T | null; error: any }> {
    return this.cachedCall(
      key,
      async () => {
        const result = await query();
        if (result.error) {
          throw new Error(result.error.message);
        }
        return result;
      },
      ttl,
      tags
    );
  }

  // ===========================================
  // PRIVATE METHODS
  // ===========================================

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private async evictOldest(): Promise<void> {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(LogCategory.PERFORMANCE, `Evicted oldest cache entry: ${oldestKey}`);
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup(): void {
    const before = this.cache.size;
    let cleaned = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    this.lastCleanup = Date.now();

    if (cleaned > 0) {
      if (this.config.enablePersistence) {
        this.saveToPersistence();
      }
      
      logger.debug(LogCategory.PERFORMANCE, `Cache cleanup completed`, {
        before,
        after: this.cache.size,
        cleaned
      });
    }
  }

  private calculateMemoryUsage(): number {
    let total = 0;
    
    for (const entry of Array.from(this.cache.values())) {
      total += JSON.stringify(entry).length;
    }

    return total;
  }

  private saveToPersistence(): void {
    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(cacheData));
    } catch (error) {
      logger.warn(LogCategory.PERFORMANCE, 'Failed to persist cache to localStorage', { error });
    }
  }

  private loadFromPersistence(): void {
    try {
      const stored = localStorage.getItem(this.config.persistenceKey);
      if (stored) {
        const cacheData: [string, CacheEntry][] = JSON.parse(stored);
        
        // Filter out expired entries during load
        const validEntries = cacheData.filter(([, entry]) => !this.isExpired(entry));
        
        this.cache = new Map(validEntries);
        
        logger.debug(LogCategory.PERFORMANCE, 'Loaded cache from persistence', {
          total: cacheData.length,
          valid: validEntries.length
        });
      }
    } catch (error) {
      logger.warn(LogCategory.PERFORMANCE, 'Failed to load cache from localStorage', { error });
    }
  }
}

// ===========================================
// CACHE KEY GENERATORS
// ===========================================

export class CacheKeys {
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static userProfile(userId: string): string {
    return `user:profile:${userId}`;
  }

  static sessions(userId: string, status?: string): string {
    return `sessions:${userId}${status ? `:${status}` : ''}`;
  }

  static tutors(subject?: string, location?: string): string {
    return `tutors${subject ? `:subject:${subject}` : ''}${location ? `:location:${location}` : ''}`;
  }

  static subjects(): string {
    return 'subjects:all';
  }

  static resources(sessionId?: string, userId?: string): string {
    return `resources${sessionId ? `:session:${sessionId}` : ''}${userId ? `:user:${userId}` : ''}`;
  }

  static messages(conversationId: string): string {
    return `messages:${conversationId}`;
  }

  static notifications(userId: string): string {
    return `notifications:${userId}`;
  }

  static dashboard(userId: string, role: string): string {
    return `dashboard:${role}:${userId}`;
  }

  static analytics(type: string, period: string): string {
    return `analytics:${type}:${period}`;
  }
}

// ===========================================
// CACHE TAGS
// ===========================================

export class CacheTags {
  static readonly USER = 'user';
  static readonly SESSION = 'session';
  static readonly TUTOR = 'tutor';
  static readonly RESOURCE = 'resource';
  static readonly MESSAGE = 'message';
  static readonly NOTIFICATION = 'notification';
  static readonly SUBJECT = 'subject';
  static readonly DASHBOARD = 'dashboard';
  static readonly ANALYTICS = 'analytics';

  static userTag(userId: string): string {
    return `${this.USER}:${userId}`;
  }

  static sessionTag(sessionId: string): string {
    return `${this.SESSION}:${sessionId}`;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
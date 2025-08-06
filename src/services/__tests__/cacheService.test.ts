import { cacheService, CacheKeys, CacheTags } from '../cacheService';
import { mockLocalStorage } from '../../utils/testUtils';

// ===========================================
// CACHE SERVICE UNIT TESTS
// ===========================================

describe('CacheService', () => {
  beforeEach(() => {
    // Clear cache before each test
    cacheService.clear();
    jest.clearAllMocks();
  });

  describe('Basic Cache Operations', () => {
    test('should set and get cache entries', async () => {
      const key = 'test-key';
      const data = { message: 'Hello, World!' };

      await cacheService.set(key, data);
      const result = await cacheService.get(key);

      expect(result).toEqual(data);
    });

    test('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('should delete cache entries', async () => {
      const key = 'test-key';
      const data = { message: 'Hello, World!' };

      await cacheService.set(key, data);
      const deleted = await cacheService.delete(key);
      const result = await cacheService.get(key);

      expect(deleted).toBe(true);
      expect(result).toBeNull();
    });

    test('should clear all cache entries', async () => {
      await cacheService.set('key1', 'data1');
      await cacheService.set('key2', 'data2');

      await cacheService.clear();

      const result1 = await cacheService.get('key1');
      const result2 = await cacheService.get('key2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('TTL (Time To Live) Functionality', () => {
    test('should expire entries after TTL', async () => {
      const key = 'expiring-key';
      const data = { message: 'This will expire' };
      const shortTTL = 50; // 50ms

      await cacheService.set(key, data, shortTTL);

      // Should be available immediately
      const result1 = await cacheService.get(key);
      expect(result1).toEqual(data);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be expired
      const result2 = await cacheService.get(key);
      expect(result2).toBeNull();
    });

    test('should use default TTL when not specified', async () => {
      const key = 'default-ttl-key';
      const data = { message: 'Using default TTL' };

      await cacheService.set(key, data);
      const result = await cacheService.get(key);

      expect(result).toEqual(data);
    });
  });

  describe('Tag-based Cache Invalidation', () => {
    test('should clear entries by tags', async () => {
      await cacheService.set('user1', { name: 'John' }, 5000, ['user']);
      await cacheService.set('user2', { name: 'Jane' }, 5000, ['user']);
      await cacheService.set('session1', { id: 'sess1' }, 5000, ['session']);

      const cleared = await cacheService.clearByTags(['user']);

      expect(cleared).toBe(2);
      expect(await cacheService.get('user1')).toBeNull();
      expect(await cacheService.get('user2')).toBeNull();
      expect(await cacheService.get('session1')).toEqual({ id: 'sess1' });
    });

    test('should handle empty tag arrays', async () => {
      await cacheService.set('key1', 'data1', 5000, ['tag1']);
      
      const cleared = await cacheService.clearByTags([]);
      
      expect(cleared).toBe(0);
      expect(await cacheService.get('key1')).toEqual('data1');
    });
  });

  describe('Cache Statistics', () => {
    test('should track hit and miss rates', async () => {
      // Set some data
      await cacheService.set('key1', 'data1');
      await cacheService.set('key2', 'data2');

      // Generate hits
      await cacheService.get('key1');
      await cacheService.get('key2');
      await cacheService.get('key1'); // Another hit

      // Generate misses
      await cacheService.get('nonexistent1');
      await cacheService.get('nonexistent2');

      const stats = cacheService.getStats();

      expect(stats.totalHits).toBe(3);
      expect(stats.totalMisses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(60, 1); // 3/(3+2) = 60%
      expect(stats.missRate).toBeCloseTo(40, 1); // 2/(3+2) = 40%
    });

    test('should track total entries', async () => {
      await cacheService.set('key1', 'data1');
      await cacheService.set('key2', 'data2');
      await cacheService.set('key3', 'data3');

      const stats = cacheService.getStats();
      expect(stats.totalEntries).toBe(3);
    });
  });

  describe('Cached API Calls', () => {
    test('should cache API call results', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'api-result' });
      const key = 'api-cache-key';

      // First call should execute API
      const result1 = await cacheService.cachedCall(key, mockApiCall);
      expect(result1).toEqual({ data: 'api-result' });
      expect(mockApiCall).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await cacheService.cachedCall(key, mockApiCall);
      expect(result2).toEqual({ data: 'api-result' });
      expect(mockApiCall).toHaveBeenCalledTimes(1); // Not called again
    });

    test('should handle API call failures', async () => {
      const mockApiCall = jest.fn().mockRejectedValue(new Error('API Error'));
      const key = 'failing-api-key';

      await expect(cacheService.cachedCall(key, mockApiCall)).rejects.toThrow('API Error');
      expect(mockApiCall).toHaveBeenCalledTimes(1);
    });

    test('should cache Supabase query results', async () => {
      const mockQuery = jest.fn().mockResolvedValue({
        data: [{ id: 1, name: 'Test' }],
        error: null
      });
      const key = 'supabase-cache-key';

      const result1 = await cacheService.cachedQuery(key, mockQuery);
      expect(result1.data).toEqual([{ id: 1, name: 'Test' }]);
      expect(mockQuery).toHaveBeenCalledTimes(1);

      const result2 = await cacheService.cachedQuery(key, mockQuery);
      expect(result2.data).toEqual([{ id: 1, name: 'Test' }]);
      expect(mockQuery).toHaveBeenCalledTimes(1); // Cached
    });
  });

  test('should handle Supabase query errors', async () => {
    const mockQuery = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' }
    });
    const key = 'error-query-key';

    await expect(cacheService.cachedQuery(key, mockQuery)).rejects.toThrow('Database error');
  });
});

describe('CacheKeys', () => {
  test('should generate correct user cache keys', () => {
    expect(CacheKeys.user('123')).toBe('user:123');
  });

  test('should generate correct session cache keys', () => {
    expect(CacheKeys.sessions('user123')).toBe('sessions:user123');
    expect(CacheKeys.sessions('user123', 'active')).toBe('sessions:user123:active');
  });

  test('should generate correct tutor cache keys', () => {
    expect(CacheKeys.tutors()).toBe('tutors');
    expect(CacheKeys.tutors('Math')).toBe('tutors:subject:Math');
    expect(CacheKeys.tutors('Math', 'Johannesburg')).toBe('tutors:subject:Math:location:Johannesburg');
  });

  test('should generate correct resource cache keys', () => {
    expect(CacheKeys.resources()).toBe('resources');
    expect(CacheKeys.resources('session123')).toBe('resources:session:session123');
    expect(CacheKeys.resources(undefined, 'user456')).toBe('resources:user:user456');
  });
});

describe('CacheTags', () => {
  test('should provide correct static tags', () => {
    expect(CacheTags.USER).toBe('user');
    expect(CacheTags.SESSION).toBe('session');
    expect(CacheTags.RESOURCE).toBe('resource');
  });

  test('should generate correct user tags', () => {
    expect(CacheTags.userTag('123')).toBe('user:123');
  });

  test('should generate correct session tags', () => {
    expect(CacheTags.sessionTag('session456')).toBe('session:session456');
  });
});
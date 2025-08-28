import { MemoryManager } from '../services/memoryManager';

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;

  beforeEach(() => {
    memoryManager = new MemoryManager();
  });

  describe('Primary Memory', () => {
    it('should store and retrieve primary memory entries', () => {
      const entry = {
        id: 'test-1',
        timestamp: new Date(),
        type: 'user_message' as const,
        content: 'Test message',
        metadata: { validated: true }
      };

      memoryManager.addToPrimary(entry);
      const retrieved = memoryManager.getPrimary('test-1');
      
      expect(retrieved).toEqual(entry);
    });

    it('should list all primary memory entries', () => {
      const entries = [
        { id: '1', timestamp: new Date(), type: 'user_message' as const, content: 'Message 1' },
        { id: '2', timestamp: new Date(), type: 'agent_response' as const, content: 'Response 1' }
      ];

      entries.forEach(entry => memoryManager.addToPrimary(entry));
      const allEntries = memoryManager.getAllPrimary();

      expect(allEntries).toHaveLength(2);
      expect(allEntries[0].id).toBe('1');
      expect(allEntries[1].id).toBe('2');
    });

    it('should limit primary memory size and remove oldest entries', () => {
      // Add 101 entries (limit is 100)
      for (let i = 0; i < 101; i++) {
        memoryManager.addToPrimary({
          id: `entry-${i}`,
          timestamp: new Date(2024, 0, i + 1),
          type: 'user_message',
          content: `Message ${i}`
        });
      }

      const allEntries = memoryManager.getAllPrimary();
      expect(allEntries).toHaveLength(100);
      expect(allEntries[0].id).toBe('entry-1'); // Oldest entry-0 should be removed
    });

    it('should clear primary memory', () => {
      memoryManager.addToPrimary({ id: '1', timestamp: new Date(), type: 'user_message', content: 'Test' });
      memoryManager.clearPrimary();
      
      expect(memoryManager.getAllPrimary()).toHaveLength(0);
    });
  });

  describe('Secondary Memory', () => {
    it('should create and retrieve secondary contexts', () => {
      memoryManager.createSecondaryContext('tools_log', 'Initial log data');
      const context = memoryManager.getSecondaryContext('tools_log');
      
      expect(context).toBe('Initial log data');
    });

    it('should append to secondary contexts', () => {
      memoryManager.createSecondaryContext('logs', 'Line 1\n');
      memoryManager.appendToSecondaryContext('logs', 'Line 2\n');
      
      const context = memoryManager.getSecondaryContext('logs');
      expect(context).toBe('Line 1\nLine 2\n');
    });

    it('should list all secondary context names', () => {
      memoryManager.createSecondaryContext('context1', 'data1');
      memoryManager.createSecondaryContext('context2', 'data2');
      
      const names = memoryManager.listSecondaryContexts();
      expect(names).toEqual(['context1', 'context2']);
    });

    it('should clear specific secondary context', () => {
      memoryManager.createSecondaryContext('temp', 'temporary data');
      memoryManager.clearSecondaryContext('temp');
      
      expect(memoryManager.getSecondaryContext('temp')).toBeUndefined();
    });
  });

  describe('Memory Compression', () => {
    it('should compress large secondary contexts', () => {
      const largeContent = 'x'.repeat(10000);
      memoryManager.createSecondaryContext('large', largeContent);
      
      const compressed = memoryManager.getCompressedContext('large');
      expect(compressed.compressed).toBe(true);
      expect(compressed.originalSize).toBe(10000);
      expect(compressed.compressedSize).toBeLessThan(10000);
    });

    it('should decompress compressed contexts', () => {
      const content = 'Test content for compression';
      memoryManager.createSecondaryContext('test', content);
      
      const compressed = memoryManager.getCompressedContext('test');
      const decompressed = memoryManager.decompressContext(compressed.data);
      
      expect(decompressed).toBe(content);
    });
  });

  describe('Memory Search', () => {
    it('should search in primary memory', () => {
      memoryManager.addToPrimary({ id: '1', timestamp: new Date(), type: 'user_message', content: 'Hello world' });
      memoryManager.addToPrimary({ id: '2', timestamp: new Date(), type: 'agent_response', content: 'Goodbye' });
      
      const results = memoryManager.searchPrimary('world');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('should search by type in primary memory', () => {
      memoryManager.addToPrimary({ id: '1', timestamp: new Date(), type: 'user_message', content: 'Test' });
      memoryManager.addToPrimary({ id: '2', timestamp: new Date(), type: 'agent_response', content: 'Response' });
      memoryManager.addToPrimary({ id: '3', timestamp: new Date(), type: 'user_message', content: 'Another' });
      
      const results = memoryManager.searchByType('user_message');
      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('1');
      expect(results[1].id).toBe('3');
    });
  });

  describe('Memory Statistics', () => {
    it('should provide memory usage statistics', () => {
      memoryManager.addToPrimary({ id: '1', timestamp: new Date(), type: 'user_message', content: 'Test' });
      memoryManager.createSecondaryContext('context1', 'data');
      
      const stats = memoryManager.getStatistics();
      
      expect(stats.primaryCount).toBe(1);
      expect(stats.secondaryCount).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
      expect(stats.primarySize).toBeGreaterThan(0);
      expect(stats.secondarySize).toBeGreaterThan(0);
    });
  });

  describe('Memory Optimization', () => {
    it('should optimize memory by removing duplicates', () => {
      const duplicate = { id: '1', timestamp: new Date(), type: 'user_message' as const, content: 'Duplicate' };
      
      memoryManager.addToPrimary(duplicate);
      memoryManager.addToPrimary(duplicate);
      memoryManager.addToPrimary(duplicate);
      
      memoryManager.optimize();
      
      const entries = memoryManager.getAllPrimary();
      expect(entries).toHaveLength(1);
    });

    it('should trim old entries beyond retention period', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8); // 8 days old
      
      memoryManager.addToPrimary({ id: 'old', timestamp: oldDate, type: 'user_message', content: 'Old' });
      memoryManager.addToPrimary({ id: 'new', timestamp: new Date(), type: 'user_message', content: 'New' });
      
      memoryManager.trimOldEntries(7); // Keep only 7 days
      
      const entries = memoryManager.getAllPrimary();
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('new');
    });
  });
});
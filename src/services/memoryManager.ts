import { gzipSync, gunzipSync } from 'zlib';

export interface MemoryEntry {
  id: string;
  timestamp: Date;
  type: 'user_message' | 'agent_response' | 'tool_execution' | 'validation' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface CompressedContext {
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  data: Buffer | string;
}

export interface MemoryStatistics {
  primaryCount: number;
  secondaryCount: number;
  totalSize: number;
  primarySize: number;
  secondarySize: number;
}

export class MemoryManager {
  private primaryMemory: Map<string, MemoryEntry>;
  private secondaryMemory: Map<string, string>;
  private readonly maxPrimarySize = 100;
  private readonly compressionThreshold = 1024; // Compress if > 1KB

  constructor() {
    this.primaryMemory = new Map();
    this.secondaryMemory = new Map();
  }

  // Primary Memory Operations
  addToPrimary(entry: MemoryEntry): void {
    this.primaryMemory.set(entry.id, entry);
    
    // Enforce size limit
    if (this.primaryMemory.size > this.maxPrimarySize) {
      const entries = Array.from(this.primaryMemory.entries())
        .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
      
      const toRemove = entries[0][0];
      this.primaryMemory.delete(toRemove);
    }
  }

  getPrimary(id: string): MemoryEntry | undefined {
    return this.primaryMemory.get(id);
  }

  getAllPrimary(): MemoryEntry[] {
    return Array.from(this.primaryMemory.values())
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  clearPrimary(): void {
    this.primaryMemory.clear();
  }

  searchPrimary(query: string): MemoryEntry[] {
    return Array.from(this.primaryMemory.values())
      .filter(entry => entry.content.toLowerCase().includes(query.toLowerCase()));
  }

  searchByType(type: MemoryEntry['type']): MemoryEntry[] {
    return Array.from(this.primaryMemory.values())
      .filter(entry => entry.type === type);
  }

  // Secondary Memory Operations
  createSecondaryContext(name: string, content: string): void {
    this.secondaryMemory.set(name, content);
  }

  appendToSecondaryContext(name: string, content: string): void {
    const existing = this.secondaryMemory.get(name) || '';
    this.secondaryMemory.set(name, existing + content);
  }

  getSecondaryContext(name: string): string | undefined {
    return this.secondaryMemory.get(name);
  }

  listSecondaryContexts(): string[] {
    return Array.from(this.secondaryMemory.keys());
  }

  clearSecondaryContext(name: string): void {
    this.secondaryMemory.delete(name);
  }

  // Compression Operations
  getCompressedContext(name: string): CompressedContext {
    const content = this.secondaryMemory.get(name) || '';
    const originalSize = Buffer.byteLength(content, 'utf8');

    if (originalSize > this.compressionThreshold) {
      const compressed = gzipSync(content);
      return {
        compressed: true,
        originalSize,
        compressedSize: compressed.length,
        data: compressed
      };
    }

    return {
      compressed: false,
      originalSize,
      compressedSize: originalSize,
      data: content
    };
  }

  decompressContext(data: Buffer | string): string {
    if (Buffer.isBuffer(data)) {
      return gunzipSync(data).toString('utf8');
    }
    return data;
  }

  // Statistics and Optimization
  getStatistics(): MemoryStatistics {
    const primarySize = Array.from(this.primaryMemory.values())
      .reduce((sum, entry) => sum + Buffer.byteLength(JSON.stringify(entry), 'utf8'), 0);
    
    const secondarySize = Array.from(this.secondaryMemory.values())
      .reduce((sum, content) => sum + Buffer.byteLength(content, 'utf8'), 0);

    return {
      primaryCount: this.primaryMemory.size,
      secondaryCount: this.secondaryMemory.size,
      totalSize: primarySize + secondarySize,
      primarySize,
      secondarySize
    };
  }

  optimize(): void {
    // Remove duplicate entries based on content
    const seen = new Set<string>();
    const toRemove: string[] = [];

    for (const [id, entry] of this.primaryMemory.entries()) {
      const hash = JSON.stringify({ type: entry.type, content: entry.content });
      if (seen.has(hash)) {
        toRemove.push(id);
      } else {
        seen.add(hash);
      }
    }

    toRemove.forEach(id => this.primaryMemory.delete(id));
  }

  trimOldEntries(daysToKeep: number): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const toRemove: string[] = [];
    for (const [id, entry] of this.primaryMemory.entries()) {
      if (entry.timestamp < cutoffDate) {
        toRemove.push(id);
      }
    }

    toRemove.forEach(id => this.primaryMemory.delete(id));
  }

  // Export for LLM consumption
  exportForLLM(): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];
    
    const entries = this.getAllPrimary();
    for (const entry of entries) {
      let role = 'system';
      if (entry.type === 'user_message') role = 'user';
      else if (entry.type === 'agent_response') role = 'assistant';
      
      messages.push({ role, content: entry.content });
    }

    return messages;
  }
}
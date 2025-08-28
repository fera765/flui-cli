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
export declare class MemoryManager {
    private primaryMemory;
    private secondaryMemory;
    private readonly maxPrimarySize;
    private readonly compressionThreshold;
    constructor();
    addToPrimary(entry: MemoryEntry): void;
    getPrimary(id: string): MemoryEntry | undefined;
    getAllPrimary(): MemoryEntry[];
    clearPrimary(): void;
    searchPrimary(query: string): MemoryEntry[];
    searchByType(type: MemoryEntry['type']): MemoryEntry[];
    createSecondaryContext(name: string, content: string): void;
    appendToSecondaryContext(name: string, content: string): void;
    getSecondaryContext(name: string): string | undefined;
    listSecondaryContexts(): string[];
    clearSecondaryContext(name: string): void;
    getCompressedContext(name: string): CompressedContext;
    decompressContext(data: Buffer | string): string;
    getStatistics(): MemoryStatistics;
    optimize(): void;
    trimOldEntries(daysToKeep: number): void;
    exportForLLM(): Array<{
        role: string;
        content: string;
    }>;
}
//# sourceMappingURL=memoryManager.d.ts.map
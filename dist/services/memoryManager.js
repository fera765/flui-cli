"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryManager = void 0;
const zlib_1 = require("zlib");
class MemoryManager {
    constructor() {
        this.maxPrimarySize = 100;
        this.compressionThreshold = 1024; // Compress if > 1KB
        this.primaryMemory = new Map();
        this.secondaryMemory = new Map();
    }
    // Primary Memory Operations
    addToPrimary(entry) {
        this.primaryMemory.set(entry.id, entry);
        // Enforce size limit
        if (this.primaryMemory.size > this.maxPrimarySize) {
            const entries = Array.from(this.primaryMemory.entries())
                .sort((a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime());
            const toRemove = entries[0][0];
            this.primaryMemory.delete(toRemove);
        }
    }
    // Método adicional para compatibilidade
    addPrimaryMessage(message) {
        const entry = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'interaction',
            content: message.content,
            timestamp: new Date(),
            metadata: { role: message.role }
        };
        this.addToPrimary(entry);
    }
    getPrimary(id) {
        return this.primaryMemory.get(id);
    }
    getAllPrimary() {
        return Array.from(this.primaryMemory.values())
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    clearPrimary() {
        this.primaryMemory.clear();
    }
    searchPrimary(query) {
        return Array.from(this.primaryMemory.values())
            .filter(entry => entry.content.toLowerCase().includes(query.toLowerCase()));
    }
    searchByType(type) {
        return Array.from(this.primaryMemory.values())
            .filter(entry => entry.type === type);
    }
    // Secondary Memory Operations
    createSecondaryContext(name, content) {
        this.secondaryMemory.set(name, content);
    }
    appendToSecondaryContext(name, content) {
        const existing = this.secondaryMemory.get(name) || '';
        this.secondaryMemory.set(name, existing + content);
    }
    getSecondaryContext(name) {
        return this.secondaryMemory.get(name);
    }
    listSecondaryContexts() {
        return Array.from(this.secondaryMemory.keys());
    }
    clearSecondaryContext(name) {
        this.secondaryMemory.delete(name);
    }
    // Compression Operations
    getCompressedContext(name) {
        const content = this.secondaryMemory.get(name) || '';
        const originalSize = Buffer.byteLength(content, 'utf8');
        if (originalSize > this.compressionThreshold) {
            const compressed = (0, zlib_1.gzipSync)(content);
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
    decompressContext(data) {
        if (Buffer.isBuffer(data)) {
            return (0, zlib_1.gunzipSync)(data).toString('utf8');
        }
        return data;
    }
    // Statistics and Optimization
    getStatistics() {
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
    optimize() {
        // Remove duplicate entries based on content
        const seen = new Set();
        const toRemove = [];
        for (const [id, entry] of this.primaryMemory.entries()) {
            const hash = JSON.stringify({ type: entry.type, content: entry.content });
            if (seen.has(hash)) {
                toRemove.push(id);
            }
            else {
                seen.add(hash);
            }
        }
        toRemove.forEach(id => this.primaryMemory.delete(id));
    }
    trimOldEntries(daysToKeep) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        const toRemove = [];
        for (const [id, entry] of this.primaryMemory.entries()) {
            if (entry.timestamp < cutoffDate) {
                toRemove.push(id);
            }
        }
        toRemove.forEach(id => this.primaryMemory.delete(id));
    }
    // Export for LLM consumption
    exportForLLM() {
        const messages = [];
        const entries = this.getAllPrimary();
        for (const entry of entries) {
            let role = 'system';
            if (entry.type === 'user_message')
                role = 'user';
            else if (entry.type === 'agent_response')
                role = 'assistant';
            messages.push({ role, content: entry.content });
        }
        return messages;
    }
}
exports.MemoryManager = MemoryManager;
//# sourceMappingURL=memoryManager.js.map
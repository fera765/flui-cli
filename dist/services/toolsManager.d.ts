import { MemoryManager } from './memoryManager';
import { ApiService } from './apiService';
export type ToolStatus = 'idle' | 'running' | 'success' | 'error';
export interface ToolExecutionResult {
    toolName: string;
    status: 'success' | 'error';
    output?: any;
    error?: string;
    logs?: string;
    displayLogs?: string;
    timestamp: Date;
    duration?: number;
    metadata?: Record<string, any>;
}
export interface AgentMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export declare class ToolsManager {
    private memoryManager;
    private apiService;
    private executionHistory;
    private toolStates;
    private workingDirectory;
    private readonly maxHistorySize;
    private readonly maxDisplayLines;
    constructor(memoryManager: MemoryManager, apiService: ApiService);
    private initializeToolStates;
    executeAgent(messages: AgentMessage[], allowDelegation?: boolean): Promise<ToolExecutionResult>;
    executeShell(command: string): Promise<ToolExecutionResult>;
    private isUnsafeCommand;
    fileRead(filepath: string): Promise<ToolExecutionResult>;
    fileReplace(filepath: string, search: string, replace: string): Promise<ToolExecutionResult>;
    findProblemSolution(errorLog: string): Promise<ToolExecutionResult>;
    secondaryContext(params: {
        name: string;
        content: string;
        append?: boolean;
    }): Promise<ToolExecutionResult>;
    secondaryContextRead(name: string): Promise<ToolExecutionResult>;
    truncateLogForDisplay(log: string): string;
    private setToolStatus;
    getToolStatus(toolName: string): ToolStatus;
    private addToHistory;
    getExecutionHistory(): ToolExecutionResult[];
    clearHistory(): void;
}
//# sourceMappingURL=toolsManager.d.ts.map
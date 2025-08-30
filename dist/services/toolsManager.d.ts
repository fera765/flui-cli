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
    private apiService?;
    private openAIService?;
    private navigationManager?;
    private errorHandler?;
    private executionHistory;
    private toolStates;
    private workingDirectory;
    private readonly maxHistorySize;
    private readonly maxDisplayLines;
    constructor(memoryManager: MemoryManager, apiServiceOrOpenAI?: ApiService | any, navigationManager?: any, errorHandler?: any);
    private initializeToolStates;
    executeTool(toolName: string, params: any): Promise<any>;
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
    getAvailableTools(): string[];
    executeFileWrite(filename: string, content: string): Promise<ToolExecutionResult>;
    executeNavigate(targetPath: string, create?: boolean): Promise<ToolExecutionResult>;
    executeAppendContent(filePath: string, content: string, separator?: string): Promise<ToolExecutionResult>;
    executeAnalyzeContext(): Promise<ToolExecutionResult>;
}
//# sourceMappingURL=toolsManager.d.ts.map
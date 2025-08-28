import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
export declare class ChatAppEnhanced {
    private apiService;
    private modelManager;
    private chatUI;
    private conversationHistory;
    private isRunning;
    private settingsManager;
    private themeSelector;
    private modelSelector;
    private memoryManager;
    private toolsManager;
    private toolBox;
    private currentRequest;
    constructor(apiService: ApiService, modelManager: ModelManager, chatUI: ChatUI);
    initialize(): Promise<void>;
    private setupEscapeHandler;
    private handleEscape;
    processInput(): Promise<boolean>;
    private getEnhancedResponse;
    private extractToolCalls;
    private executeTools;
    private getToolDescription;
    private handleCommand;
    run(): Promise<void>;
}
//# sourceMappingURL=chatAppEnhanced.d.ts.map
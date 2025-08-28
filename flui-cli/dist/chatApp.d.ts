import { ApiService } from './services/apiService';
import { ModelManager } from './services/modelManager';
import { ChatUI } from './ui/chatUI';
export declare class ChatApp {
    private apiService;
    private modelManager;
    private chatUI;
    private conversationHistory;
    private isRunning;
    constructor(apiService: ApiService, modelManager: ModelManager, chatUI: ChatUI);
    initialize(): Promise<void>;
    processInput(): Promise<boolean>;
    private handleCommand;
    private sendMessage;
    run(): Promise<void>;
}
//# sourceMappingURL=chatApp.d.ts.map
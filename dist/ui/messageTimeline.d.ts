import { ThemeManager } from './themeManager';
export interface TimelineMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}
export declare class MessageTimeline {
    private themeManager;
    private messages;
    private visibleMessages;
    private maxMessages;
    private isCleared;
    private markdownRenderer;
    constructor(themeManager: ThemeManager);
    addUserMessage(content: string): void;
    addAssistantMessage(content: string): void;
    addSystemMessage(content: string): void;
    private addMessage;
    getMessages(): TimelineMessage[];
    formatMessage(message: TimelineMessage): string;
    display(clearScreen?: boolean): void;
    displayLatest(count?: number): void;
    clear(): void;
    clearVisible(): void;
    getLastMessage(): TimelineMessage | null;
    getMessageCount(): number;
}
//# sourceMappingURL=messageTimeline.d.ts.map
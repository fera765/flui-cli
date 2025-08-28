export declare class ChatUI {
    private spinner;
    displayWelcome(): void;
    displayDisclaimer(): void;
    displayMessage(message: string, role: 'user' | 'assistant' | 'system'): void;
    displayError(error: string): void;
    displayModels(modelList: string): void;
    showThinking(): void;
    hideThinking(): void;
    getUserInput(prompt?: string): Promise<string>;
    clear(): void;
    displaySeparator(): void;
}
//# sourceMappingURL=chatUI.d.ts.map
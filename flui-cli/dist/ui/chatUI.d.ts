import { ThemeManager } from './themeManager';
import { SimpleInputBox } from './simpleInputBox';
import { MessageTimeline } from './messageTimeline';
export declare class ChatUI {
    private spinner;
    private themeManager;
    private inputBox;
    private timeline;
    constructor();
    displayWelcome(): void;
    displayDisclaimer(): void;
    displayMessage(message: string, role: 'user' | 'assistant' | 'system'): void;
    displayError(error: string): void;
    displayModels(modelList: string): void;
    displayThemes(themeList: string): void;
    getThemeManager(): ThemeManager;
    getTimeline(): MessageTimeline;
    getInputBox(): SimpleInputBox;
    destroy(): void;
    showThinking(): void;
    hideThinking(): void;
    getUserInput(prompt?: string): Promise<string>;
    clear(): void;
    displaySeparator(): void;
}
//# sourceMappingURL=chatUI.d.ts.map
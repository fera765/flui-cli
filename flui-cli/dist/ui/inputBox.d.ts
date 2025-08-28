import { ThemeManager } from './themeManager';
export declare class InputBox {
    private themeManager;
    private rl;
    private isThinking;
    private spinnerInterval;
    private spinnerFrames;
    private spinnerIndex;
    private currentInput;
    private cursorPosition;
    private inputHistory;
    private historyIndex;
    constructor(themeManager: ThemeManager);
    initialize(): void;
    private updateDisplay;
    display(): void;
    getUserInput(): Promise<string>;
    startInput(): void;
    showThinking(): void;
    hideThinking(): void;
    clear(): void;
    resetCursor(): void;
    destroy(): void;
}
//# sourceMappingURL=inputBox.d.ts.map
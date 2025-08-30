import { ThemeManager } from './themeManager';
export declare class SimpleInputBox {
    private themeManager;
    private rl;
    private isThinking;
    private spinnerInterval;
    private spinnerFrames;
    private spinnerIndex;
    private inputHistory;
    private historyIndex;
    private isWaitingForInput;
    constructor(themeManager: ThemeManager);
    initialize(): void;
    display(): void;
    getInput(): Promise<string>;
    showThinking(): void;
    hideThinking(): void;
    clearScreen(): void;
    clear(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
    onClearScreen?: () => void;
}
//# sourceMappingURL=simpleInputBox.d.ts.map
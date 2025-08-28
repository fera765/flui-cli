import { ThemeManager } from './themeManager';
export declare class CleanInputBox {
    private themeManager;
    private isThinking;
    private spinnerInterval;
    private spinnerFrames;
    private spinnerIndex;
    constructor(themeManager: ThemeManager);
    initialize(): void;
    display(): void;
    getInput(): Promise<string>;
    showThinking(): void;
    hideThinking(): void;
    clear(): void;
    clearScreen(): void;
    pause(): void;
    resume(): void;
    destroy(): void;
    onClearScreen?: () => void;
}
//# sourceMappingURL=cleanInputBox.d.ts.map
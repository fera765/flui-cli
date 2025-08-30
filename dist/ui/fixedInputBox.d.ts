import { ThemeManager } from './themeManager';
export declare class FixedInputBox {
    private themeManager;
    private spinnerInterval;
    private spinnerFrames;
    private spinnerIndex;
    private isThinking;
    private bottomRow;
    constructor(themeManager: ThemeManager);
    initialize(): void;
    private moveToBottom;
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
//# sourceMappingURL=fixedInputBox.d.ts.map
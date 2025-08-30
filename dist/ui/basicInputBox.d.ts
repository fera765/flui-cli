import { ThemeManager } from './themeManager';
export declare class BasicInputBox {
    private themeManager;
    private spinnerInterval;
    private spinnerFrames;
    private spinnerIndex;
    private isThinking;
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
//# sourceMappingURL=basicInputBox.d.ts.map
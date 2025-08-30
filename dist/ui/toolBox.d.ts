import { ThemeManager } from './themeManager';
import { ToolExecutionResult, ToolStatus } from '../services/toolsManager';
export declare class ToolBox {
    private themeManager;
    private spinnerFrames;
    private currentSpinnerIndex;
    private spinnerInterval?;
    constructor(themeManager: ThemeManager);
    render(result: ToolExecutionResult, status: ToolStatus): string;
    renderStatus(toolName: string, status: ToolStatus, operation: string): string;
    renderLogBox(logs: string): string;
    formatToolName(toolName: string): string;
    private getOperationDescription;
    getExecutionSummary(result: ToolExecutionResult): string;
    getSpinnerFrames(): string[];
    getCurrentSpinnerFrame(): string;
    advanceSpinner(): void;
    startSpinnerAnimation(callback: () => void): void;
    stopSpinnerAnimation(): void;
    createLiveDisplay(toolName: string, operation: string): {
        update: (status: ToolStatus, logs?: string) => string;
        stop: () => void;
    };
}
//# sourceMappingURL=toolBox.d.ts.map
import { ThemeManager } from './themeManager';
export interface SelectorOption {
    label: string;
    value: any;
    description?: string;
}
export declare class InteractiveSelector {
    private themeManager;
    private rl;
    constructor(themeManager: ThemeManager);
    select(title: string, options: SelectorOption[], currentValue?: any): Promise<any | null>;
}
//# sourceMappingURL=interactiveSelector.d.ts.map
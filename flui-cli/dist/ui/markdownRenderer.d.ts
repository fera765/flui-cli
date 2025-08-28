import { ThemeManager } from './themeManager';
export declare class MarkdownRenderer {
    private themeManager;
    private renderer;
    constructor(themeManager: ThemeManager);
    private setupRenderer;
    render(markdown: string): string;
    renderInline(markdown: string): string;
}
//# sourceMappingURL=markdownRenderer.d.ts.map
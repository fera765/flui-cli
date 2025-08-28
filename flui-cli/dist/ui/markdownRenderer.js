"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownRenderer = void 0;
const marked_1 = require("marked");
const TerminalRenderer = require('marked-terminal');
class MarkdownRenderer {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.setupRenderer();
    }
    setupRenderer() {
        this.renderer = new TerminalRenderer({
            showSectionPrefix: false,
            width: 80,
            reflowText: true,
            preserveNewlines: true
        });
        marked_1.marked.setOptions({
            renderer: this.renderer
        });
    }
    render(markdown) {
        // Re-setup renderer if theme changed
        this.setupRenderer();
        try {
            // Process the markdown
            const rendered = (0, marked_1.marked)(markdown);
            // Handle both sync and async responses
            if (typeof rendered === 'string') {
                // Clean up extra newlines
                return rendered.replace(/\n{3,}/g, '\n\n');
            }
            else {
                // If async (shouldn't happen with our config), return original
                return markdown;
            }
        }
        catch (error) {
            // If markdown parsing fails, return original text
            return markdown;
        }
    }
    renderInline(markdown) {
        try {
            const result = marked_1.marked.parseInline(markdown);
            return typeof result === 'string' ? result : markdown;
        }
        catch (error) {
            return markdown;
        }
    }
}
exports.MarkdownRenderer = MarkdownRenderer;
//# sourceMappingURL=markdownRenderer.js.map
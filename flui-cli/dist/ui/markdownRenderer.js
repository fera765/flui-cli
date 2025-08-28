"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownRenderer = void 0;
const marked_1 = require("marked");
let markedTerminal;
try {
    // Import marked-terminal v7
    const mt = require('marked-terminal');
    markedTerminal = mt.markedTerminal || mt.default || mt;
}
catch (error) {
    // Fallback if marked-terminal is not available
    markedTerminal = null;
}
class MarkdownRenderer {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.setupRenderer();
    }
    setupRenderer() {
        // Check if markedTerminal is available
        if (!markedTerminal || typeof markedTerminal !== 'function') {
            // Use default marked renderer
            return;
        }
        // markedTerminal v7 returns an extension object for marked.use()
        // We can customize colors but for now use defaults
        const terminalOptions = markedTerminal({
            // Options for marked-terminal
            showSectionPrefix: false,
            width: 80,
            reflowText: true,
            preserveNewlines: true
        });
        // Apply the terminal renderer to marked
        marked_1.marked.use(terminalOptions);
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
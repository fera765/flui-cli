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
        // Configure marked-terminal with theme colors
        const theme = this.themeManager.getCurrentTheme();
        this.renderer = new TerminalRenderer({
            // Code block settings
            code: (code) => {
                return this.themeManager.formatSecondary(code);
            },
            blockquote: (quote) => {
                return this.themeManager.formatBorder('│ ') + quote;
            },
            html: (html) => html,
            heading: (text, level) => {
                const formatted = this.themeManager.formatPrimary(text.toUpperCase());
                return '\n' + formatted + '\n';
            },
            hr: () => {
                return this.themeManager.formatBorder('─'.repeat(40)) + '\n';
            },
            list: (body, ordered) => {
                return body;
            },
            listitem: (text) => {
                return this.themeManager.formatSecondary('• ') + text + '\n';
            },
            paragraph: (text) => {
                return text + '\n';
            },
            table: (header, body) => {
                return header + body;
            },
            tablerow: (content) => {
                return content + '\n';
            },
            tablecell: (content, flags) => {
                return content + ' ';
            },
            // Inline elements
            strong: (text) => {
                return this.themeManager.formatPrimary(text);
            },
            em: (text) => {
                return this.themeManager.formatSecondary(text);
            },
            codespan: (code) => {
                return this.themeManager.formatInfo(code);
            },
            br: () => '\n',
            del: (text) => {
                return this.themeManager.formatBorder(text);
            },
            link: (href, title, text) => {
                return this.themeManager.formatInfo(`${text} (${href})`);
            },
            image: (href, title, text) => {
                return this.themeManager.formatInfo(`[Image: ${text || href}]`);
            },
            text: (text) => text
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
import { marked } from 'marked';
const TerminalRenderer = require('marked-terminal');
import { ThemeManager } from './themeManager';

export class MarkdownRenderer {
  private renderer: any;

  constructor(private themeManager: ThemeManager) {
    this.setupRenderer();
  }

  private setupRenderer(): void {
    // Configure marked-terminal with theme colors
    const theme = this.themeManager.getCurrentTheme();
    
    this.renderer = new TerminalRenderer({
      // Code block settings
      code: (code: string) => {
        return this.themeManager.formatSecondary(code);
      },
      blockquote: (quote: string) => {
        return this.themeManager.formatBorder('│ ') + quote;
      },
      html: (html: string) => html,
      heading: (text: string, level: number) => {
        const formatted = this.themeManager.formatPrimary(text.toUpperCase());
        return '\n' + formatted + '\n';
      },
      hr: () => {
        return this.themeManager.formatBorder('─'.repeat(40)) + '\n';
      },
      list: (body: string, ordered: boolean) => {
        return body;
      },
      listitem: (text: string) => {
        return this.themeManager.formatSecondary('• ') + text + '\n';
      },
      paragraph: (text: string) => {
        return text + '\n';
      },
      table: (header: string, body: string) => {
        return header + body;
      },
      tablerow: (content: string) => {
        return content + '\n';
      },
      tablecell: (content: string, flags: any) => {
        return content + ' ';
      },
      // Inline elements
      strong: (text: string) => {
        return this.themeManager.formatPrimary(text);
      },
      em: (text: string) => {
        return this.themeManager.formatSecondary(text);
      },
      codespan: (code: string) => {
        return this.themeManager.formatInfo(code);
      },
      br: () => '\n',
      del: (text: string) => {
        return this.themeManager.formatBorder(text);
      },
      link: (href: string, title: string, text: string) => {
        return this.themeManager.formatInfo(`${text} (${href})`);
      },
      image: (href: string, title: string, text: string) => {
        return this.themeManager.formatInfo(`[Image: ${text || href}]`);
      },
      text: (text: string) => text
    });

    marked.setOptions({
      renderer: this.renderer
    });
  }

  render(markdown: string): string {
    // Re-setup renderer if theme changed
    this.setupRenderer();
    
    try {
      // Process the markdown
      const rendered = marked(markdown);
      
      // Handle both sync and async responses
      if (typeof rendered === 'string') {
        // Clean up extra newlines
        return rendered.replace(/\n{3,}/g, '\n\n');
      } else {
        // If async (shouldn't happen with our config), return original
        return markdown;
      }
    } catch (error) {
      // If markdown parsing fails, return original text
      return markdown;
    }
  }

  renderInline(markdown: string): string {
    try {
      const result = marked.parseInline(markdown);
      return typeof result === 'string' ? result : markdown;
    } catch (error) {
      return markdown;
    }
  }
}
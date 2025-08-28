import { marked } from 'marked';
const TerminalRenderer = require('marked-terminal');
import { ThemeManager } from './themeManager';

export class MarkdownRenderer {
  private renderer: any;

  constructor(private themeManager: ThemeManager) {
    this.setupRenderer();
  }

  private setupRenderer(): void {
    this.renderer = new TerminalRenderer({
      showSectionPrefix: false,
      width: 80,
      reflowText: true,
      preserveNewlines: true
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
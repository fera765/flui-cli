import { marked } from 'marked';
import { ThemeManager } from './themeManager';

let markedTerminal: any;
try {
  // Import marked-terminal v7
  const mt = require('marked-terminal');
  markedTerminal = mt.markedTerminal || mt.default || mt;
} catch (error) {
  // Fallback if marked-terminal is not available
  markedTerminal = null;
}

export class MarkdownRenderer {
  private renderer: any;

  constructor(private themeManager: ThemeManager) {
    this.setupRenderer();
  }

  private setupRenderer(): void {
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
    marked.use(terminalOptions);
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
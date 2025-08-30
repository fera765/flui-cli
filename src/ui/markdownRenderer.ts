import { marked } from 'marked';
import chalk from 'chalk';
import { ThemeManager } from './themeManager';

// Syntax highlighting for code blocks
const highlightCode = (code: string, language?: string): string => {
  // Simple syntax highlighting based on language
  if (!language) return code;
  
  const keywords: Record<string, string[]> = {
    python: ['def', 'class', 'import', 'from', 'if', 'else', 'elif', 'for', 'while', 'return', 'try', 'except', 'with', 'as', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None', 'self', 'print', 'range', 'len', 'str', 'int', 'float', 'list', 'dict', 'tuple'],
    javascript: ['const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return', 'try', 'catch', 'finally', 'class', 'extends', 'new', 'this', 'import', 'export', 'from', 'async', 'await', 'true', 'false', 'null', 'undefined'],
    typescript: ['const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return', 'try', 'catch', 'finally', 'class', 'extends', 'new', 'this', 'import', 'export', 'from', 'async', 'await', 'interface', 'type', 'enum', 'namespace', 'true', 'false', 'null', 'undefined'],
  };
  
  let highlighted = code;
  
  // Highlight strings (both single and double quotes)
  highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => chalk.green(match));
  
  // Highlight numbers
  highlighted = highlighted.replace(/\b(\d+)\b/g, (match) => chalk.yellow(match));
  
  // Highlight comments
  if (language === 'python') {
    highlighted = highlighted.replace(/#.*/g, (match) => chalk.gray(match));
  } else if (['javascript', 'typescript', 'java', 'c', 'cpp'].includes(language)) {
    highlighted = highlighted.replace(/\/\/.*/g, (match) => chalk.gray(match));
    highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, (match) => chalk.gray(match));
  }
  
  // Highlight keywords
  const langKeywords = keywords[language] || [];
  langKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    highlighted = highlighted.replace(regex, chalk.cyan(keyword));
  });
  
  // Highlight function names (simple pattern)
  if (language === 'python') {
    highlighted = highlighted.replace(/def\s+(\w+)/g, (match, name) => 
      chalk.cyan('def') + ' ' + chalk.blue(name)
    );
  } else if (['javascript', 'typescript'].includes(language)) {
    highlighted = highlighted.replace(/function\s+(\w+)/g, (match, name) => 
      chalk.cyan('function') + ' ' + chalk.blue(name)
    );
  }
  
  return highlighted;
};

export class MarkdownRenderer {
  constructor(private themeManager: ThemeManager) {}

  render(markdown: string): string {
    try {
      let output = markdown;
      
      // Render code blocks with syntax highlighting
      output = output.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const highlighted = highlightCode(code.trim(), lang);
        const border = chalk.gray('─'.repeat(60));
        const langLabel = lang ? chalk.yellow(`[${lang}]`) : '';
        return `\n${border}\n${langLabel}\n${highlighted}\n${border}\n`;
      });
      
      // Render inline code
      output = output.replace(/`([^`]+)`/g, (match, code) => {
        return chalk.bgGray.white(` ${code} `);
      });
      
      // Render bold text
      output = output.replace(/\*\*([^*]+)\*\*/g, (match, text) => {
        return chalk.bold(text);
      });
      
      // Render italic text
      output = output.replace(/\*([^*]+)\*/g, (match, text) => {
        return chalk.italic(text);
      });
      
      // Render headers
      output = output.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, text) => {
        return chalk.bold.underline(text.toUpperCase());
      });
      
      // Render lists
      output = output.replace(/^[-*]\s+(.+)$/gm, (match, item) => {
        return chalk.cyan('•') + ' ' + item;
      });
      
      // Render numbered lists
      output = output.replace(/^\d+\.\s+(.+)$/gm, (match, item) => {
        return chalk.cyan(match);
      });
      
      // Render links
      output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        return chalk.blue.underline(text) + chalk.gray(` (${url})`);
      });
      
      // Render blockquotes
      output = output.replace(/^>\s+(.+)$/gm, (match, quote) => {
        return chalk.gray('│ ') + chalk.italic(quote);
      });
      
      // Render horizontal rules
      output = output.replace(/^---+$/gm, () => {
        return chalk.gray('─'.repeat(60));
      });
      
      return output;
    } catch (error) {
      // If rendering fails, return original text
      return markdown;
    }
  }

  renderInline(markdown: string): string {
    try {
      let output = markdown;
      
      // Inline code
      output = output.replace(/`([^`]+)`/g, (match, code) => {
        return chalk.bgGray.white(` ${code} `);
      });
      
      // Bold
      output = output.replace(/\*\*([^*]+)\*\*/g, (match, text) => {
        return chalk.bold(text);
      });
      
      // Italic
      output = output.replace(/\*([^*]+)\*/g, (match, text) => {
        return chalk.italic(text);
      });
      
      return output;
    } catch (error) {
      return markdown;
    }
  }
}
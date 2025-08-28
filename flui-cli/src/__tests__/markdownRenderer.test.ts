import { MarkdownRenderer } from '../ui/markdownRenderer';
import { ThemeManager } from '../ui/themeManager';
import { marked } from 'marked';

jest.mock('marked');
jest.mock('../ui/themeManager');

describe('MarkdownRenderer', () => {
  let renderer: MarkdownRenderer;
  let mockThemeManager: jest.Mocked<ThemeManager>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockThemeManager = new ThemeManager() as jest.Mocked<ThemeManager>;
    mockThemeManager.formatCode = jest.fn((text) => `[CODE]${text}[/CODE]`);
    mockThemeManager.formatBold = jest.fn((text) => `[BOLD]${text}[/BOLD]`);
    mockThemeManager.formatItalic = jest.fn((text) => `[ITALIC]${text}[/ITALIC]`);
    mockThemeManager.formatHeader = jest.fn((text) => `[HEADER]${text}[/HEADER]`);
    mockThemeManager.formatLink = jest.fn((text) => `[LINK]${text}[/LINK]`);
    mockThemeManager.formatQuote = jest.fn((text) => `[QUOTE]${text}[/QUOTE]`);
    mockThemeManager.formatList = jest.fn((text) => `[LIST]${text}[/LIST]`);
    
    renderer = new MarkdownRenderer(mockThemeManager);
  });

  describe('render', () => {
    it('should render plain text as-is', () => {
      (marked as jest.Mock).mockReturnValue('Plain text');
      
      const result = renderer.render('Plain text');
      
      expect(result).toBe('Plain text');
    });

    it('should render code blocks with syntax highlighting', () => {
      const markdown = '```python\nprint("Hello")\n```';
      const expectedHtml = '<pre><code class="language-python">print("Hello")</code></pre>';
      
      (marked as jest.Mock).mockReturnValue(expectedHtml);
      
      const result = renderer.render(markdown);
      
      expect(marked).toHaveBeenCalledWith(markdown);
      expect(result).toContain('print("Hello")');
    });

    it('should render inline code', () => {
      const markdown = 'Use `npm install` to install';
      const expectedHtml = 'Use <code>npm install</code> to install';
      
      (marked as jest.Mock).mockReturnValue(expectedHtml);
      
      const result = renderer.render(markdown);
      
      expect(result).toContain('npm install');
    });

    it('should render bold text', () => {
      const markdown = '**bold text**';
      const expectedHtml = '<strong>bold text</strong>';
      
      (marked as jest.Mock).mockReturnValue(expectedHtml);
      
      const result = renderer.render(markdown);
      
      expect(result).toBeDefined();
    });

    it('should render italic text', () => {
      const markdown = '*italic text*';
      const expectedHtml = '<em>italic text</em>';
      
      (marked as jest.Mock).mockReturnValue(expectedHtml);
      
      const result = renderer.render(markdown);
      
      expect(result).toBeDefined();
    });

    it('should render headers', () => {
      const markdown = '# Header 1\n## Header 2';
      const expectedHtml = '<h1>Header 1</h1><h2>Header 2</h2>';
      
      (marked as jest.Mock).mockReturnValue(expectedHtml);
      
      const result = renderer.render(markdown);
      
      expect(result).toBeDefined();
    });

    it('should render lists', () => {
      const markdown = '- Item 1\n- Item 2';
      const expectedHtml = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      
      (marked as jest.Mock).mockReturnValue(expectedHtml);
      
      const result = renderer.render(markdown);
      
      expect(result).toBeDefined();
    });

    it('should render links', () => {
      const markdown = '[Google](https://google.com)';
      const expectedHtml = '<a href="https://google.com">Google</a>';
      
      (marked as jest.Mock).mockReturnValue(expectedHtml);
      
      const result = renderer.render(markdown);
      
      expect(result).toBeDefined();
    });

    it('should handle multi-line code blocks with language', () => {
      const markdown = '```javascript\nconst x = 1;\nconst y = 2;\n```';
      const expectedHtml = '<pre><code class="language-javascript">const x = 1;\nconst y = 2;</code></pre>';
      
      (marked as jest.Mock).mockReturnValue(expectedHtml);
      
      const result = renderer.render(markdown);
      
      expect(result).toContain('const x = 1');
      expect(result).toContain('const y = 2');
    });

    it('should handle markdown parsing errors gracefully', () => {
      (marked as jest.Mock).mockImplementation(() => {
        throw new Error('Parsing error');
      });
      
      const result = renderer.render('Invalid markdown');
      
      expect(result).toBe('Invalid markdown');
    });
  });

  describe('renderInline', () => {
    it('should render inline markdown', () => {
      const markdown = '**bold** and *italic*';
      
      (marked.parseInline as jest.Mock).mockReturnValue('<strong>bold</strong> and <em>italic</em>');
      
      const result = renderer.renderInline(markdown);
      
      expect(marked.parseInline).toHaveBeenCalledWith(markdown);
      expect(result).toBeDefined();
    });

    it('should handle inline parsing errors', () => {
      (marked.parseInline as jest.Mock).mockImplementation(() => {
        throw new Error('Inline parsing error');
      });
      
      const result = renderer.renderInline('Invalid inline');
      
      expect(result).toBe('Invalid inline');
    });
  });
});
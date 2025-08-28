import { ThemeManager, Theme } from '../ui/themeManager';

describe('ThemeManager', () => {
  let themeManager: ThemeManager;

  beforeEach(() => {
    themeManager = new ThemeManager();
  });

  describe('initialization', () => {
    it('should initialize with default dark theme', () => {
      expect(themeManager.getCurrentTheme().name).toBe('dark');
    });

    it('should have all 10 themes available', () => {
      const themes = themeManager.getAvailableThemes();
      expect(themes.length).toBe(10);
      expect(themes).toEqual(
        expect.arrayContaining([
          'dark',
          'light', 
          'monokai',
          'dracula',
          'solarized',
          'nord',
          'gruvbox',
          'tokyo-night',
          'synthwave',
          'cyberpunk'
        ])
      );
    });
  });

  describe('theme selection', () => {
    it('should switch to selected theme', () => {
      themeManager.setTheme('monokai');
      expect(themeManager.getCurrentTheme().name).toBe('monokai');
    });

    it('should throw error for invalid theme', () => {
      expect(() => themeManager.setTheme('invalid-theme')).toThrow('Theme not found');
    });

    it('should keep current theme on invalid selection', () => {
      const currentTheme = themeManager.getCurrentTheme();
      try {
        themeManager.setTheme('invalid');
      } catch (e) {
        // Expected
      }
      expect(themeManager.getCurrentTheme()).toEqual(currentTheme);
    });
  });

  describe('theme colors', () => {
    it('should provide correct colors for dark theme', () => {
      themeManager.setTheme('dark');
      const theme = themeManager.getCurrentTheme();
      
      expect(theme.colors.primary).toBeDefined();
      expect(theme.colors.secondary).toBeDefined();
      expect(theme.colors.userMessage).toBeDefined();
      expect(theme.colors.assistantMessage).toBeDefined();
      expect(theme.colors.systemMessage).toBeDefined();
      expect(theme.colors.error).toBeDefined();
      expect(theme.colors.warning).toBeDefined();
      expect(theme.colors.info).toBeDefined();
      expect(theme.colors.background).toBeDefined();
      expect(theme.colors.border).toBeDefined();
    });

    it('should have different colors for different themes', () => {
      themeManager.setTheme('dark');
      const darkColors = themeManager.getCurrentTheme().colors;
      
      themeManager.setTheme('light');
      const lightColors = themeManager.getCurrentTheme().colors;
      
      expect(darkColors.primary).not.toEqual(lightColors.primary);
      expect(darkColors.background).not.toEqual(lightColors.background);
    });
  });

  describe('theme formatting', () => {
    it('should format user message with theme colors', () => {
      themeManager.setTheme('dark');
      const formatted = themeManager.formatUserMessage('Hello');
      expect(formatted).toContain('Hello');
    });

    it('should format assistant message with theme colors', () => {
      themeManager.setTheme('dark');
      const formatted = themeManager.formatAssistantMessage('Hi there');
      expect(formatted).toContain('Hi there');
    });

    it('should format system message with theme colors', () => {
      themeManager.setTheme('dark');
      const formatted = themeManager.formatSystemMessage('System info');
      expect(formatted).toContain('System info');
    });

    it('should format error with theme colors', () => {
      themeManager.setTheme('dark');
      const formatted = themeManager.formatError('Error occurred');
      expect(formatted).toContain('Error occurred');
    });
  });

  describe('theme list formatting', () => {
    it('should format theme list for display', () => {
      const list = themeManager.getFormattedThemeList();
      expect(list).toContain('dark');
      expect(list).toContain('light');
      expect(list).toContain('monokai');
      expect(list).toContain('(current)');
    });

    it('should indicate current theme in list', () => {
      themeManager.setTheme('monokai');
      const list = themeManager.getFormattedThemeList();
      expect(list).toMatch(/monokai.*\(current\)/);
    });
  });

  describe('theme persistence', () => {
    it('should save theme preference', () => {
      const saveSpy = jest.spyOn(themeManager, 'saveThemePreference');
      themeManager.setTheme('dracula');
      expect(saveSpy).toHaveBeenCalledWith('dracula');
    });

    it('should load saved theme preference', () => {
      themeManager.saveThemePreference('gruvbox');
      const newManager = new ThemeManager();
      newManager.loadThemePreference();
      expect(newManager.getCurrentTheme().name).toBe('gruvbox');
    });
  });
});
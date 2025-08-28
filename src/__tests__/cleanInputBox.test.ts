import { CleanInputBox } from '../ui/cleanInputBox';
import { ThemeManager } from '../ui/themeManager';
import * as readline from 'readline';

// Mock readline
jest.mock('readline');

// Mock ThemeManager
jest.mock('../ui/themeManager');

describe('CleanInputBox', () => {
  let inputBox: CleanInputBox;
  let mockThemeManager: jest.Mocked<ThemeManager>;
  let mockRL: any;
  let consoleWriteSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mocks
    mockThemeManager = new ThemeManager() as jest.Mocked<ThemeManager>;
    mockThemeManager.formatPrompt = jest.fn((text) => text);
    mockThemeManager.formatInfo = jest.fn((text) => text);
    
    // Mock readline interface
    mockRL = {
      prompt: jest.fn(),
      once: jest.fn(),
      close: jest.fn()
    };
    
    (readline.createInterface as jest.Mock).mockReturnValue(mockRL);
    
    // Spy on console output
    consoleWriteSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
    
    inputBox = new CleanInputBox(mockThemeManager);
  });

  afterEach(() => {
    consoleWriteSpy.mockRestore();
  });

  describe('initialize', () => {
    it('should initialize without errors', () => {
      expect(() => inputBox.initialize()).not.toThrow();
    });
  });

  describe('display', () => {
    it('should not display anything (prompt handled by readline)', () => {
      inputBox.display();
      expect(consoleWriteSpy).not.toHaveBeenCalled();
    });
  });

  describe('getInput', () => {
    it('should create readline interface with correct options', async () => {
      const inputPromise = inputBox.getInput();
      
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
        prompt: '💬 > '
      });
      
      expect(mockRL.prompt).toHaveBeenCalled();
      
      // Simulate user input
      const callback = mockRL.once.mock.calls[0][1];
      callback('test input');
      
      const result = await inputPromise;
      expect(result).toBe('test input');
      expect(mockRL.close).toHaveBeenCalled();
    });

    it('should handle empty input', async () => {
      const inputPromise = inputBox.getInput();
      
      // Simulate empty input
      const callback = mockRL.once.mock.calls[0][1];
      callback('');
      
      const result = await inputPromise;
      expect(result).toBe('');
    });
  });

  describe('showThinking', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should show spinner animation', () => {
      inputBox.showThinking();
      
      // Check initial state
      expect(consoleWriteSpy).toHaveBeenCalledWith('\n');
      
      // Advance timer to trigger spinner update
      jest.advanceTimersByTime(100);
      expect(consoleWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Pensando...'));
      
      // Check spinner animation
      jest.advanceTimersByTime(100);
      expect(consoleWriteSpy).toHaveBeenCalledTimes(3);
    });

    it('should cycle through spinner frames', () => {
      inputBox.showThinking();
      
      const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      
      for (let i = 0; i < frames.length; i++) {
        jest.advanceTimersByTime(100);
        const calls = consoleWriteSpy.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall).toContain('Pensando...');
      }
    });
  });

  describe('hideThinking', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should clear spinner and stop animation', () => {
      inputBox.showThinking();
      jest.advanceTimersByTime(200);
      
      consoleWriteSpy.mockClear();
      inputBox.hideThinking();
      
      // Should clear line and move cursor
      expect(consoleWriteSpy).toHaveBeenCalledWith('\r\x1B[K');
      expect(consoleWriteSpy).toHaveBeenCalledWith('\x1B[1A');
      
      // Advance timer - no more spinner updates
      jest.advanceTimersByTime(200);
      expect(consoleWriteSpy).toHaveBeenCalledTimes(3); // Only clear commands
    });
  });

  describe('clearScreen', () => {
    it('should clear screen with proper escape sequences', () => {
      inputBox.clearScreen();
      
      expect(consoleWriteSpy).toHaveBeenCalledWith('\x1Bc\x1B[3J\x1B[H');
    });

    it('should call onClearScreen callback if set', () => {
      const mockCallback = jest.fn();
      inputBox.onClearScreen = mockCallback;
      
      inputBox.clearScreen();
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should do nothing (no clear needed)', () => {
      inputBox.clear();
      expect(consoleWriteSpy).not.toHaveBeenCalled();
    });
  });

  describe('pause', () => {
    it('should do nothing (no pause needed)', () => {
      expect(() => inputBox.pause()).not.toThrow();
    });
  });

  describe('resume', () => {
    it('should do nothing (no resume needed)', () => {
      expect(() => inputBox.resume()).not.toThrow();
    });
  });

  describe('destroy', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should clear spinner interval if active', () => {
      inputBox.showThinking();
      jest.advanceTimersByTime(100);
      
      inputBox.destroy();
      
      // Advance timer - no more updates
      consoleWriteSpy.mockClear();
      jest.advanceTimersByTime(200);
      expect(consoleWriteSpy).not.toHaveBeenCalled();
    });

    it('should handle destroy when no spinner active', () => {
      expect(() => inputBox.destroy()).not.toThrow();
    });
  });
});
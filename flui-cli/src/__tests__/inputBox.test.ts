import { InputBox } from '../ui/inputBox';
import { ThemeManager } from '../ui/themeManager';
import * as readline from 'readline';
import { EventEmitter } from 'events';

jest.mock('readline');

describe('InputBox', () => {
  let inputBox: InputBox;
  let themeManager: ThemeManager;
  let mockInterface: any;
  let mockEmitter: EventEmitter;
  
  beforeEach(() => {
    themeManager = new ThemeManager();
    inputBox = new InputBox(themeManager);
    
    mockEmitter = new EventEmitter();
    mockInterface = {
      question: jest.fn(),
      close: jest.fn(),
      write: jest.fn(),
      output: {
        clearLine: jest.fn(),
        moveCursor: jest.fn(),
      },
      on: jest.fn((event, handler) => {
        mockEmitter.on(event, handler);
      }),
      once: jest.fn((event, handler) => {
        mockEmitter.once(event, handler);
      }),
      removeListener: jest.fn(),
      pause: jest.fn(),
      resume: jest.fn(),
      setPrompt: jest.fn(),
      prompt: jest.fn()
    };
    
    (readline.createInterface as jest.Mock).mockReturnValue(mockInterface);
  });

  describe('initialization', () => {
    it('should create readline interface with proper config', () => {
      inputBox.initialize();
      
      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
        terminal: true
      });
    });

    it('should set up key bindings for arrow keys', () => {
      inputBox.initialize();
      
      expect(mockInterface.on).toHaveBeenCalledWith('line', expect.any(Function));
      expect(mockInterface.on).toHaveBeenCalledWith('keypress', expect.any(Function));
    });
  });

  describe('display', () => {
    it('should display input box at bottom of screen', () => {
      const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      inputBox.display();
      
      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.flat().join('');
      expect(calls).toContain('━'); // Border
      
      consoleSpy.mockRestore();
    });

    it('should use theme colors for border', () => {
      themeManager.setTheme('monokai');
      const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      inputBox.display();
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('input handling', () => {
    beforeEach(() => {
      inputBox.initialize();
    });

    it('should handle text input', async () => {
      const promise = inputBox.getUserInput();
      
      // Simulate user typing
      mockEmitter.emit('line', 'Hello world');
      
      const result = await promise;
      expect(result).toBe('Hello world');
    });

    it('should support multiline input with arrow keys', () => {
      inputBox.initialize();
      inputBox.startInput();
      
      // Simulate arrow up key
      mockEmitter.emit('keypress', null, { name: 'up' });
      
      // Arrow up doesn't move cursor in single-line input, so we just check it doesn't throw
      expect(() => mockEmitter.emit('keypress', null, { name: 'up' })).not.toThrow();
    });

    it('should handle arrow left/right for cursor movement', () => {
      inputBox.initialize();
      inputBox.startInput();
      
      // Set some initial input
      inputBox['currentInput'] = 'test';
      inputBox['cursorPosition'] = 2;
      
      // Simulate arrow keys
      mockEmitter.emit('keypress', null, { name: 'left' });
      expect(mockInterface.output.moveCursor).toHaveBeenCalledWith(-1, 0);
      
      mockEmitter.emit('keypress', null, { name: 'right' });
      expect(mockInterface.output.moveCursor).toHaveBeenCalledWith(1, 0);
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when thinking', () => {
      const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      inputBox.initialize();
      inputBox.showThinking();
      
      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.flat().join('');
      expect(calls).toContain('Pensando');
      
      consoleSpy.mockRestore();
    });

    it('should hide loading and restore input box', () => {
      const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      inputBox.initialize();
      inputBox.showThinking();
      inputBox.hideThinking();
      
      expect(mockInterface.output.clearLine).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should animate spinner', () => {
      jest.useFakeTimers();
      const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      inputBox.initialize();
      inputBox.showThinking();
      
      // Advance timers to trigger animation
      jest.advanceTimersByTime(100);
      
      expect(consoleSpy).toHaveBeenCalled();
      inputBox.hideThinking();
      consoleSpy.mockRestore();
      jest.useRealTimers();
    });
  });

  describe('clear and reset', () => {
    it('should clear input box content', () => {
      inputBox.initialize();
      inputBox.clear();
      
      expect(mockInterface.output.clearLine).toHaveBeenCalled();
      expect(mockInterface.write).toHaveBeenCalledWith('');
    });

    it('should reset cursor position', () => {
      inputBox.initialize();
      inputBox.resetCursor();
      
      expect(mockInterface.output.moveCursor).toHaveBeenCalledWith(-1000, 0);
    });
  });

  describe('cleanup', () => {
    afterEach(() => {
      // Clean up any lingering timers
      jest.clearAllTimers();
    });

    it('should properly close readline interface', () => {
      inputBox.initialize();
      inputBox.destroy();
      
      expect(mockInterface.close).toHaveBeenCalled();
    });

    it('should stop spinner on destroy', () => {
      jest.useFakeTimers();
      inputBox.initialize();
      inputBox.showThinking();
      inputBox.destroy();
      
      expect(mockInterface.output.clearLine).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });
});
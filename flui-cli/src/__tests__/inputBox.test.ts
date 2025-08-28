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
      clearLine: jest.fn(),
      moveCursor: jest.fn(),
      on: jest.fn((event, handler) => {
        mockEmitter.on(event, handler);
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
      inputBox.startInput();
      
      // Simulate arrow up key
      mockEmitter.emit('keypress', null, { name: 'up' });
      
      expect(mockInterface.moveCursor).toHaveBeenCalled();
    });

    it('should handle arrow left/right for cursor movement', () => {
      inputBox.startInput();
      
      // Simulate arrow keys
      mockEmitter.emit('keypress', null, { name: 'left' });
      mockEmitter.emit('keypress', null, { name: 'right' });
      
      expect(mockInterface.moveCursor).toHaveBeenCalledTimes(2);
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when thinking', () => {
      const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      inputBox.showThinking();
      
      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.flat().join('');
      expect(calls).toContain('Pensando');
      
      consoleSpy.mockRestore();
    });

    it('should hide loading and restore input box', () => {
      const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      inputBox.showThinking();
      inputBox.hideThinking();
      
      expect(mockInterface.clearLine).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should animate spinner', (done) => {
      const consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      inputBox.showThinking();
      
      // Wait for animation frame
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledTimes(2); // Initial + animation
        inputBox.hideThinking();
        consoleSpy.mockRestore();
        done();
      }, 100);
    });
  });

  describe('clear and reset', () => {
    it('should clear input box content', () => {
      inputBox.initialize();
      inputBox.clear();
      
      expect(mockInterface.clearLine).toHaveBeenCalled();
      expect(mockInterface.write).toHaveBeenCalledWith('');
    });

    it('should reset cursor position', () => {
      inputBox.initialize();
      inputBox.resetCursor();
      
      expect(mockInterface.moveCursor).toHaveBeenCalledWith(-1000, 0);
    });
  });

  describe('cleanup', () => {
    it('should properly close readline interface', () => {
      inputBox.initialize();
      inputBox.destroy();
      
      expect(mockInterface.close).toHaveBeenCalled();
    });

    it('should stop spinner on destroy', () => {
      inputBox.showThinking();
      inputBox.destroy();
      
      expect(mockInterface.clearLine).toHaveBeenCalled();
    });
  });
});
import { ChatUI } from '../ui/chatUI';
import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';

jest.mock('chalk');
jest.mock('ora');
jest.mock('readline');

describe('ChatUI', () => {
  let chatUI: ChatUI;
  let mockSpinner: any;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    chatUI = new ChatUI();
    mockSpinner = {
      start: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
      text: '',
    };
    (ora as jest.Mock).mockReturnValue(mockSpinner);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('displayWelcome', () => {
    it('should display welcome message with instructions', () => {
      chatUI.displayWelcome();

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat().join('\n');
      expect(calls).toContain('LLM Chat CLI');
      expect(calls).toContain('/model');
      expect(calls).toContain('/exit');
    });
  });

  describe('displayMessage', () => {
    it('should display user message with proper formatting', () => {
      chatUI.displayMessage('Hello AI!', 'user');

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('You:');
      expect(calls).toContain('Hello AI!');
    });

    it('should display assistant message with proper formatting', () => {
      chatUI.displayMessage('Hello! How can I help?', 'assistant');

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('Assistant:');
      expect(calls).toContain('Hello! How can I help?');
    });

    it('should display system message with proper formatting', () => {
      chatUI.displayMessage('Model changed successfully', 'system');

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('System:');
      expect(calls).toContain('Model changed successfully');
    });
  });

  describe('displayError', () => {
    it('should display error message with proper formatting', () => {
      chatUI.displayError('Connection failed');

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat().join(' ');
      expect(calls).toContain('Error:');
      expect(calls).toContain('Connection failed');
    });
  });

  describe('displayModels', () => {
    it('should display formatted model list', () => {
      const modelList = '[1] Model A\n[2] Model B\n[3] Model C';
      chatUI.displayModels(modelList);

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat().join('\n');
      expect(calls).toContain('Available Models:');
      expect(calls).toContain(modelList);
    });
  });

  describe('showThinking', () => {
    it('should start spinner with thinking text', () => {
      chatUI.showThinking();

      expect(ora).toHaveBeenCalledWith({
        text: 'Pensando...',
        spinner: 'dots',
        color: 'cyan'
      });
      expect(mockSpinner.start).toHaveBeenCalled();
    });
  });

  describe('hideThinking', () => {
    it('should stop spinner', () => {
      chatUI.showThinking();
      chatUI.hideThinking();

      expect(mockSpinner.stop).toHaveBeenCalled();
    });

    it('should handle hideThinking without showing first', () => {
      expect(() => chatUI.hideThinking()).not.toThrow();
    });
  });

  describe('getUserInput', () => {
    it('should create readline interface and get user input', async () => {
      const mockInterface = {
        question: jest.fn((prompt, callback) => callback('user input')),
        close: jest.fn(),
      };
      
      (readline.createInterface as jest.Mock).mockReturnValue(mockInterface);

      const input = await chatUI.getUserInput();

      expect(readline.createInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      });
      expect(mockInterface.question).toHaveBeenCalledWith(
        expect.stringContaining('>'),
        expect.any(Function)
      );
      expect(mockInterface.close).toHaveBeenCalled();
      expect(input).toBe('user input');
    });
  });

  describe('clear', () => {
    it('should clear the console', () => {
      const mockClear = jest.spyOn(console, 'clear').mockImplementation();
      
      chatUI.clear();

      expect(mockClear).toHaveBeenCalled();
      
      mockClear.mockRestore();
    });
  });

  describe('displayDisclaimer', () => {
    it('should display disclaimer message', () => {
      chatUI.displayDisclaimer();

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat().join('\n');
      expect(calls).toContain('AVISO');
      expect(calls).toContain('fins de estudo');
    });
  });
});
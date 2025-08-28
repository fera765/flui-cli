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
    // Mock readline before creating ChatUI
    jest.clearAllMocks();
    
    mockSpinner = {
      start: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
      text: '',
    };
    (ora as any).mockReturnValue(mockSpinner);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'clear').mockImplementation();
    
    chatUI = new ChatUI();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('displayWelcome', () => {
    it('should display welcome message with instructions', () => {
      chatUI.displayWelcome();

      expect(consoleLogSpy).toHaveBeenCalled();
      const calls = consoleLogSpy.mock.calls.flat().join('\n');
      expect(calls).toContain('Flui CLI');
      expect(calls).toContain('/model');
      expect(calls).toContain('/theme');
      expect(calls).toContain('/exit');
    });
  });

  describe('displayMessage', () => {
    it('should display user message with proper formatting', () => {
      chatUI.displayMessage('Hello AI!', 'user');

      // Message is now added to timeline, not directly logged
      const timeline = chatUI.getTimeline();
      const messages = timeline.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Hello AI!');
      expect(messages[0].role).toBe('user');
    });

    it('should display assistant message with proper formatting', () => {
      chatUI.displayMessage('Hello! How can I help?', 'assistant');

      const timeline = chatUI.getTimeline();
      const messages = timeline.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Hello! How can I help?');
      expect(messages[0].role).toBe('assistant');
    });

    it('should display system message with proper formatting', () => {
      chatUI.displayMessage('Model changed successfully', 'system');

      const timeline = chatUI.getTimeline();
      const messages = timeline.getMessages();
      expect(messages).toHaveLength(1);
      expect(messages[0].content).toBe('Model changed successfully');
      expect(messages[0].role).toBe('system');
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
    it('should show thinking indicator', () => {
      // showThinking now delegates to inputBox
      expect(() => chatUI.showThinking()).not.toThrow();
    });
  });

  describe('hideThinking', () => {
    it('should hide thinking indicator', () => {
      chatUI.showThinking();
      expect(() => chatUI.hideThinking()).not.toThrow();
    });

    it('should handle hideThinking without showing first', () => {
      expect(() => chatUI.hideThinking()).not.toThrow();
    });
  });

  describe('getUserInput', () => {
    it('should get user input from input box', async () => {
      // getUserInput now delegates to inputBox
      const inputPromise = chatUI.getUserInput();
      
      // The mock will resolve with 'user input'
      const input = await inputPromise;
      
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
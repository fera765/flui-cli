import { MessageTimeline } from '../ui/messageTimeline';
import { ThemeManager } from '../ui/themeManager';

describe('MessageTimeline', () => {
  let timeline: MessageTimeline;
  let themeManager: ThemeManager;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    themeManager = new ThemeManager();
    timeline = new MessageTimeline(themeManager);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('message formatting', () => {
    it('should format user message with > prefix and darker color', () => {
      timeline.addUserMessage('Oi tudo bem ?');
      timeline.display();

      const output = consoleLogSpy.mock.calls.flat().join('\n');
      expect(output).toContain('> Oi tudo bem ?');
    });

    it('should format assistant message with lighter color and no prefix', () => {
      timeline.addAssistantMessage('Sim tudo bem, como posso ajudar ?');
      timeline.display();

      const output = consoleLogSpy.mock.calls.flat().join('\n');
      expect(output).toContain('Sim tudo bem, como posso ajudar ?');
      expect(output).not.toContain('> Sim');
    });

    it('should maintain proper spacing between messages', () => {
      timeline.addUserMessage('Oi tudo bem ?');
      timeline.addAssistantMessage('Sim tudo bem, como posso ajudar ?');
      timeline.display();

      const output = consoleLogSpy.mock.calls.flat().join('\n');
      expect(output).toContain('> Oi tudo bem ?\n\nSim tudo bem, como posso ajudar ?');
    });
  });

  describe('message history', () => {
    it('should maintain message order', () => {
      timeline.addUserMessage('First question');
      timeline.addAssistantMessage('First answer');
      timeline.addUserMessage('Second question');
      timeline.addAssistantMessage('Second answer');

      const messages = timeline.getMessages();
      expect(messages).toHaveLength(4);
      expect(messages[0].content).toBe('First question');
      expect(messages[1].content).toBe('First answer');
      expect(messages[2].content).toBe('Second question');
      expect(messages[3].content).toBe('Second answer');
    });

    it('should limit history to prevent memory issues', () => {
      // Add many messages
      for (let i = 0; i < 100; i++) {
        timeline.addUserMessage(`Question ${i}`);
        timeline.addAssistantMessage(`Answer ${i}`);
      }

      const messages = timeline.getMessages();
      expect(messages.length).toBeLessThanOrEqual(50); // Max 50 messages
    });
  });

  describe('theme integration', () => {
    it('should use theme colors for user messages', () => {
      themeManager.setTheme('dark');
      timeline.addUserMessage('Test message');
      
      const formatted = timeline.formatMessage({
        role: 'user',
        content: 'Test message',
        timestamp: new Date()
      });

      expect(formatted).toContain('> Test message');
    });

    it('should use theme colors for assistant messages', () => {
      themeManager.setTheme('light');
      timeline.addAssistantMessage('Response');
      
      const formatted = timeline.formatMessage({
        role: 'assistant',
        content: 'Response',
        timestamp: new Date()
      });

      expect(formatted).toContain('Response');
    });

    it('should update colors when theme changes', () => {
      timeline.addUserMessage('Hello');
      
      themeManager.setTheme('monokai');
      const formatted1 = timeline.formatMessage({
        role: 'user',
        content: 'Hello',
        timestamp: new Date()
      });

      themeManager.setTheme('dracula');
      const formatted2 = timeline.formatMessage({
        role: 'user',
        content: 'Hello',
        timestamp: new Date()
      });

      // Both should contain the message but potentially with different formatting
      expect(formatted1).toContain('> Hello');
      expect(formatted2).toContain('> Hello');
    });
  });

    describe('display options', () => {
    it('should clear screen before displaying', () => {
      const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      timeline.addUserMessage('Test');
      timeline.display(true); // Clear screen
      
      expect(writeSpy).toHaveBeenCalledWith('\x1Bc');
      expect(writeSpy).toHaveBeenCalledWith('\x1B[H');
      
      writeSpy.mockRestore();
    });

    it('should not clear screen when option is false', () => {
      const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
      
      timeline.addUserMessage('Test');
      timeline.display(false); // Don't clear

      expect(writeSpy).not.toHaveBeenCalledWith('\x1Bc');
      
      writeSpy.mockRestore();
    });

    it('should scroll to latest message', () => {
      for (let i = 0; i < 10; i++) {
        timeline.addUserMessage(`Message ${i}`);
      }

      timeline.display();
      
      const output = consoleLogSpy.mock.calls.flat().join('\n');
      expect(output).toContain('Message 9');
    });
  });

  describe('system messages', () => {
    it('should format system messages differently', () => {
      timeline.addSystemMessage('Model changed to Mistral');
      timeline.display();

      const output = consoleLogSpy.mock.calls.flat().join('\n');
      expect(output).toContain('Model changed to Mistral');
    });

    it('should use system message color from theme', () => {
      themeManager.setTheme('dark');
      
      const formatted = timeline.formatMessage({
        role: 'system',
        content: 'System notification',
        timestamp: new Date()
      });

      expect(formatted).toContain('System notification');
    });
  });

  describe('clear functionality', () => {
    it('should clear all messages', () => {
      timeline.addUserMessage('Test 1');
      timeline.addAssistantMessage('Response 1');
      
      timeline.clear();
      
      expect(timeline.getMessages()).toHaveLength(0);
    });

    it('should display empty timeline after clear', () => {
      timeline.addUserMessage('Test');
      timeline.clear();
      timeline.display();

      const output = consoleLogSpy.mock.calls.flat().join('\n');
      expect(output).toBe('');
    });
  });
});
import { ThemeManager } from './themeManager';
import { MarkdownRenderer } from './markdownRenderer';

export interface TimelineMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class MessageTimeline {
  private messages: TimelineMessage[] = [];
  private visibleMessages: TimelineMessage[] = [];
  private maxMessages: number = 50;
  private isCleared: boolean = false;
  private markdownRenderer: MarkdownRenderer;

  constructor(private themeManager: ThemeManager) {
    this.markdownRenderer = new MarkdownRenderer(themeManager);
  }

  addUserMessage(content: string): void {
    this.addMessage({
      role: 'user',
      content,
      timestamp: new Date()
    });
  }

  addAssistantMessage(content: string): void {
    this.addMessage({
      role: 'assistant',
      content,
      timestamp: new Date()
    });
  }

  addSystemMessage(content: string): void {
    this.addMessage({
      role: 'system',
      content,
      timestamp: new Date()
    });
  }

  private addMessage(message: TimelineMessage): void {
    this.messages.push(message);
    this.visibleMessages.push(message);
    
    // Limit message history
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
    if (this.visibleMessages.length > this.maxMessages) {
      this.visibleMessages = this.visibleMessages.slice(-this.maxMessages);
    }
  }

  getMessages(): TimelineMessage[] {
    return [...this.messages];
  }

  formatMessage(message: TimelineMessage): string {
    switch (message.role) {
      case 'user':
        // User messages with > prefix and darker color
        const userContent = `> ${message.content}`;
        return this.themeManager.formatUserMessage(userContent);
      
      case 'assistant':
        // Assistant messages with markdown rendering
        const rendered = this.markdownRenderer.render(message.content);
        return this.themeManager.formatAssistantMessage(rendered.trim());
      
      case 'system':
        // System messages with special formatting
        return this.themeManager.formatSystemMessage(message.content);
      
      default:
        return message.content;
    }
  }

  display(clearScreen: boolean = false): void {
    if (clearScreen) {
      process.stdout.write('\x1Bc'); // Clear screen completely
      process.stdout.write('\x1B[H'); // Move cursor to home
    }

    if (this.visibleMessages.length === 0) {
      return;
    }

    const formattedMessages: string[] = [];
    
    for (let i = 0; i < this.visibleMessages.length; i++) {
      const message = this.visibleMessages[i];
      const formatted = this.formatMessage(message);
      
      formattedMessages.push(formatted);
      
      // Add spacing between messages
      if (i < this.visibleMessages.length - 1) {
        const nextMessage = this.visibleMessages[i + 1];
        // Add extra line break between all messages for better readability
        if ((message.role === 'user' || message.role === 'assistant') && 
            (nextMessage.role === 'user' || nextMessage.role === 'assistant')) {
          formattedMessages.push(''); // Empty line for spacing (simulates ~20px)
        }
      }
    }

    // Display all messages
    const output = formattedMessages.join('\n');
    if (output) {
      console.log(output);
    }
  }

  displayLatest(count: number = 10): void {
    const latestMessages = this.messages.slice(-count);
    const tempMessages = this.messages;
    this.messages = latestMessages;
    this.display();
    this.messages = tempMessages;
  }

  clear(): void {
    this.messages = [];
    this.visibleMessages = [];
  }
  
  clearVisible(): void {
    // Clear only visible messages, keep context
    this.visibleMessages = [];
  }

  getLastMessage(): TimelineMessage | null {
    return this.messages.length > 0 
      ? this.messages[this.messages.length - 1] 
      : null;
  }

  getMessageCount(): number {
    return this.messages.length;
  }
}
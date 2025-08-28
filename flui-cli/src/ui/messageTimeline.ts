import { ThemeManager } from './themeManager';

export interface TimelineMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export class MessageTimeline {
  private messages: TimelineMessage[] = [];
  private maxMessages: number = 50;

  constructor(private themeManager: ThemeManager) {}

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
    
    // Limit message history
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
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
        // Assistant messages with lighter color, no prefix
        return this.themeManager.formatAssistantMessage(message.content);
      
      case 'system':
        // System messages with special formatting
        return this.themeManager.formatSystemMessage(message.content);
      
      default:
        return message.content;
    }
  }

  display(clearScreen: boolean = false): void {
    if (clearScreen) {
      console.clear();
    }

    if (this.messages.length === 0) {
      return;
    }

    const formattedMessages: string[] = [];
    
    for (let i = 0; i < this.messages.length; i++) {
      const message = this.messages[i];
      const formatted = this.formatMessage(message);
      
      formattedMessages.push(formatted);
      
      // Add spacing between messages
      if (i < this.messages.length - 1) {
        // Add extra line break between user and assistant messages
        const nextMessage = this.messages[i + 1];
        if (message.role === 'user' && nextMessage.role === 'assistant') {
          formattedMessages.push(''); // Empty line for spacing
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
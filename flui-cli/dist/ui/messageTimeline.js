"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageTimeline = void 0;
const markdownRenderer_1 = require("./markdownRenderer");
class MessageTimeline {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.messages = [];
        this.visibleMessages = [];
        this.maxMessages = 50;
        this.isCleared = false;
        this.markdownRenderer = new markdownRenderer_1.MarkdownRenderer(themeManager);
    }
    addUserMessage(content) {
        this.addMessage({
            role: 'user',
            content,
            timestamp: new Date()
        });
    }
    addAssistantMessage(content) {
        this.addMessage({
            role: 'assistant',
            content,
            timestamp: new Date()
        });
    }
    addSystemMessage(content) {
        this.addMessage({
            role: 'system',
            content,
            timestamp: new Date()
        });
    }
    addMessage(message) {
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
    getMessages() {
        return [...this.messages];
    }
    formatMessage(message) {
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
    display(clearScreen = false) {
        if (clearScreen) {
            process.stdout.write('\x1Bc'); // Clear screen completely
            process.stdout.write('\x1B[H'); // Move cursor to home
        }
        if (this.visibleMessages.length === 0) {
            return;
        }
        const formattedMessages = [];
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
    displayLatest(count = 10) {
        const latestMessages = this.messages.slice(-count);
        const tempMessages = this.messages;
        this.messages = latestMessages;
        this.display();
        this.messages = tempMessages;
    }
    clear() {
        this.messages = [];
        this.visibleMessages = [];
    }
    clearVisible() {
        // Clear only visible messages, keep context
        this.visibleMessages = [];
    }
    getLastMessage() {
        return this.messages.length > 0
            ? this.messages[this.messages.length - 1]
            : null;
    }
    getMessageCount() {
        return this.messages.length;
    }
}
exports.MessageTimeline = MessageTimeline;
//# sourceMappingURL=messageTimeline.js.map
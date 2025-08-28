"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageTimeline = void 0;
class MessageTimeline {
    constructor(themeManager) {
        this.themeManager = themeManager;
        this.messages = [];
        this.maxMessages = 50;
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
        // Limit message history
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
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
                // Assistant messages with lighter color, no prefix
                return this.themeManager.formatAssistantMessage(message.content);
            case 'system':
                // System messages with special formatting
                return this.themeManager.formatSystemMessage(message.content);
            default:
                return message.content;
        }
    }
    display(clearScreen = false) {
        if (clearScreen) {
            console.clear();
        }
        if (this.messages.length === 0) {
            return;
        }
        const formattedMessages = [];
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
    displayLatest(count = 10) {
        const latestMessages = this.messages.slice(-count);
        const tempMessages = this.messages;
        this.messages = latestMessages;
        this.display();
        this.messages = tempMessages;
    }
    clear() {
        this.messages = [];
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
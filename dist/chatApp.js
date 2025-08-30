"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatApp = void 0;
const settingsManager_1 = require("./services/settingsManager");
const themeSelector_1 = require("./ui/themeSelector");
const modelSelector_1 = require("./ui/modelSelector");
class ChatApp {
    constructor(apiService, modelManager, chatUI) {
        this.apiService = apiService;
        this.modelManager = modelManager;
        this.chatUI = chatUI;
        this.conversationHistory = [];
        this.isRunning = false;
        this.currentRequest = null;
        this.settingsManager = new settingsManager_1.SettingsManager();
        this.themeSelector = new themeSelector_1.ThemeSelector(this.chatUI.getThemeManager(), this.settingsManager);
        this.modelSelector = new modelSelector_1.ModelSelector(this.modelManager, this.settingsManager, this.chatUI.getThemeManager());
    }
    async initialize() {
        try {
            await this.modelManager.initialize();
            // Load saved settings
            const settings = this.settingsManager.getAllSettings();
            // Apply saved theme
            if (settings.theme) {
                try {
                    this.chatUI.getThemeManager().setTheme(settings.theme);
                }
                catch (e) {
                    // Use default if saved theme is invalid
                }
            }
            // Apply saved model
            if (settings.modelIndex) {
                try {
                    this.modelManager.selectModel(settings.modelIndex);
                }
                catch (e) {
                    // Use default if saved model is invalid
                }
            }
            // Setup ESC key handler
            this.setupEscapeHandler();
            this.chatUI.displayDisclaimer();
            this.chatUI.displayWelcome();
            this.chatUI.displayModels(this.modelManager.getFormattedModelList());
        }
        catch (error) {
            this.chatUI.displayError(`Erro ao inicializar: ${error}`);
            throw new Error('Failed to initialize chat');
        }
    }
    setupEscapeHandler() {
        process.stdin.on('keypress', (str, key) => {
            if (key && key.name === 'escape') {
                this.handleEscape();
            }
        });
    }
    handleEscape() {
        if (this.currentRequest) {
            // Abort current API request
            this.currentRequest.abort();
            this.currentRequest = null;
            this.chatUI.hideThinking();
            console.log('\n⚠️ Action aborted\n');
            this.chatUI.getInputBox().display();
        }
    }
    async processInput() {
        try {
            const input = await this.chatUI.getUserInput();
            if (!input || input.trim() === '') {
                return true;
            }
            // Check for commands
            if (input.startsWith('/')) {
                const shouldContinue = await this.handleCommand(input);
                // Always return true unless it's /exit
                return shouldContinue;
            }
            // Regular message
            await this.sendMessage(input);
            return true;
        }
        catch (error) {
            // Don't exit on errors, just show them and continue
            console.error('Error processing input:', error);
            return true;
        }
    }
    async handleCommand(command) {
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        switch (cmd) {
            case '/exit':
                this.chatUI.displayMessage('Encerrando chat. Até logo!', 'system');
                return false;
            case '/model':
                // Pause input box during selection
                this.chatUI.getInputBox().pause();
                try {
                    const modelChanged = await this.modelSelector.selectModel();
                    // Clear and redraw everything
                    process.stdout.write('\x1Bc');
                    process.stdout.write('\x1B[H');
                    this.chatUI.displayWelcome();
                    if (modelChanged) {
                        this.chatUI.displayModels(this.modelManager.getFormattedModelList());
                    }
                    this.chatUI.getTimeline().display(false);
                }
                catch (error) {
                    console.error('Model selection error:', error);
                }
                finally {
                    // Always resume input box
                    this.chatUI.getInputBox().resume();
                    this.chatUI.getInputBox().display();
                }
                return true;
            case '/theme':
                // Pause input box during selection
                this.chatUI.getInputBox().pause();
                try {
                    const themeChanged = await this.themeSelector.selectTheme();
                    // Clear and redraw everything
                    process.stdout.write('\x1Bc');
                    process.stdout.write('\x1B[H');
                    this.chatUI.displayWelcome();
                    this.chatUI.getTimeline().display(false);
                }
                catch (error) {
                    console.error('Theme selection error:', error);
                }
                finally {
                    // Always resume input box
                    this.chatUI.getInputBox().resume();
                    this.chatUI.getInputBox().display();
                }
                return true;
            default:
                this.chatUI.displayError(`Comando desconhecido: ${cmd}`);
                return true;
        }
    }
    async sendMessage(message) {
        try {
            this.chatUI.displayMessage(message, 'user');
            this.chatUI.showThinking();
            // Create abort controller for this request
            this.currentRequest = new AbortController();
            const response = await this.apiService.sendMessage(message, this.modelManager.getCurrentModelId(), [...this.conversationHistory], // Send copy of history
            this.currentRequest.signal // Pass abort signal
            );
            this.currentRequest = null;
            this.chatUI.hideThinking();
            this.chatUI.displayMessage(response, 'assistant');
            // Update conversation history AFTER successful response
            this.conversationHistory.push({ role: 'user', content: message }, { role: 'assistant', content: response });
            // Keep history manageable (last 20 messages)
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }
        }
        catch (error) {
            this.currentRequest = null;
            this.chatUI.hideThinking();
            // Don't show error if it was aborted
            if (error.name !== 'AbortError') {
                this.chatUI.displayError(`Erro ao enviar mensagem: ${error}`);
            }
        }
    }
    async run() {
        try {
            await this.initialize();
            this.isRunning = true;
            while (this.isRunning) {
                this.isRunning = await this.processInput();
            }
        }
        catch (error) {
            this.chatUI.displayError(`Erro fatal: ${error}`);
            console.log('[DEBUG] run: Fatal error:', error);
        }
    }
}
exports.ChatApp = ChatApp;
//# sourceMappingURL=chatApp.js.map
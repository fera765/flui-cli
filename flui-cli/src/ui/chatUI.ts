import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';
import { ThemeManager } from './themeManager';
import { CleanInputBox } from './cleanInputBox';
import { MessageTimeline } from './messageTimeline';

export class ChatUI {
  private spinner: any = null;
  private themeManager: ThemeManager;
  private inputBox: CleanInputBox;
  private timeline: MessageTimeline;

  constructor() {
    this.themeManager = new ThemeManager();
    this.inputBox = new CleanInputBox(this.themeManager);
    this.timeline = new MessageTimeline(this.themeManager);
    this.inputBox.initialize();
    
    // Connect Ctrl+L handler
    this.inputBox.onClearScreen = () => {
      this.timeline.clearVisible();
      this.timeline.display(true);
      this.inputBox.display();
    };
  }

  displayWelcome(): void {
    // Clear terminal completely
    process.stdout.write('\x1Bc'); // Clear screen and scrollback
    process.stdout.write('\x1B[3J'); // Clear scrollback buffer
    process.stdout.write('\x1B[H'); // Move cursor to home
    
    const primary = this.themeManager.formatPrimary('\n ╔════════════════════════════════════════╗ ');
    console.log(primary);
    console.log(this.themeManager.formatPrimary(' ║         Flui CLI v1.0.0                ║ '));
    console.log(this.themeManager.formatPrimary(' ╚════════════════════════════════════════╝ \n'));
    
    console.log(this.themeManager.formatInfo('Comandos disponíveis:'));
    console.log(this.themeManager.formatWarning('  /model [1-3]') + this.themeManager.formatBorder(' - Trocar modelo'));
    console.log(this.themeManager.formatWarning('  /theme') + this.themeManager.formatBorder(' - Trocar tema'));
    console.log(this.themeManager.formatWarning('  /exit') + this.themeManager.formatBorder(' - Sair do chat'));
    console.log(); // Just a blank line instead of border
  }

  displayDisclaimer(): void {
    console.log(chalk.bgRed.white('\n ⚠️  AVISO IMPORTANTE ⚠️ \n'));
    console.log(chalk.red('Este código foi desenvolvido exclusivamente para fins de estudo.'));
    console.log(chalk.red('O autor não se responsabiliza por qualquer uso ou ação realizada.'));
    console.log(chalk.red('@LLM7.io - Uso educacional apenas.\n'));
  }

  displayMessage(message: string, role: 'user' | 'assistant' | 'system'): void {
    // Simple display without cursor movement
    switch (role) {
      case 'user':
        // For user messages, show with > prefix
        console.log(this.themeManager.formatUserMessage(`> ${message}`));
        break;
      case 'assistant':
        // For assistant messages, print them directly
        console.log(this.themeManager.formatAssistantMessage(message));
        console.log(); // Add spacing
        break;
      case 'system':
        console.log(this.themeManager.formatSystemMessage(message));
        break;
    }
  }

  displayError(error: string): void {
    console.log(chalk.red('\n❌ Error:'), chalk.red(error));
  }

  displayModels(modelList: string): void {
    console.log(this.themeManager.formatInfo('\n📋 Available Models:\n'));
    console.log(modelList);
    console.log(this.themeManager.formatBorder('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  displayThemes(themeList: string): void {
    console.log(this.themeManager.formatInfo('\n🎨 Available Themes:\n'));
    console.log(themeList);
    console.log(this.themeManager.formatBorder('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  getThemeManager(): ThemeManager {
    return this.themeManager;
  }

  getTimeline(): MessageTimeline {
    return this.timeline;
  }

  getInputBox(): CleanInputBox {
    return this.inputBox;
  }

  destroy(): void {
    this.inputBox.destroy();
  }

  showThinking(): void {
    this.inputBox.showThinking();
  }

  hideThinking(): void {
    this.inputBox.hideThinking();
  }

  async getUserInput(prompt: string = ''): Promise<string> {
    return this.inputBox.getInput();
  }

  clear(): void {
    console.clear();
  }

  displaySeparator(): void {
    console.log(chalk.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }
}

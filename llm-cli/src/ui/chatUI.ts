import chalk from 'chalk';
import ora from 'ora';
import * as readline from 'readline';

export class ChatUI {
  private spinner: any = null;

  displayWelcome(): void {
    console.clear();
    console.log(chalk.bgGreen.black('\n ╔════════════════════════════════════════╗ '));
    console.log(chalk.bgGreen.black(' ║         LLM Chat CLI v1.0.0            ║ '));
    console.log(chalk.bgGreen.black(' ╚════════════════════════════════════════╝ \n'));
    
    console.log(chalk.cyan('Comandos disponíveis:'));
    console.log(chalk.yellow('  /model [1-3]') + chalk.gray(' - Trocar modelo'));
    console.log(chalk.yellow('  /exit') + chalk.gray(' - Sair do chat'));
    console.log(chalk.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  displayDisclaimer(): void {
    console.log(chalk.bgRed.white('\n ⚠️  AVISO IMPORTANTE ⚠️ \n'));
    console.log(chalk.red('Este código foi desenvolvido exclusivamente para fins de estudo.'));
    console.log(chalk.red('O autor não se responsabiliza por qualquer uso ou ação realizada.'));
    console.log(chalk.red('@LLM7.io - Uso educacional apenas.\n'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  displayMessage(message: string, role: 'user' | 'assistant' | 'system'): void {
    switch (role) {
      case 'user':
        console.log(chalk.blue('\n👤 You:'));
        console.log(chalk.white(message));
        break;
      case 'assistant':
        console.log(chalk.green('\n🤖 Assistant:'));
        console.log(chalk.white(message));
        break;
      case 'system':
        console.log(chalk.yellow('\n⚙️  System:'));
        console.log(chalk.yellow(message));
        break;
    }
  }

  displayError(error: string): void {
    console.log(chalk.red('\n❌ Error:'), chalk.red(error));
  }

  displayModels(modelList: string): void {
    console.log(chalk.cyan('\n📋 Available Models:\n'));
    console.log(modelList);
    console.log(chalk.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }

  showThinking(): void {
    this.spinner = ora({
      text: 'Pensando...',
      spinner: 'dots',
      color: 'cyan'
    }).start();
  }

  hideThinking(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  async getUserInput(prompt: string = ''): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      const displayPrompt = prompt || chalk.cyan('\n💬 > ');
      rl.question(displayPrompt, (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
  }

  clear(): void {
    console.clear();
  }

  displaySeparator(): void {
    console.log(chalk.gray('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }
}

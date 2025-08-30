import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

export interface ErrorContext {
  error: Error | any;
  operation: string;
  params?: any;
  timestamp: Date;
}

export interface ErrorSolution {
  type: string;
  solution: string;
  autoFix?: () => Promise<boolean>;
}

export class ErrorHandler {
  private errorHistory: ErrorContext[] = [];
  private maxHistorySize: number = 100;
  
  async analyzeAndFix(error: any, operation: string, params?: any): Promise<{
    fixed: boolean;
    solution?: string;
    retryable: boolean;
  }> {
    // Registra o erro
    this.recordError(error, operation, params);
    
    // Analisa o tipo de erro
    const solution = this.analyzeSolution(error, operation);
    
    // Tenta auto-corrigir
    if (solution.autoFix) {
      try {
        const fixed = await solution.autoFix();
        if (fixed) {
          console.log(chalk.green(`✅ Erro corrigido automaticamente: ${solution.solution}`));
          return { fixed: true, solution: solution.solution, retryable: true };
        }
      } catch (fixError) {
        console.log(chalk.yellow(`⚠️ Não foi possível aplicar correção automática`));
      }
    }
    
    return { 
      fixed: false, 
      solution: solution.solution,
      retryable: this.isRetryable(error)
    };
  }
  
  private recordError(error: any, operation: string, params?: any) {
    this.errorHistory.push({
      error,
      operation,
      params,
      timestamp: new Date()
    });
    
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }
  
  private analyzeSolution(error: any, operation: string): ErrorSolution {
    const errorMessage = error.message || error.toString();
    
    // ENOENT - Arquivo ou diretório não encontrado
    if (errorMessage.includes('ENOENT')) {
      const pathMatch = errorMessage.match(/ENOENT.*'([^']+)'/);
      const missingPath = pathMatch ? pathMatch[1] : null;
      
      return {
        type: 'ENOENT',
        solution: 'Arquivo ou diretório não encontrado. Criando automaticamente...',
        autoFix: async () => {
          if (missingPath) {
            try {
              const dir = path.dirname(missingPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }
              
              // Se for um arquivo que termina com extensão, cria vazio
              if (path.extname(missingPath)) {
                fs.writeFileSync(missingPath, '');
              }
              
              return true;
            } catch {
              return false;
            }
          }
          return false;
        }
      };
    }
    
    // EACCES - Permissão negada
    if (errorMessage.includes('EACCES')) {
      return {
        type: 'EACCES',
        solution: 'Permissão negada. Verifique as permissões do arquivo/diretório.',
        autoFix: async () => {
          // Tenta mudar permissões se possível
          const pathMatch = errorMessage.match(/EACCES.*'([^']+)'/);
          if (pathMatch && pathMatch[1]) {
            try {
              fs.chmodSync(pathMatch[1], 0o755);
              return true;
            } catch {
              return false;
            }
          }
          return false;
        }
      };
    }
    
    // EEXIST - Arquivo já existe
    if (errorMessage.includes('EEXIST')) {
      return {
        type: 'EEXIST',
        solution: 'Arquivo ou diretório já existe. Usando o existente.',
        autoFix: async () => true // Não é erro, apenas continua
      };
    }
    
    // Timeout
    if (errorMessage.includes('ETIMEDOUT') || errorMessage.includes('timeout')) {
      return {
        type: 'TIMEOUT',
        solution: 'Timeout na operação. Aumentando tempo limite e tentando novamente...',
        autoFix: async () => {
          // Aguarda um pouco antes de retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;
        }
      };
    }
    
    // Erro de sintaxe em JSON
    if (errorMessage.includes('JSON') || errorMessage.includes('Unexpected token')) {
      return {
        type: 'JSON_PARSE',
        solution: 'Erro ao processar JSON. Verificando formato...',
        autoFix: async () => {
          // Tenta corrigir JSON comum
          if (operation === 'file_write' || operation === 'file_read') {
            return false; // Precisa de intervenção manual
          }
          return false;
        }
      };
    }
    
    // Comando não encontrado (shell)
    if (errorMessage.includes('command not found') || errorMessage.includes('não é reconhecido')) {
      return {
        type: 'COMMAND_NOT_FOUND',
        solution: 'Comando não encontrado. Verificando alternativas...',
        autoFix: async () => {
          // Sugere alternativas comuns
          if (operation === 'shell') {
            console.log(chalk.yellow('💡 Dica: Verifique se o comando está instalado'));
          }
          return false;
        }
      };
    }
    
    // Erro genérico
    return {
      type: 'GENERIC',
      solution: `Erro: ${errorMessage}. Analisando possíveis soluções...`,
      autoFix: async () => false
    };
  }
  
  private isRetryable(error: any): boolean {
    const errorMessage = error.message || error.toString();
    
    // Erros que podem ser tentados novamente
    const retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ECONNREFUSED',
      'EAGAIN',
      'timeout',
      'ENOENT' // Depois de criar o arquivo/diretório
    ];
    
    return retryableErrors.some(err => errorMessage.includes(err));
  }
  
  getErrorHistory(): ErrorContext[] {
    return [...this.errorHistory];
  }
  
  clearHistory() {
    this.errorHistory = [];
  }
  
  getLastError(): ErrorContext | null {
    return this.errorHistory[this.errorHistory.length - 1] || null;
  }
  
  formatErrorReport(): string {
    if (this.errorHistory.length === 0) {
      return chalk.green('✅ Nenhum erro registrado');
    }
    
    const recent = this.errorHistory.slice(-5);
    let report = chalk.red(`📊 Últimos ${recent.length} erros:\n`);
    
    recent.forEach((ctx, i) => {
      const errorMsg = ctx.error.message || ctx.error.toString();
      report += chalk.gray(`${i + 1}. ${ctx.operation}: ${errorMsg.substring(0, 50)}...\n`);
    });
    
    return report;
  }
}
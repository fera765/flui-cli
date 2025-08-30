import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface NavigationHistory {
  current: string;
  history: string[];
  projectRoot: string;
}

export class NavigationManager {
  private history: string[] = [];
  private currentDir: string;
  private projectRoot: string;
  private maxHistorySize: number = 50;

  constructor() {
    this.currentDir = process.cwd();
    this.projectRoot = this.findProjectRoot();
    this.history.push(this.currentDir);
  }

  private findProjectRoot(): string {
    let dir = this.currentDir;
    
    // Procura por indicadores de raiz do projeto
    while (dir !== path.dirname(dir)) {
      if (
        fs.existsSync(path.join(dir, 'package.json')) ||
        fs.existsSync(path.join(dir, '.git')) ||
        fs.existsSync(path.join(dir, '.gitignore')) ||
        fs.existsSync(path.join(dir, 'README.md'))
      ) {
        return dir;
      }
      dir = path.dirname(dir);
    }
    
    return this.currentDir;
  }

  getCurrentDir(): string {
    return this.currentDir;
  }

  getProjectRoot(): string {
    return this.projectRoot;
  }

  getHistory(): string[] {
    return [...this.history];
  }

  async navigateTo(targetPath: string): Promise<{ success: boolean; path: string; error?: string }> {
    try {
      const absolutePath = path.isAbsolute(targetPath) 
        ? targetPath 
        : path.resolve(this.currentDir, targetPath);
      
      // Verifica se o diretório existe
      if (!fs.existsSync(absolutePath)) {
        return { 
          success: false, 
          path: absolutePath,
          error: `Diretório não existe: ${absolutePath}` 
        };
      }

      // Verifica se é um diretório
      const stats = fs.statSync(absolutePath);
      if (!stats.isDirectory()) {
        return { 
          success: false, 
          path: absolutePath,
          error: `Não é um diretório: ${absolutePath}` 
        };
      }

      // Navega para o diretório
      process.chdir(absolutePath);
      this.currentDir = absolutePath;
      
      // Adiciona ao histórico
      this.history.push(absolutePath);
      if (this.history.length > this.maxHistorySize) {
        this.history.shift();
      }

      return { 
        success: true, 
        path: absolutePath 
      };
    } catch (error: any) {
      return { 
        success: false, 
        path: targetPath,
        error: error.message 
      };
    }
  }

  async createAndNavigate(dirPath: string): Promise<{ success: boolean; path: string; error?: string }> {
    try {
      const absolutePath = path.isAbsolute(dirPath) 
        ? dirPath 
        : path.resolve(this.currentDir, dirPath);
      
      // Cria o diretório se não existir
      if (!fs.existsSync(absolutePath)) {
        fs.mkdirSync(absolutePath, { recursive: true });
      }

      // Navega para o diretório
      return await this.navigateTo(absolutePath);
    } catch (error: any) {
      return { 
        success: false, 
        path: dirPath,
        error: error.message 
      };
    }
  }

  goBack(): { success: boolean; path: string; error?: string } {
    if (this.history.length > 1) {
      this.history.pop(); // Remove o atual
      const previousDir = this.history[this.history.length - 1];
      return this.navigateToSync(previousDir);
    }
    
    return { 
      success: false, 
      path: this.currentDir,
      error: 'Não há histórico anterior' 
    };
  }

  private navigateToSync(targetPath: string): { success: boolean; path: string; error?: string } {
    try {
      process.chdir(targetPath);
      this.currentDir = targetPath;
      return { success: true, path: targetPath };
    } catch (error: any) {
      return { 
        success: false, 
        path: targetPath,
        error: error.message 
      };
    }
  }

  isInProjectRoot(): boolean {
    return this.currentDir === this.projectRoot;
  }

  getRelativeToProject(targetPath?: string): string {
    const absPath = targetPath 
      ? path.resolve(this.currentDir, targetPath)
      : this.currentDir;
    return path.relative(this.projectRoot, absPath);
  }

  analyzeContext(): {
    isProject: boolean;
    projectType?: string;
    hasPackageJson: boolean;
    hasGit: boolean;
    files: string[];
  } {
    const files = fs.readdirSync(this.currentDir);
    const hasPackageJson = files.includes('package.json');
    const hasGit = files.includes('.git');
    
    let projectType: string | undefined;
    
    if (hasPackageJson) {
      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(this.currentDir, 'package.json'), 'utf8'));
        if (pkg.dependencies?.react || pkg.devDependencies?.react) projectType = 'React';
        else if (pkg.dependencies?.vue || pkg.devDependencies?.vue) projectType = 'Vue';
        else if (pkg.dependencies?.angular || pkg.devDependencies?.angular) projectType = 'Angular';
        else if (pkg.dependencies?.express) projectType = 'Express';
        else if (pkg.dependencies?.next) projectType = 'Next.js';
        else projectType = 'Node.js';
      } catch {}
    }
    
    return {
      isProject: hasPackageJson || hasGit,
      projectType,
      hasPackageJson,
      hasGit,
      files: files.slice(0, 10) // Primeiros 10 arquivos
    };
  }

  formatStatus(): string {
    const relative = this.getRelativeToProject();
    const context = this.analyzeContext();
    
    let status = chalk.cyan(`📁 Diretório atual: ${this.currentDir}\n`);
    
    if (context.isProject) {
      status += chalk.green(`✅ Projeto ${context.projectType || 'detectado'}\n`);
    }
    
    if (relative && relative !== '.') {
      status += chalk.gray(`📍 Relativo ao projeto: ${relative}\n`);
    }
    
    if (this.history.length > 1) {
      status += chalk.gray(`🕐 Histórico: ${this.history.length} diretórios visitados`);
    }
    
    return status;
  }
}
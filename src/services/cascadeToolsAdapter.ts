import { ToolsManager } from './toolsManager';
import { CascadeAgent } from './cascadeAgent';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ToolExecutionContext {
  agentId: string;
  agentLevel: number;
  toolName: string;
  parameters: any;
  permission: 'allow_once' | 'allow_always' | 'deny';
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  metadata?: any;
}

export class CascadeToolsAdapter {
  private toolsManager: ToolsManager;
  private permissionCache: Map<string, string> = new Map();
  private executionLog: ToolExecutionContext[] = [];
  
  constructor(toolsManager: ToolsManager) {
    this.toolsManager = toolsManager;
  }
  
  public async executeTool(
    agent: CascadeAgent,
    toolName: string,
    parameters: any
  ): Promise<ToolResult> {
    const startTime = Date.now();
    
    // Verifica se a ferramenta está disponível para o agente
    const agentConfig = agent.getConfig();
    if (!agentConfig.tools.includes(toolName)) {
      return {
        success: false,
        error: `Ferramenta ${toolName} não disponível para ${agentConfig.name}`,
        executionTime: Date.now() - startTime
      };
    }
    
    // Solicita permissão se necessário
    const permission = await this.getToolPermission(agent, toolName);
    
    if (permission === 'deny') {
      return {
        success: false,
        error: `Permissão negada para ferramenta ${toolName}`,
        executionTime: Date.now() - startTime
      };
    }
    
    // Registra contexto de execução
    const context: ToolExecutionContext = {
      agentId: agentConfig.id,
      agentLevel: agentConfig.level,
      toolName,
      parameters,
      permission
    };
    
    this.executionLog.push(context);
    
    try {
      // Executa a ferramenta baseada no tipo
      let result: any;
      
      switch (toolName) {
        case 'file_write':
          result = await this.executeFileWrite(parameters);
          break;
          
        case 'file_read':
          result = await this.executeFileRead(parameters);
          break;
          
        case 'file_replace':
          result = await this.executeFileReplace(parameters);
          break;
          
        case 'shell':
          result = await this.executeShell(parameters);
          break;
          
        case 'analyze_context':
          result = await this.executeAnalyzeContext(parameters);
          break;
          
        case 'navigate':
          result = await this.executeNavigate(parameters);
          break;
          
        case 'append_content':
          result = await this.executeAppendContent(parameters);
          break;
          
        case 'find_problem_solution':
          result = await this.executeFindProblemSolution(parameters);
          break;
          
        case 'secondary_context':
          result = await this.executeSecondaryContext(parameters);
          break;
          
        case 'secondary_context_read':
          result = await this.executeSecondaryContextRead(parameters);
          break;
          
        default:
          // Tenta executar através do toolsManager original
          result = await this.toolsManager.executeTool(toolName, parameters);
      }
      
      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        metadata: {
          agent: agentConfig.name,
          level: agentConfig.level,
          timestamp: new Date().toISOString()
        }
      };
      
    } catch (error) {
      console.log(chalk.red(`❌ Erro ao executar ferramenta ${toolName}: ${error}`));
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime
      };
    }
  }
  
  private async getToolPermission(
    agent: CascadeAgent,
    toolName: string
  ): Promise<'allow_once' | 'allow_always' | 'deny'> {
    const cacheKey = `${agent.getConfig().id}-${toolName}`;
    
    // Verifica cache de permissões "sempre permitir"
    if (this.permissionCache.has(cacheKey)) {
      const cached = this.permissionCache.get(cacheKey);
      if (cached === 'allow_always') {
        return 'allow_always';
      }
    }
    
    // Solicita permissão ao agente
    const permission = await agent.requestToolPermission(toolName);
    
    if (permission.permission === 'allow_always') {
      this.permissionCache.set(cacheKey, 'allow_always');
    }
    
    return permission.permission as 'allow_once' | 'allow_always' | 'deny';
  }
  
  private async executeFileWrite(params: any): Promise<any> {
    const { filePath, content } = params;
    
    if (!filePath || content === undefined) {
      throw new Error('Parâmetros inválidos para file_write');
    }
    
    const fullPath = path.resolve(filePath);
    const dir = path.dirname(fullPath);
    
    // Cria diretório se não existir
    await fs.promises.mkdir(dir, { recursive: true });
    
    // Escreve arquivo
    await fs.promises.writeFile(fullPath, content, 'utf-8');
    
    console.log(chalk.green(`✅ Arquivo criado: ${fullPath}`));
    
    return {
      filePath: fullPath,
      size: Buffer.byteLength(content, 'utf-8'),
      created: true
    };
  }
  
  private async executeFileRead(params: any): Promise<any> {
    const { filePath } = params;
    
    if (!filePath) {
      throw new Error('Parâmetro filePath é obrigatório');
    }
    
    const fullPath = path.resolve(filePath);
    
    // Verifica se arquivo existe
    const exists = await fs.promises.access(fullPath)
      .then(() => true)
      .catch(() => false);
    
    if (!exists) {
      throw new Error(`Arquivo não encontrado: ${fullPath}`);
    }
    
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    
    return {
      filePath: fullPath,
      content,
      size: Buffer.byteLength(content, 'utf-8')
    };
  }
  
  private async executeFileReplace(params: any): Promise<any> {
    const { filePath, search, replace } = params;
    
    if (!filePath || !search || replace === undefined) {
      throw new Error('Parâmetros inválidos para file_replace');
    }
    
    const fullPath = path.resolve(filePath);
    
    // Lê arquivo atual
    const content = await fs.promises.readFile(fullPath, 'utf-8');
    
    // Realiza substituição
    const newContent = content.replace(new RegExp(search, 'g'), replace);
    
    // Salva arquivo modificado
    await fs.promises.writeFile(fullPath, newContent, 'utf-8');
    
    const replacements = (content.match(new RegExp(search, 'g')) || []).length;
    
    console.log(chalk.green(`✅ ${replacements} substituições em ${fullPath}`));
    
    return {
      filePath: fullPath,
      replacements,
      modified: replacements > 0
    };
  }
  
  private async executeShell(params: any): Promise<any> {
    const { command, cwd } = params;
    
    if (!command) {
      throw new Error('Comando é obrigatório');
    }
    
    console.log(chalk.gray(`  🖥️ Executando: ${command}`));
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: cwd || process.cwd(),
        timeout: 30000 // 30 segundos timeout
      });
      
      return {
        command,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        success: true
      };
    } catch (error: any) {
      return {
        command,
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || error.message,
        success: false,
        exitCode: error.code
      };
    }
  }
  
  private async executeAnalyzeContext(params: any): Promise<any> {
    const { context, query } = params;
    
    // Análise simplificada de contexto
    const analysis: {
      contextLength: number;
      query: any;
      findings: string[];
      suggestions: string[];
    } = {
      contextLength: context?.length || 0,
      query,
      findings: [],
      suggestions: []
    };
    
    if (context && query) {
      // Busca por palavras-chave no contexto
      const keywords = query.toLowerCase().split(' ');
      const contextLower = context.toLowerCase();
      
      keywords.forEach((keyword: string) => {
        if (contextLower.includes(keyword)) {
          analysis.findings.push(`Encontrado: ${keyword}`);
        }
      });
      
      // Gera sugestões baseadas no contexto
      if (context.includes('error')) {
        analysis.suggestions.push('Verificar tratamento de erros');
      }
      if (context.includes('async')) {
        analysis.suggestions.push('Considerar operações assíncronas');
      }
      if (context.includes('test')) {
        analysis.suggestions.push('Adicionar testes unitários');
      }
    }
    
    return analysis;
  }
  
  private async executeNavigate(params: any): Promise<any> {
    const { path: navPath } = params;
    
    if (!navPath) {
      throw new Error('Path é obrigatório para navegação');
    }
    
    const fullPath = path.resolve(navPath);
    
    // Verifica se é diretório ou arquivo
    const stats = await fs.promises.stat(fullPath);
    
    if (stats.isDirectory()) {
      // Lista conteúdo do diretório
      const files = await fs.promises.readdir(fullPath);
      
      return {
        type: 'directory',
        path: fullPath,
        contents: files,
        count: files.length
      };
    } else {
      // Retorna informações do arquivo
      return {
        type: 'file',
        path: fullPath,
        size: stats.size,
        modified: stats.mtime
      };
    }
  }
  
  private async executeAppendContent(params: any): Promise<any> {
    const { filePath, content } = params;
    
    if (!filePath || content === undefined) {
      throw new Error('Parâmetros inválidos para append_content');
    }
    
    const fullPath = path.resolve(filePath);
    
    // Adiciona conteúdo ao final do arquivo
    await fs.promises.appendFile(fullPath, content, 'utf-8');
    
    console.log(chalk.green(`✅ Conteúdo adicionado a ${fullPath}`));
    
    return {
      filePath: fullPath,
      appended: true,
      bytesAdded: Buffer.byteLength(content, 'utf-8')
    };
  }
  
  private async executeFindProblemSolution(params: any): Promise<any> {
    const { problem, context } = params;
    
    // Análise simplificada de problemas
    const solutions = [];
    
    if (problem) {
      const problemLower = problem.toLowerCase();
      
      if (problemLower.includes('error')) {
        solutions.push({
          type: 'error_handling',
          suggestion: 'Adicionar try-catch blocks',
          priority: 'high'
        });
      }
      
      if (problemLower.includes('performance')) {
        solutions.push({
          type: 'optimization',
          suggestion: 'Implementar cache ou otimizar algoritmos',
          priority: 'medium'
        });
      }
      
      if (problemLower.includes('memory')) {
        solutions.push({
          type: 'memory_management',
          suggestion: 'Verificar vazamentos de memória',
          priority: 'high'
        });
      }
      
      if (problemLower.includes('async') || problemLower.includes('promise')) {
        solutions.push({
          type: 'async_handling',
          suggestion: 'Usar async/await corretamente',
          priority: 'medium'
        });
      }
    }
    
    return {
      problem,
      solutions,
      totalSolutions: solutions.length,
      analyzed: true
    };
  }
  
  private async executeSecondaryContext(params: any): Promise<any> {
    const { key, value } = params;
    
    if (!key) {
      throw new Error('Key é obrigatório para secondary_context');
    }
    
    // Armazena contexto secundário em memória (simplificado)
    const contextFile = path.join('.flui', 'secondary_context.json');
    
    let contexts: Record<string, any> = {};
    
    try {
      const existing = await fs.promises.readFile(contextFile, 'utf-8');
      contexts = JSON.parse(existing);
    } catch (error) {
      // Arquivo não existe ainda
    }
    
    contexts[key] = {
      value,
      timestamp: new Date().toISOString()
    };
    
    // Garante que o diretório existe
    await fs.promises.mkdir('.flui', { recursive: true });
    
    // Salva contextos
    await fs.promises.writeFile(
      contextFile,
      JSON.stringify(contexts, null, 2),
      'utf-8'
    );
    
    return {
      key,
      stored: true,
      timestamp: contexts[key]?.timestamp
    };
  }
  
  private async executeSecondaryContextRead(params: any): Promise<any> {
    const { key } = params;
    
    const contextFile = path.join('.flui', 'secondary_context.json');
    
    try {
      const content = await fs.promises.readFile(contextFile, 'utf-8');
      const contexts = JSON.parse(content);
      
      if (key) {
        return contexts[key] || null;
      }
      
      return contexts;
    } catch (error) {
      return key ? null : {};
    }
  }
  
  public getExecutionLog(): ToolExecutionContext[] {
    return this.executionLog;
  }
  
  public clearPermissionCache(): void {
    this.permissionCache.clear();
  }
  
  public getPermissionCache(): Map<string, string> {
    return this.permissionCache;
  }
}
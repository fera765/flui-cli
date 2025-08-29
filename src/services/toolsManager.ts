import { MemoryManager } from './memoryManager';
import { ApiService } from './apiService';
import * as child_process from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

const exec = promisify(child_process.exec);

export type ToolStatus = 'idle' | 'running' | 'success' | 'error';

export interface ToolExecutionResult {
  toolName: string;
  status: 'success' | 'error';
  output?: any;
  error?: string;
  logs?: string;
  displayLogs?: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ToolState {
  status: ToolStatus;
  currentExecution?: string;
}

export class ToolsManager {
  private memoryManager: MemoryManager;
  private apiService?: ApiService;
  private openAIService?: any; // Para uso futuro
  private navigationManager?: any; // Para uso futuro
  private errorHandler?: any; // Para uso futuro
  private executionHistory: ToolExecutionResult[] = [];
  private toolStates: Map<string, ToolState> = new Map();
  private workingDirectory: string;
  private readonly maxHistorySize = 50;
  private readonly maxDisplayLines = 10;

  constructor(
    memoryManager: MemoryManager,
    apiServiceOrOpenAI?: ApiService | any,
    navigationManager?: any,
    errorHandler?: any
  ) {
    this.memoryManager = memoryManager;
    
    // Detectar se é ApiService ou OpenAIService
    if (apiServiceOrOpenAI && 'sendMessage' in apiServiceOrOpenAI) {
      this.apiService = apiServiceOrOpenAI as ApiService;
    } else {
      this.openAIService = apiServiceOrOpenAI;
    }
    
    this.navigationManager = navigationManager;
    this.errorHandler = errorHandler;
    this.workingDirectory = process.cwd();
    this.initializeToolStates();
  }

  private initializeToolStates(): void {
    const tools = ['agent', 'shell', 'file_read', 'file_write', 'file_replace', 'find_problem_solution', 'secondary_context', 'secondary_context_read', 'navigate', 'append_content', 'analyze_context'];
    tools.forEach(tool => {
      this.toolStates.set(tool, { status: 'idle' });
    });
  }
  
  // Método principal para executar qualquer ferramenta
  async executeTool(toolName: string, params: any): Promise<any> {
    switch (toolName) {
      case 'agent':
        return await this.executeAgent(params.messages || [], params.allowDelegation);
      case 'shell':
        return await this.executeShell(params.command);
      case 'file_read':
        return await this.fileRead(params.path);
      case 'file_write':
        return await this.executeFileWrite(params.filename, params.content);
      case 'file_replace':
        return await this.fileReplace(params.path, params.oldText, params.newText);
      case 'find_problem_solution':
        return await this.findProblemSolution(params.error);
      case 'secondary_context':
        return await this.secondaryContext({ name: params.name, content: params.content });
      case 'secondary_context_read':
        return await this.secondaryContextRead(params.name);
      case 'navigate':
        return await this.executeNavigate(params.path, params.create);
      case 'append_content':
        return await this.executeAppendContent(params.path, params.content, params.separator);
      case 'analyze_context':
        return await this.executeAnalyzeContext();
      default:
        throw new Error(`Tool ${toolName} not found`);
    }
  }

  // Agent Tool
  async executeAgent(messages: AgentMessage[], allowDelegation = true): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.setToolStatus('agent', 'running');

    try {
      // Convert messages to format expected by API
      const formattedMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content
      }));

      // Send to LLM
      if (!this.apiService) {
        throw new Error('ApiService not available');
      }
      let response = await this.apiService.sendMessage(
        messages[messages.length - 1].content,
        'mistral-large',
        formattedMessages.slice(0, -1)
      );

      // Validate response
      if (!response || response.trim() === '') {
        // Retry with validation prompt
        const validationPrompt = 'Please provide a complete and detailed response.';
        if (this.apiService) {
          response = await this.apiService.sendMessage(
            validationPrompt,
            'mistral-large',
            formattedMessages
          );
        }
      }

      // Check for delegation
      const delegations: any[] = [];
      if (allowDelegation && response.includes('DELEGATE:agent')) {
        const delegateMatch = response.match(/DELEGATE:agent\((.*?)\)/s);
        if (delegateMatch) {
          try {
            const delegatedMessages = JSON.parse(delegateMatch[1]);
            const delegationResult = await this.executeAgent(delegatedMessages, true);
            delegations.push(delegationResult);
            
            // Get final response incorporating delegation result
            const finalMessages = [
              ...formattedMessages,
              { role: 'assistant' as const, content: response },
              { role: 'system' as const, content: `Delegation result: ${delegationResult.output}` },
              { role: 'user' as const, content: 'Based on the delegation result, provide the final response.' }
            ];
            
            if (this.apiService) {
              response = await this.apiService.sendMessage(
                finalMessages[finalMessages.length - 1].content,
                'mistral-large',
                finalMessages.slice(0, -1)
              );
            }
          } catch (e) {
            // Delegation parsing failed, continue with original response
          }
        }
      }

      // Store in memory
      this.memoryManager.addPrimaryMessage({
        role: 'assistant',
        content: response
      });

      const result: ToolExecutionResult = {
        toolName: 'agent',
        status: 'success',
        output: response,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        metadata: delegations.length > 0 ? { delegations } : undefined
      };

      this.addToHistory(result);
      this.setToolStatus('agent', 'success');
      return result;

    } catch (error) {
      this.setToolStatus('agent', 'error');
      const result: ToolExecutionResult = {
        toolName: 'agent',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      this.addToHistory(result);
      return result;
    } finally {
      setTimeout(() => this.setToolStatus('agent', 'idle'), 100);
    }
  }

  // Shell Tool
  async executeShell(command: string): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.setToolStatus('shell', 'running');

    try {
      // Security checks
      if (this.isUnsafeCommand(command)) {
        throw new Error('Command blocked: unsafe operation detected');
      }

      // Execute command
      const { stdout, stderr } = await exec(command, {
        cwd: this.workingDirectory,
        timeout: 30000 // 30 second timeout
      });

      const output = stdout || stderr;
      
      // Store full log in secondary memory
      this.memoryManager.createSecondaryContext(`tool:shell:latest`, output);
      
      // Truncate for display
      const displayLogs = this.truncateLogForDisplay(output);

      const result: ToolExecutionResult = {
        toolName: 'shell',
        status: 'success',
        output: stdout,
        logs: output,
        displayLogs,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      this.addToHistory(result);
      this.setToolStatus('shell', 'success');
      return result;

    } catch (error) {
      this.setToolStatus('shell', 'error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const stderr = (error as any).stderr || '';
      
      const result: ToolExecutionResult = {
        toolName: 'shell',
        status: 'error',
        error: errorMessage,
        logs: stderr,
        displayLogs: this.truncateLogForDisplay(stderr),
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.addToHistory(result);
      return result;
    } finally {
      setTimeout(() => this.setToolStatus('shell', 'idle'), 100);
    }
  }

  private isUnsafeCommand(command: string): boolean {
    const dangerousPatterns = [
      /sudo/i,
      /rm\s+-rf\s+\//,
      /chmod\s+777/,
      /\/etc/,
      /\/usr/,
      /\/bin/,
      /\/sbin/,
      /\/root/,
      /\/sys/,
      /\/proc/,
      /passwd/,
      /shadow/
    ];

    return dangerousPatterns.some(pattern => pattern.test(command));
  }

  // File Tools
  async fileRead(filepath: string): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.setToolStatus('file_read', 'running');

    try {
      const fullPath = path.resolve(this.workingDirectory, filepath);
      
      // Security check
      if (!fullPath.startsWith(this.workingDirectory)) {
        throw new Error('Access denied: file outside working directory');
      }

      const content = await fs.readFile(fullPath, 'utf8');
      
      // Store in secondary memory
      this.memoryManager.createSecondaryContext(`file:${filepath}`, content);

      const result: ToolExecutionResult = {
        toolName: 'file_read',
        status: 'success',
        output: content,
        displayLogs: this.truncateLogForDisplay(content),
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      this.addToHistory(result);
      this.setToolStatus('file_read', 'success');
      return result;

    } catch (error) {
      this.setToolStatus('file_read', 'error');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const result: ToolExecutionResult = {
        toolName: 'file_read',
        status: 'error',
        error: errorMessage.includes('ENOENT') ? 'File not found' : errorMessage,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.addToHistory(result);
      return result;
    } finally {
      setTimeout(() => this.setToolStatus('file_read', 'idle'), 100);
    }
  }

  async fileReplace(filepath: string, search: string, replace: string): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.setToolStatus('file_replace', 'running');

    try {
      const fullPath = path.resolve(this.workingDirectory, filepath);
      
      // Security check
      if (!fullPath.startsWith(this.workingDirectory)) {
        throw new Error('Access denied: file outside working directory');
      }

      const content = await fs.readFile(fullPath, 'utf8');
      const newContent = content.replace(search, replace);
      
      await fs.writeFile(fullPath, newContent, 'utf8');

      const result: ToolExecutionResult = {
        toolName: 'file_replace',
        status: 'success',
        output: `Replaced "${search}" with "${replace}" in ${filepath}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      this.addToHistory(result);
      this.setToolStatus('file_replace', 'success');
      return result;

    } catch (error) {
      this.setToolStatus('file_replace', 'error');
      const result: ToolExecutionResult = {
        toolName: 'file_replace',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.addToHistory(result);
      return result;
    } finally {
      setTimeout(() => this.setToolStatus('file_replace', 'idle'), 100);
    }
  }

  // Problem Solution Tool
  async findProblemSolution(errorLog: string): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.setToolStatus('find_problem_solution', 'running');

    try {
      let processedLog = errorLog;
      let compressed = false;

      // Compress if log is too large
      if (errorLog.length > 5000) {
        // Take first and last parts of the error
        const lines = errorLog.split('\n');
        const relevantLines = [
          ...lines.slice(0, 20),
          '... [truncated] ...',
          ...lines.slice(-20)
        ];
        processedLog = relevantLines.join('\n');
        compressed = true;
      }

      const prompt = `Please analyze this error and provide a clear solution:\n\n${processedLog}`;
      
      if (!this.apiService) {
        throw new Error('ApiService not available');
      }
      
      const response = await this.apiService.sendMessage(
        prompt,
        'mistral-large',
        [{ role: 'system', content: 'You are an expert debugger. Analyze errors and provide clear, actionable solutions.' }]
      );

      const result: ToolExecutionResult = {
        toolName: 'find_problem_solution',
        status: 'success',
        output: response,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        metadata: { compressed }
      };

      this.addToHistory(result);
      this.setToolStatus('find_problem_solution', 'success');
      return result;

    } catch (error) {
      this.setToolStatus('find_problem_solution', 'error');
      const result: ToolExecutionResult = {
        toolName: 'find_problem_solution',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.addToHistory(result);
      return result;
    } finally {
      setTimeout(() => this.setToolStatus('find_problem_solution', 'idle'), 100);
    }
  }

  // Secondary Context Tools
  async secondaryContext(params: { name: string; content: string; append?: boolean }): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.setToolStatus('secondary_context', 'running');

    try {
      if (params.append) {
        this.memoryManager.appendToSecondaryContext(params.name, '\n' + params.content);
      } else {
        this.memoryManager.createSecondaryContext(params.name, params.content);
      }

      const result: ToolExecutionResult = {
        toolName: 'secondary_context',
        status: 'success',
        output: `Context "${params.name}" ${params.append ? 'updated' : 'created'}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      this.addToHistory(result);
      this.setToolStatus('secondary_context', 'success');
      return result;

    } catch (error) {
      this.setToolStatus('secondary_context', 'error');
      const result: ToolExecutionResult = {
        toolName: 'secondary_context',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.addToHistory(result);
      return result;
    } finally {
      setTimeout(() => this.setToolStatus('secondary_context', 'idle'), 100);
    }
  }

  async secondaryContextRead(name: string): Promise<ToolExecutionResult> {
    const startTime = Date.now();

    try {
      const content = this.memoryManager.getSecondaryContext(name);
      
      if (!content) {
        throw new Error(`Context not found: ${name}`);
      }

      // Format as LLM messages
      const messages: AgentMessage[] = [
        { role: 'system', content }
      ];

      const result: ToolExecutionResult = {
        toolName: 'secondary_context_read',
        status: 'success',
        output: messages,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };

      this.addToHistory(result);
      return result;

    } catch (error) {
      const result: ToolExecutionResult = {
        toolName: 'secondary_context_read',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.addToHistory(result);
      return result;
    }
  }

  // Utility Methods
  truncateLogForDisplay(log: string): string {
    const lines = log.split('\n');
    
    if (lines.length <= this.maxDisplayLines) {
      return log;
    }

    const hiddenLines = lines.length - this.maxDisplayLines;
    const displayLines = lines.slice(-this.maxDisplayLines);
    
    return `+${hiddenLines} lines\n${displayLines.join('\n')}`;
  }

  private setToolStatus(toolName: string, status: ToolStatus): void {
    const state = this.toolStates.get(toolName);
    if (state) {
      state.status = status;
    }
  }

  getToolStatus(toolName: string): ToolStatus {
    return this.toolStates.get(toolName)?.status || 'idle';
  }

  private addToHistory(result: ToolExecutionResult): void {
    this.executionHistory.push(result);
    
    // Limit history size
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }

    // Store in primary memory
    this.memoryManager.addToPrimary({
      id: `tool-${Date.now()}`,
      timestamp: result.timestamp,
      type: 'tool_execution',
      content: JSON.stringify(result),
      metadata: result
    });
  }

  getExecutionHistory(): ToolExecutionResult[] {
    return [...this.executionHistory];
  }

  clearHistory(): void {
    this.executionHistory = [];
  }
  
  getAvailableTools(): string[] {
    return ['file_write', 'file_read', 'shell', 'file_replace', 'find_problem_solution'];
  }
  
  // Novos métodos para ferramentas adicionais
  async executeFileWrite(filename: string, content: string): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.setToolStatus('file_write', 'running');
    
    try {
      const fullPath = path.isAbsolute(filename) ? filename : path.join(this.workingDirectory, filename);
      
      // Criar diretório se necessário
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      
      // Escrever arquivo
      await fs.writeFile(fullPath, content, 'utf8');
      
      const result: ToolExecutionResult = {
        toolName: 'file_write',
        status: 'success',
        output: { path: fullPath, size: content.length },
        logs: `File written: ${fullPath} (${content.length} bytes)`,
        displayLogs: `File written: ${filename}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.setToolStatus('file_write', 'success');
      this.addToHistory(result);
      return result;
    } catch (error: any) {
      const result: ToolExecutionResult = {
        toolName: 'file_write',
        status: 'error',
        error: error.message,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.setToolStatus('file_write', 'error');
      this.addToHistory(result);
      return result;
    }
  }
  
  async executeNavigate(targetPath: string, create = false): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.setToolStatus('navigate', 'running');
    
    try {
      const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.workingDirectory, targetPath);
      
      if (create) {
        await fs.mkdir(fullPath, { recursive: true });
      }
      
      // Verificar se existe
      const stats = await fs.stat(fullPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }
      
      // Atualizar diretório de trabalho
      this.workingDirectory = fullPath;
      
      const result: ToolExecutionResult = {
        toolName: 'navigate',
        status: 'success',
        output: { path: fullPath, created: create },
        logs: `Navigated to: ${fullPath}`,
        displayLogs: `Navigated to: ${targetPath}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.setToolStatus('navigate', 'success');
      this.addToHistory(result);
      return result;
    } catch (error: any) {
      const result: ToolExecutionResult = {
        toolName: 'navigate',
        status: 'error',
        error: error.message,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.setToolStatus('navigate', 'error');
      this.addToHistory(result);
      return result;
    }
  }
  
  async executeAppendContent(filePath: string, content: string, separator = '\n'): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.setToolStatus('append_content', 'running');
    
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workingDirectory, filePath);
      
      // Verificar se arquivo existe
      let exists = true;
      try {
        await fs.access(fullPath);
      } catch {
        exists = false;
        // Criar diretório se necessário
        const dir = path.dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
      }
      
      // Adicionar conteúdo
      if (exists) {
        await fs.appendFile(fullPath, separator + content, 'utf8');
      } else {
        await fs.writeFile(fullPath, content, 'utf8');
      }
      
      const result: ToolExecutionResult = {
        toolName: 'append_content',
        status: 'success',
        output: { path: fullPath, appended: content.length, existed: exists },
        logs: `Content appended to: ${fullPath}`,
        displayLogs: `Content appended: ${filePath}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.setToolStatus('append_content', 'success');
      this.addToHistory(result);
      return result;
    } catch (error: any) {
      const result: ToolExecutionResult = {
        toolName: 'append_content',
        status: 'error',
        error: error.message,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.setToolStatus('append_content', 'error');
      this.addToHistory(result);
      return result;
    }
  }
  
  async executeAnalyzeContext(): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    this.setToolStatus('analyze_context', 'running');
    
    try {
      const files = await fs.readdir(this.workingDirectory);
      
      // Analisar tipo de projeto
      let projectType = 'unknown';
      let hasPackageJson = false;
      let hasGit = false;
      
      if (files.includes('package.json')) {
        hasPackageJson = true;
        try {
          const packageContent = await fs.readFile(path.join(this.workingDirectory, 'package.json'), 'utf8');
          const packageJson = JSON.parse(packageContent);
          
          if (packageJson.dependencies?.react) projectType = 'React';
          else if (packageJson.dependencies?.vue) projectType = 'Vue';
          else if (packageJson.dependencies?.angular) projectType = 'Angular';
          else if (packageJson.dependencies?.express) projectType = 'Express';
          else projectType = 'Node.js';
        } catch {
          projectType = 'Node.js';
        }
      }
      
      if (files.includes('.git')) {
        hasGit = true;
      }
      
      const context = {
        currentDirectory: this.workingDirectory,
        isProject: hasPackageJson || hasGit,
        projectType,
        hasPackageJson,
        hasGit,
        files: files.slice(0, 20), // Limitar para não sobrecarregar
        totalFiles: files.length
      };
      
      const result: ToolExecutionResult = {
        toolName: 'analyze_context',
        status: 'success',
        output: context,
        logs: `Context analyzed: ${projectType} project with ${files.length} files`,
        displayLogs: `Context: ${projectType}`,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.setToolStatus('analyze_context', 'success');
      this.addToHistory(result);
      return result;
    } catch (error: any) {
      const result: ToolExecutionResult = {
        toolName: 'analyze_context',
        status: 'error',
        error: error.message,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
      
      this.setToolStatus('analyze_context', 'error');
      this.addToHistory(result);
      return result;
    }
  }
}
import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions';
import { Message } from './apiService';
import { NavigationManager } from './navigationManager';
import { ErrorHandler } from './errorHandler';
import * as fs from 'fs';
import * as path from 'path';

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    };
  };
}

export interface FluiTool {
  name: string;
  description: string;
  execute: (params: any) => Promise<any>;
  schema: ToolDefinition;
}

export class OpenAIService {
  private openai: OpenAI | null = null;
  private tools: Map<string, FluiTool> = new Map();
  private productionEndpoint: string = 'https://api.llm7.io/v1'; // Endpoint de produção sem API key
  private navigationManager: NavigationManager;
  private errorHandler: ErrorHandler;

  constructor(apiKey?: string) {
    this.navigationManager = new NavigationManager();
    this.errorHandler = new ErrorHandler();
    
    // Sempre usa endpoint de produção LLM7 (sem API key)
    this.openai = new OpenAI({
      apiKey: apiKey || 'not-needed', // LLM7 não precisa de API key
      baseURL: this.productionEndpoint,
      defaultHeaders: {
        'Authorization': undefined // Remove o header de autorização pois LLM7 não precisa
      } as any
    });

    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    // Tool: file_write
    this.registerTool({
      name: 'file_write',
      description: 'Create or overwrite a file with specified content',
      schema: {
        type: 'function',
        function: {
          name: 'file_write',
          description: 'Create or overwrite a file with specified content',
          parameters: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'The name of the file to create'
              },
              content: {
                type: 'string',
                description: 'The content to write to the file'
              }
            },
            required: ['filename', 'content']
          }
        }
      },
      execute: async (params) => {
        try {
          let filepath = params.filename;
          
          // Se o caminho contém diretórios, cria eles primeiro
          if (filepath.includes('/')) {
            const parts = filepath.split('/');
            const filename = parts.pop();
            const dirPath = parts.join('/');
            
            // Cria o diretório se não existir
            const fullDirPath = path.isAbsolute(dirPath) 
              ? dirPath 
              : path.join(this.navigationManager.getCurrentDir(), dirPath);
              
            if (!fs.existsSync(fullDirPath)) {
              fs.mkdirSync(fullDirPath, { recursive: true });
              console.log(`📁 Pasta criada: ${fullDirPath}`);
            }
            
            filepath = path.join(fullDirPath, filename || 'index.md');
          } else {
            filepath = path.join(this.navigationManager.getCurrentDir(), filepath);
          }
          
          // Cria o diretório pai se necessário
          const dir = path.dirname(filepath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          // Escreve o arquivo
          fs.writeFileSync(filepath, params.content, 'utf8');
          
          return {
            success: true,
            message: `Arquivo "${params.filename}" criado com sucesso`,
            path: filepath,
            relativePath: path.relative(this.navigationManager.getProjectRoot(), filepath)
          };
        } catch (error: any) {
          // Tenta auto-corrigir
          const fix = await this.errorHandler.analyzeAndFix(error, 'file_write', params);
          
          if (fix.fixed && fix.retryable) {
            // Tenta novamente após correção
            return await this.tools.get('file_write')!.execute(params);
          }
          
          return {
            success: false,
            error: error.message,
            solution: fix.solution
          };
        }
      }
    });

    // Tool: shell
    this.registerTool({
      name: 'shell',
      description: 'Execute a shell command safely',
      schema: {
        type: 'function',
        function: {
          name: 'shell',
          description: 'Execute a shell command safely (restricted commands are blocked)',
          parameters: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                description: 'The shell command to execute'
              }
            },
            required: ['command']
          }
        }
      },
      execute: async (params) => {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        // Security checks
        const blockedCommands = ['sudo', 'rm -rf', 'chmod 777', 'passwd', 'shutdown', 'reboot'];
        if (blockedCommands.some(cmd => params.command.includes(cmd))) {
          throw new Error(`Security: Command "${params.command}" is blocked`);
        }
        
        try {
          const { stdout, stderr } = await execAsync(params.command, {
            timeout: 30000, // 30 seconds timeout
            cwd: process.cwd()
          });
          return {
            success: true,
            stdout: stdout.trim(),
            stderr: stderr.trim()
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            stdout: error.stdout?.trim() || '',
            stderr: error.stderr?.trim() || ''
          };
        }
      }
    });

    // Tool: file_read
    this.registerTool({
      name: 'file_read',
      description: 'Read the contents of a file',
      schema: {
        type: 'function',
        function: {
          name: 'file_read',
          description: 'Read the contents of a file',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'The path to the file to read'
              }
            },
            required: ['path']
          }
        }
      },
      execute: async (params) => {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filepath = path.isAbsolute(params.path) 
          ? params.path 
          : path.join(process.cwd(), params.path);
        
        try {
          const content = await fs.readFile(filepath, 'utf8');
          return {
            success: true,
            content: content,
            path: filepath
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    });

    // Tool: file_replace
    this.registerTool({
      name: 'file_replace',
      description: 'Replace text in a file',
      schema: {
        type: 'function',
        function: {
          name: 'file_replace',
          description: 'Replace text in a file',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'The path to the file'
              },
              search: {
                type: 'string',
                description: 'The text to search for'
              },
              replace: {
                type: 'string',
                description: 'The text to replace with'
              }
            },
            required: ['path', 'search', 'replace']
          }
        }
      },
      execute: async (params) => {
        const fs = await import('fs/promises');
        const path = await import('path');
        const filepath = path.isAbsolute(params.path)
          ? params.path
          : path.join(process.cwd(), params.path);
        
        try {
          let content = await fs.readFile(filepath, 'utf8');
          const occurrences = content.split(params.search).length - 1;
          content = content.replace(new RegExp(params.search, 'g'), params.replace);
          await fs.writeFile(filepath, content, 'utf8');
          
          return {
            success: true,
            message: `Replaced ${occurrences} occurrences in "${params.path}"`,
            occurrences: occurrences
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    });

    // Tool: find_problem_solution
    this.registerTool({
      name: 'find_problem_solution',
      description: 'Analyze an error and provide a solution',
      schema: {
        type: 'function',
        function: {
          name: 'find_problem_solution',
          description: 'Analyze an error message and provide a solution',
          parameters: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: 'The error message to analyze'
              }
            },
            required: ['error']
          }
        }
      },
      execute: async (params) => {
        // Simple error analysis logic
        const errorPatterns = {
          'Cannot find module': 'Try running: npm install',
          'TypeError': 'Check for null/undefined values before accessing properties',
          'SyntaxError': 'Check for missing brackets, quotes, or semicolons',
          'ReferenceError': 'Make sure the variable is declared before use',
          'ENOENT': 'File or directory not found. Check the path',
          'EACCES': 'Permission denied. Check file permissions',
          'ETIMEDOUT': 'Connection timeout. Check network or increase timeout'
        };
        
        let solution = 'Generic solution: Check the error message and stack trace.';
        
        for (const [pattern, fix] of Object.entries(errorPatterns)) {
          if (params.error.includes(pattern)) {
            solution = fix;
            break;
          }
        }
        
        return {
          success: true,
          error: params.error.substring(0, 100),
          solution: solution,
          suggestions: [
            'Check the error stack trace',
            'Verify all dependencies are installed',
            'Review recent code changes'
          ]
        };
      }
    });

    // Tool: navigate
    this.registerTool({
      name: 'navigate',
      description: 'Navigate to a directory',
      schema: {
        type: 'function',
        function: {
          name: 'navigate',
          description: 'Navigate to a directory or create and navigate if it doesnt exist',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'The path to navigate to'
              },
              create: {
                type: 'boolean',
                description: 'Create the directory if it doesnt exist',
                default: false
              }
            },
            required: ['path']
          }
        }
      },
      execute: async (params) => {
        try {
          let result;
          
          if (params.create) {
            result = await this.navigationManager.createAndNavigate(params.path);
          } else {
            result = await this.navigationManager.navigateTo(params.path);
            
            // Se falhou por não existir, pergunta se deve criar
            if (!result.success && result.error?.includes('não existe')) {
              result = await this.navigationManager.createAndNavigate(params.path);
            }
          }
          
          if (result.success) {
            return {
              success: true,
              message: `Navegado para: ${result.path}`,
              currentDir: this.navigationManager.getCurrentDir(),
              status: this.navigationManager.formatStatus()
            };
          } else {
            return {
              success: false,
              error: result.error,
              currentDir: this.navigationManager.getCurrentDir()
            };
          }
        } catch (error: any) {
          return {
            success: false,
            error: error.message
          };
        }
      }
    });

    // Tool: append_content
    this.registerTool({
      name: 'append_content',
      description: 'Append content to an existing file efficiently',
      schema: {
        type: 'function',
        function: {
          name: 'append_content',
          description: 'Append content to a file without loading entire file in memory',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'The path to the file'
              },
              content: {
                type: 'string',
                description: 'The content to append'
              },
              separator: {
                type: 'string',
                description: 'Separator to add before content',
                default: '\n'
              }
            },
            required: ['path', 'content']
          }
        }
      },
      execute: async (params) => {
        try {
          const filepath = path.isAbsolute(params.path)
            ? params.path
            : path.join(this.navigationManager.getCurrentDir(), params.path);
          
          // Verifica se o arquivo existe
          if (!fs.existsSync(filepath)) {
            // Cria o arquivo se não existir
            const dir = path.dirname(filepath);
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filepath, params.content, 'utf8');
            return {
              success: true,
              message: `Arquivo criado: ${params.path}`,
              bytesWritten: Buffer.byteLength(params.content, 'utf8')
            };
          }
          
          // Adiciona conteúdo ao arquivo existente
          const separator = params.separator || '\n';
          fs.appendFileSync(filepath, separator + params.content, 'utf8');
          
          // Obtém tamanho do arquivo
          const stats = fs.statSync(filepath);
          
          return {
            success: true,
            message: `Conteúdo adicionado ao arquivo: ${params.path}`,
            bytesWritten: Buffer.byteLength(params.content, 'utf8'),
            totalFileSize: stats.size
          };
        } catch (error: any) {
          // Tenta auto-corrigir
          const fix = await this.errorHandler.analyzeAndFix(error, 'append_content', params);
          
          if (fix.fixed && fix.retryable) {
            return await this.tools.get('append_content')!.execute(params);
          }
          
          return {
            success: false,
            error: error.message,
            solution: fix.solution
          };
        }
      }
    });

    // Tool: analyze_context  
    this.registerTool({
      name: 'analyze_context',
      description: 'Analyze current directory context',
      schema: {
        type: 'function',
        function: {
          name: 'analyze_context',
          description: 'Analyze the current directory to understand project context',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      },
      execute: async () => {
        const context = this.navigationManager.analyzeContext();
        const currentDir = this.navigationManager.getCurrentDir();
        const projectRoot = this.navigationManager.getProjectRoot();
        
        return {
          success: true,
          currentDirectory: currentDir,
          projectRoot: projectRoot,
          isProject: context.isProject,
          projectType: context.projectType,
          hasPackageJson: context.hasPackageJson,
          hasGit: context.hasGit,
          files: context.files,
          suggestion: context.isProject 
            ? 'Você está em um projeto existente. Cuidado ao criar arquivos não relacionados.'
            : 'Diretório comum. Você pode criar novos projetos aqui.'
        };
      }
    });
  }

  registerTool(tool: FluiTool) {
    this.tools.set(tool.name, tool);
  }

  private getToolsSchema(): ChatCompletionTool[] {
    return Array.from(this.tools.values()).map(tool => tool.schema as ChatCompletionTool);
  }

  async sendMessageWithTools(
    messages: Message[],
    model: string = 'gpt-3.5-turbo'
  ): Promise<{ response: string; toolCalls?: any[] }> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      // Convert messages to OpenAI format
      const openAIMessages: ChatCompletionMessageParam[] = messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));

      // Add system message about tools if not present
      if (!openAIMessages.some(m => m.role === 'system')) {
        openAIMessages.unshift({
          role: 'system',
          content: `You are Flui, an advanced AI assistant with access to various tools.
You can use tools to:
- Create and manage files
- Execute shell commands
- Read and modify files
- Analyze errors and provide solutions

When you need to perform actions, use the appropriate tools.
Always explain what you're doing and provide helpful responses.`
        });
      }

      // Call OpenAI with tools
      const completion = await this.openai.chat.completions.create({
        model: model,
        messages: openAIMessages,
        tools: this.getToolsSchema(),
        tool_choice: 'auto', // Let the model decide when to use tools
        temperature: 0.7,
        max_tokens: 1000
      });

      const message = completion.choices[0].message;
      let finalResponse = message.content || '';
      const executedTools: any[] = [];

      // Handle tool calls if present
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log('\n🛠️ Executando ferramentas...\n');
        
        for (const toolCall of message.tool_calls) {
          // Type guard for function calls
          if (toolCall.type === 'function') {
            const tool = this.tools.get(toolCall.function.name);
            
            if (tool) {
              try {
                const params = JSON.parse(toolCall.function.arguments);
                console.log(`  ⚡ Executando: ${toolCall.function.name}`);
                
                const result = await tool.execute(params);
                executedTools.push({
                  tool: toolCall.function.name,
                  params: params,
                  result: result
                });
                
                if (result.success) {
                  console.log(`  ✅ ${toolCall.function.name} executado com sucesso`);
                } else {
                  console.log(`  ❌ ${toolCall.function.name} falhou: ${result.error}`);
                }
              } catch (error) {
                console.error(`  ❌ Erro ao executar ${toolCall.function.name}:`, error);
                executedTools.push({
                  tool: toolCall.function.name,
                  error: String(error)
                });
              }
            }
          }
        }

        // Get follow-up response with tool results
        if (executedTools.length > 0) {
          const toolResultsMessage = `Ferramentas executadas:\n${executedTools.map(t => 
            `- ${t.tool}: ${t.result?.success ? '✅ Sucesso' : '❌ Falhou'}`
          ).join('\n')}`;
          
          finalResponse = `${finalResponse}\n\n${toolResultsMessage}`;
        }
      }

      return {
        response: finalResponse,
        toolCalls: executedTools
      };
    } catch (error: any) {
      console.error('Erro ao chamar OpenAI:', error);
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.openai) return false;
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      });
      
      return !!response.choices[0].message.content;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export for testing
export default OpenAIService;
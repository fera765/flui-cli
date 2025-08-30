"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolsManager = void 0;
const child_process = __importStar(require("child_process"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const util_1 = require("util");
const exec = (0, util_1.promisify)(child_process.exec);
class ToolsManager {
    constructor(memoryManager, apiServiceOrOpenAI, navigationManager, errorHandler) {
        this.executionHistory = [];
        this.toolStates = new Map();
        this.maxHistorySize = 50;
        this.maxDisplayLines = 10;
        this.memoryManager = memoryManager;
        // Detectar se é ApiService ou OpenAIService
        if (apiServiceOrOpenAI && 'sendMessage' in apiServiceOrOpenAI) {
            this.apiService = apiServiceOrOpenAI;
        }
        else {
            this.openAIService = apiServiceOrOpenAI;
        }
        this.navigationManager = navigationManager;
        this.errorHandler = errorHandler;
        this.workingDirectory = process.cwd();
        this.initializeToolStates();
    }
    initializeToolStates() {
        const tools = ['agent', 'shell', 'file_read', 'file_write', 'file_replace', 'find_problem_solution', 'secondary_context', 'secondary_context_read', 'navigate', 'append_content', 'analyze_context'];
        tools.forEach(tool => {
            this.toolStates.set(tool, { status: 'idle' });
        });
    }
    // Método principal para executar qualquer ferramenta
    async executeTool(toolName, params) {
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
    async executeAgent(messages, allowDelegation = true) {
        const startTime = Date.now();
        this.setToolStatus('agent', 'running');
        try {
            // Convert messages to format expected by API
            const formattedMessages = messages.map(m => ({
                role: m.role,
                content: m.content
            }));
            // Send to LLM
            if (!this.apiService) {
                throw new Error('ApiService not available');
            }
            let response = await this.apiService.sendMessage(messages[messages.length - 1].content, 'mistral-large', formattedMessages.slice(0, -1));
            // Validate response
            if (!response || response.trim() === '') {
                // Retry with validation prompt
                const validationPrompt = 'Please provide a complete and detailed response.';
                if (this.apiService) {
                    response = await this.apiService.sendMessage(validationPrompt, 'mistral-large', formattedMessages);
                }
            }
            // Check for delegation
            const delegations = [];
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
                            { role: 'assistant', content: response },
                            { role: 'system', content: `Delegation result: ${delegationResult.output}` },
                            { role: 'user', content: 'Based on the delegation result, provide the final response.' }
                        ];
                        if (this.apiService) {
                            response = await this.apiService.sendMessage(finalMessages[finalMessages.length - 1].content, 'mistral-large', finalMessages.slice(0, -1));
                        }
                    }
                    catch (e) {
                        // Delegation parsing failed, continue with original response
                    }
                }
            }
            // Store in memory if method exists
            if (typeof this.memoryManager.addPrimaryMessage === 'function') {
                this.memoryManager.addPrimaryMessage({
                    role: 'assistant',
                    content: response
                });
            }
            const result = {
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
        }
        catch (error) {
            this.setToolStatus('agent', 'error');
            const result = {
                toolName: 'agent',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
            this.addToHistory(result);
            return result;
        }
        finally {
            setTimeout(() => this.setToolStatus('agent', 'idle'), 100);
        }
    }
    // Shell Tool
    async executeShell(command) {
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
            const result = {
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
        }
        catch (error) {
            this.setToolStatus('shell', 'error');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const stderr = error.stderr || '';
            const result = {
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
        }
        finally {
            setTimeout(() => this.setToolStatus('shell', 'idle'), 100);
        }
    }
    isUnsafeCommand(command) {
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
    async fileRead(filepath) {
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
            const result = {
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
        }
        catch (error) {
            this.setToolStatus('file_read', 'error');
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const result = {
                toolName: 'file_read',
                status: 'error',
                error: errorMessage.includes('ENOENT') ? 'File not found' : errorMessage,
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
            this.addToHistory(result);
            return result;
        }
        finally {
            setTimeout(() => this.setToolStatus('file_read', 'idle'), 100);
        }
    }
    async fileReplace(filepath, search, replace) {
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
            const result = {
                toolName: 'file_replace',
                status: 'success',
                output: `Replaced "${search}" with "${replace}" in ${filepath}`,
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
            this.addToHistory(result);
            this.setToolStatus('file_replace', 'success');
            return result;
        }
        catch (error) {
            this.setToolStatus('file_replace', 'error');
            const result = {
                toolName: 'file_replace',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
            this.addToHistory(result);
            return result;
        }
        finally {
            setTimeout(() => this.setToolStatus('file_replace', 'idle'), 100);
        }
    }
    // Problem Solution Tool
    async findProblemSolution(errorLog) {
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
            const response = await this.apiService.sendMessage(prompt, 'mistral-large', [{ role: 'system', content: 'You are an expert debugger. Analyze errors and provide clear, actionable solutions.' }]);
            const result = {
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
        }
        catch (error) {
            this.setToolStatus('find_problem_solution', 'error');
            const result = {
                toolName: 'find_problem_solution',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
            this.addToHistory(result);
            return result;
        }
        finally {
            setTimeout(() => this.setToolStatus('find_problem_solution', 'idle'), 100);
        }
    }
    // Secondary Context Tools
    async secondaryContext(params) {
        const startTime = Date.now();
        this.setToolStatus('secondary_context', 'running');
        try {
            if (params.append) {
                this.memoryManager.appendToSecondaryContext(params.name, '\n' + params.content);
            }
            else {
                this.memoryManager.createSecondaryContext(params.name, params.content);
            }
            const result = {
                toolName: 'secondary_context',
                status: 'success',
                output: `Context "${params.name}" ${params.append ? 'updated' : 'created'}`,
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
            this.addToHistory(result);
            this.setToolStatus('secondary_context', 'success');
            return result;
        }
        catch (error) {
            this.setToolStatus('secondary_context', 'error');
            const result = {
                toolName: 'secondary_context',
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
            this.addToHistory(result);
            return result;
        }
        finally {
            setTimeout(() => this.setToolStatus('secondary_context', 'idle'), 100);
        }
    }
    async secondaryContextRead(name) {
        const startTime = Date.now();
        try {
            const content = this.memoryManager.getSecondaryContext(name);
            if (!content) {
                throw new Error(`Context not found: ${name}`);
            }
            // Format as LLM messages
            const messages = [
                { role: 'system', content }
            ];
            const result = {
                toolName: 'secondary_context_read',
                status: 'success',
                output: messages,
                timestamp: new Date(),
                duration: Date.now() - startTime
            };
            this.addToHistory(result);
            return result;
        }
        catch (error) {
            const result = {
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
    truncateLogForDisplay(log) {
        const lines = log.split('\n');
        if (lines.length <= this.maxDisplayLines) {
            return log;
        }
        const hiddenLines = lines.length - this.maxDisplayLines;
        const displayLines = lines.slice(-this.maxDisplayLines);
        return `+${hiddenLines} lines\n${displayLines.join('\n')}`;
    }
    setToolStatus(toolName, status) {
        const state = this.toolStates.get(toolName);
        if (state) {
            state.status = status;
        }
    }
    getToolStatus(toolName) {
        return this.toolStates.get(toolName)?.status || 'idle';
    }
    addToHistory(result) {
        this.executionHistory.push(result);
        // Limit history size
        if (this.executionHistory.length > this.maxHistorySize) {
            this.executionHistory.shift();
        }
        // Store in primary memory if method exists
        if (typeof this.memoryManager.addToPrimary === 'function') {
            this.memoryManager.addToPrimary({
                id: `tool-${Date.now()}`,
                timestamp: result.timestamp,
                type: 'tool_execution',
                content: JSON.stringify(result),
                metadata: result
            });
        }
    }
    getExecutionHistory() {
        return [...this.executionHistory];
    }
    clearHistory() {
        this.executionHistory = [];
    }
    getAvailableTools() {
        return ['file_write', 'file_read', 'shell', 'file_replace', 'find_problem_solution'];
    }
    // Novos métodos para ferramentas adicionais
    async executeFileWrite(filename, content) {
        const startTime = Date.now();
        this.setToolStatus('file_write', 'running');
        try {
            const fullPath = path.isAbsolute(filename) ? filename : path.join(this.workingDirectory, filename);
            // Criar diretório se necessário
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            // Escrever arquivo
            await fs.writeFile(fullPath, content, 'utf8');
            const result = {
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
        }
        catch (error) {
            const result = {
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
    async executeNavigate(targetPath, create = false) {
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
            const result = {
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
        }
        catch (error) {
            const result = {
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
    async executeAppendContent(filePath, content, separator = '\n') {
        const startTime = Date.now();
        this.setToolStatus('append_content', 'running');
        try {
            const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workingDirectory, filePath);
            // Verificar se arquivo existe
            let exists = true;
            try {
                await fs.access(fullPath);
            }
            catch {
                exists = false;
                // Criar diretório se necessário
                const dir = path.dirname(fullPath);
                await fs.mkdir(dir, { recursive: true });
            }
            // Adicionar conteúdo
            if (exists) {
                await fs.appendFile(fullPath, separator + content, 'utf8');
            }
            else {
                await fs.writeFile(fullPath, content, 'utf8');
            }
            const result = {
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
        }
        catch (error) {
            const result = {
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
    async executeAnalyzeContext() {
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
                    if (packageJson.dependencies?.react)
                        projectType = 'React';
                    else if (packageJson.dependencies?.vue)
                        projectType = 'Vue';
                    else if (packageJson.dependencies?.angular)
                        projectType = 'Angular';
                    else if (packageJson.dependencies?.express)
                        projectType = 'Express';
                    else
                        projectType = 'Node.js';
                }
                catch {
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
            const result = {
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
        }
        catch (error) {
            const result = {
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
exports.ToolsManager = ToolsManager;
//# sourceMappingURL=toolsManager.js.map
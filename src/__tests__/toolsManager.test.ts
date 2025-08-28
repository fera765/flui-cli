import { ToolsManager, ToolExecutionResult, ToolStatus } from '../services/toolsManager';
import { MemoryManager } from '../services/memoryManager';
import * as child_process from 'child_process';
import * as fs from 'fs';

jest.mock('child_process');
jest.mock('fs');

describe('ToolsManager', () => {
  let toolsManager: ToolsManager;
  let memoryManager: MemoryManager;
  let mockApiService: any;

  beforeEach(() => {
    memoryManager = new MemoryManager();
    mockApiService = {
      sendMessage: jest.fn().mockResolvedValue('Mock response')
    };
    toolsManager = new ToolsManager(memoryManager, mockApiService);
    jest.clearAllMocks();
  });

  describe('Agent Tool', () => {
    it('should execute agent with proper role and validation', async () => {
      const messages = [
        { role: 'system' as const, content: 'You are a code reviewer' },
        { role: 'user' as const, content: 'Review this code' }
      ];

      mockApiService.sendMessage.mockResolvedValueOnce('Code looks good');

      const result = await toolsManager.executeAgent(messages);

      expect(result.status).toBe('success');
      expect(result.output).toBe('Code looks good');
      expect(result.toolName).toBe('agent');
      expect(mockApiService.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should validate agent response and retry if needed', async () => {
      const messages = [
        { role: 'system' as const, content: 'You are a helper' },
        { role: 'user' as const, content: 'Help me' }
      ];

      mockApiService.sendMessage
        .mockResolvedValueOnce('') // Empty response, should trigger validation
        .mockResolvedValueOnce('Here is the help you need');

      const result = await toolsManager.executeAgent(messages);

      expect(result.status).toBe('success');
      expect(result.output).toBe('Here is the help you need');
      expect(mockApiService.sendMessage).toHaveBeenCalledTimes(2);
    });

    it('should handle agent delegation chain', async () => {
      const messages = [
        { role: 'system' as const, content: 'You can delegate to other agents' },
        { role: 'user' as const, content: 'Complex task' }
      ];

      mockApiService.sendMessage
        .mockResolvedValueOnce('DELEGATE:agent([{"role":"system","content":"Sub task"}])')
        .mockResolvedValueOnce('Sub task completed')
        .mockResolvedValueOnce('Final result based on sub task');

      const result = await toolsManager.executeAgent(messages, true);

      expect(result.status).toBe('success');
      expect(result.metadata?.delegations).toBeDefined();
      expect(mockApiService.sendMessage).toHaveBeenCalledTimes(3);
    });
  });

  describe('Shell Tool', () => {
    it('should execute safe shell commands', async () => {
      const mockExec = (child_process.exec as unknown) as jest.Mock;
      mockExec.mockImplementation((cmd, callback) => {
        callback(null, 'Command output', '');
      });

      const result = await toolsManager.executeShell('ls -la');

      expect(result.status).toBe('success');
      expect(result.output).toBe('Command output');
      expect(result.toolName).toBe('shell');
    });

    it('should block unsafe commands', async () => {
      const dangerousCommands = ['sudo rm -rf /', 'rm -rf /etc', 'chmod 777 /'];

      for (const cmd of dangerousCommands) {
        const result = await toolsManager.executeShell(cmd);
        expect(result.status).toBe('error');
        expect(result.error).toContain('unsafe');
      }
    });

    it('should only execute commands in working directory', async () => {
      const result = await toolsManager.executeShell('cd /etc && cat passwd');
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('unsafe');
    });

    it('should handle shell command errors', async () => {
      const mockExec = (child_process.exec as unknown) as jest.Mock;
      mockExec.mockImplementation((cmd, callback) => {
        callback(new Error('Command failed'), '', 'Error output');
      });

      const result = await toolsManager.executeShell('npm install');

      expect(result.status).toBe('error');
      expect(result.error).toContain('Command failed');
      expect(result.logs).toContain('Error output');
    });
  });

  describe('File Tools', () => {
    it('should read file and store in secondary memory', async () => {
      const mockReadFile = (fs.promises.readFile as unknown) as jest.Mock;
      mockReadFile.mockResolvedValue('File content');

      const result = await toolsManager.fileRead('test.txt');

      expect(result.status).toBe('success');
      expect(result.output).toBe('File content');
      expect(memoryManager.getSecondaryContext('file:test.txt')).toBe('File content');
    });

    it('should replace content in file', async () => {
      const mockReadFile = (fs.promises.readFile as unknown) as jest.Mock;
      const mockWriteFile = (fs.promises.writeFile as unknown) as jest.Mock;
      
      mockReadFile.mockResolvedValue('Hello world');
      mockWriteFile.mockResolvedValue(undefined);

      const result = await toolsManager.fileReplace('test.txt', 'world', 'universe');

      expect(result.status).toBe('success');
      expect(mockWriteFile).toHaveBeenCalledWith('test.txt', 'Hello universe', 'utf8');
    });

    it('should handle file not found errors', async () => {
      const mockReadFile = (fs.promises.readFile as unknown) as jest.Mock;
      mockReadFile.mockRejectedValue(new Error('ENOENT: File not found'));

      const result = await toolsManager.fileRead('nonexistent.txt');

      expect(result.status).toBe('error');
      expect(result.error).toContain('File not found');
    });
  });

  describe('Problem Solution Tool', () => {
    it('should analyze error logs and provide solution', async () => {
      const errorLog = 'TypeError: Cannot read property "x" of undefined';
      
      mockApiService.sendMessage.mockResolvedValue(
        'The error occurs because you\'re trying to access a property on an undefined object. ' +
        'Solution: Add null checking before accessing the property.'
      );

      const result = await toolsManager.findProblemSolution(errorLog);

      expect(result.status).toBe('success');
      expect(result.output).toContain('Solution');
      expect(mockApiService.sendMessage).toHaveBeenCalledWith(
        expect.stringContaining('analyze this error'),
        expect.any(String),
        expect.any(Array),
        expect.any(Object)
      );
    });

    it('should compress large error logs before sending', async () => {
      const largeErrorLog = 'Error: '.repeat(1000);
      
      mockApiService.sendMessage.mockResolvedValue('Solution for the error');

      const result = await toolsManager.findProblemSolution(largeErrorLog);

      expect(result.status).toBe('success');
      expect(result.metadata?.compressed).toBe(true);
    });
  });

  describe('Secondary Context Tools', () => {
    it('should create and read secondary context', async () => {
      const createResult = await toolsManager.secondaryContext({
        name: 'test_context',
        content: 'Test content'
      });

      expect(createResult.status).toBe('success');

      const readResult = await toolsManager.secondaryContextRead('test_context');
      
      expect(readResult.status).toBe('success');
      expect(readResult.output).toEqual([
        { role: 'system', content: 'Test content' }
      ]);
    });

    it('should append to existing secondary context', async () => {
      await toolsManager.secondaryContext({
        name: 'logs',
        content: 'Line 1'
      });

      await toolsManager.secondaryContext({
        name: 'logs',
        content: 'Line 2',
        append: true
      });

      const result = await toolsManager.secondaryContextRead('logs');
      
      expect(result.output).toEqual([
        { role: 'system', content: 'Line 1\nLine 2' }
      ]);
    });

    it('should handle reading non-existent context', async () => {
      const result = await toolsManager.secondaryContextRead('nonexistent');
      
      expect(result.status).toBe('error');
      expect(result.error).toContain('Context not found');
    });
  });

  describe('Tool Execution Tracking', () => {
    it('should track tool execution status', async () => {
      const mockExec = (child_process.exec as unknown) as jest.Mock;
      mockExec.mockImplementation((cmd, callback) => {
        setTimeout(() => callback(null, 'Output', ''), 100);
      });

      const executionPromise = toolsManager.executeShell('echo test');
      
      // Check status while running
      const runningStatus = toolsManager.getToolStatus('shell');
      expect(runningStatus).toBe('running');

      const result = await executionPromise;
      
      // Check status after completion
      const completedStatus = toolsManager.getToolStatus('shell');
      expect(completedStatus).toBe('idle');
    });

    it('should maintain execution history', async () => {
      const mockExec = (child_process.exec as unknown) as jest.Mock;
      mockExec.mockImplementation((cmd, callback) => {
        callback(null, 'Output', '');
      });

      await toolsManager.executeShell('echo 1');
      await toolsManager.executeShell('echo 2');

      const history = toolsManager.getExecutionHistory();
      
      expect(history).toHaveLength(2);
      expect(history[0].toolName).toBe('shell');
      expect(history[1].toolName).toBe('shell');
    });

    it('should limit execution history size', async () => {
      const mockExec = (child_process.exec as unknown) as jest.Mock;
      mockExec.mockImplementation((cmd, callback) => {
        callback(null, 'Output', '');
      });

      // Execute more than the limit (assuming limit is 50)
      for (let i = 0; i < 55; i++) {
        await toolsManager.executeShell(`echo ${i}`);
      }

      const history = toolsManager.getExecutionHistory();
      expect(history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('Log Management', () => {
    it('should truncate logs for display', () => {
      const longLog = Array(100).fill('Log line').join('\n');
      const truncated = toolsManager.truncateLogForDisplay(longLog);
      
      const lines = truncated.split('\n');
      expect(lines.length).toBeLessThanOrEqual(10);
      expect(truncated).toContain('+90 lines');
    });

    it('should store full logs in secondary memory', async () => {
      const mockExec = (child_process.exec as unknown) as jest.Mock;
      const longOutput = Array(100).fill('Output line').join('\n');
      
      mockExec.mockImplementation((cmd, callback) => {
        callback(null, longOutput, '');
      });

      const result = await toolsManager.executeShell('long-command');
      
      expect(result.displayLogs).toBeDefined();
      expect(result.displayLogs!.split('\n').length).toBeLessThanOrEqual(10);
      
      const fullLog = memoryManager.getSecondaryContext('tool:shell:latest');
      expect(fullLog).toBe(longOutput);
    });
  });
});
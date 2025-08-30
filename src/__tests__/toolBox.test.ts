import { ToolBox } from '../ui/toolBox';
import { ThemeManager } from '../ui/themeManager';
import { ToolExecutionResult } from '../services/toolsManager';
import chalk from 'chalk';

describe('ToolBox', () => {
  let toolBox: ToolBox;
  let themeManager: ThemeManager;

  beforeEach(() => {
    themeManager = new ThemeManager();
    toolBox = new ToolBox(themeManager);
  });

  describe('Status Display', () => {
    it('should display running status with loading spinner', () => {
      const display = toolBox.renderStatus('shell', 'running', 'npm install');
      
      expect(display).toContain('⠋'); // Loading spinner character
      expect(display).toContain('Shell');
      expect(display).toContain('npm install');
    });

    it('should display success status with check mark', () => {
      const display = toolBox.renderStatus('shell', 'success', 'npm install');
      
      expect(display).toContain('✅');
      expect(display).toContain('Shell');
      expect(display).toContain('npm install');
    });

    it('should display error status with error mark', () => {
      const display = toolBox.renderStatus('agent', 'error', 'Failed to execute');
      
      expect(display).toContain('❌');
      expect(display).toContain('Agent');
      expect(display).toContain('Failed to execute');
    });

    it('should use theme colors for different statuses', () => {
      themeManager.setTheme('dark');
      
      const runningDisplay = toolBox.renderStatus('shell', 'running', 'command');
      const successDisplay = toolBox.renderStatus('shell', 'success', 'command');
      const errorDisplay = toolBox.renderStatus('shell', 'error', 'command');
      
      // Each should have different color styling
      expect(runningDisplay).not.toEqual(successDisplay);
      expect(successDisplay).not.toEqual(errorDisplay);
    });
  });

  describe('Tool Box Rendering', () => {
    it('should render complete tool box with status and logs', () => {
      const result: ToolExecutionResult = {
        toolName: 'shell',
        status: 'success',
        output: 'Installation complete',
        displayLogs: 'npm notice\nnpm installed 50 packages',
        timestamp: new Date(),
        duration: 1500
      };

      const rendered = toolBox.render(result, 'success');
      
      expect(rendered).toContain('✅');
      expect(rendered).toContain('Shell');
      expect(rendered).toContain('npm notice');
      expect(rendered).toContain('npm installed 50 packages');
    });

    it('should not show log box when no logs available', () => {
      const result: ToolExecutionResult = {
        toolName: 'agent',
        status: 'success',
        output: 'Task completed',
        timestamp: new Date()
      };

      const rendered = toolBox.render(result, 'success');
      
      expect(rendered).toContain('✅');
      expect(rendered).toContain('Agent');
      expect(rendered).not.toContain('├─'); // Log box border
    });

    it('should format tool names correctly', () => {
      const tools = [
        { name: 'shell', expected: 'Shell' },
        { name: 'agent', expected: 'Agent' },
        { name: 'file_read', expected: 'File Read' },
        { name: 'file_replace', expected: 'File Replace' },
        { name: 'find_problem_solution', expected: 'Find Problem Solution' },
        { name: 'secondary_context', expected: 'Secondary Context' }
      ];

      tools.forEach(({ name, expected }) => {
        const formatted = toolBox.formatToolName(name);
        expect(formatted).toBe(expected);
      });
    });
  });

  describe('Log Display', () => {
    it('should show truncated logs with line count', () => {
      const logs = '+50 lines\nLine 1\nLine 2\nLine 3';
      const rendered = toolBox.renderLogBox(logs);
      
      expect(rendered).toContain('+50 lines');
      expect(rendered).toContain('Line 1');
      expect(rendered).toContain('Line 2');
      expect(rendered).toContain('Line 3');
    });

    it('should format log box with proper borders', () => {
      const logs = 'Test log';
      const rendered = toolBox.renderLogBox(logs);
      
      expect(rendered).toContain('┌─'); // Top border
      expect(rendered).toContain('│'); // Side borders
      expect(rendered).toContain('└─'); // Bottom border
    });

    it('should handle multi-line logs correctly', () => {
      const logs = 'Error: Something went wrong\n  at line 42\n  at function test()';
      const rendered = toolBox.renderLogBox(logs);
      
      expect(rendered).toContain('Error: Something went wrong');
      expect(rendered).toContain('at line 42');
      expect(rendered).toContain('at function test()');
    });
  });

  describe('Spinner Animation', () => {
    it('should animate spinner for running tools', () => {
      const frames = toolBox.getSpinnerFrames();
      
      expect(frames).toContain('⠋');
      expect(frames).toContain('⠙');
      expect(frames).toContain('⠹');
      expect(frames).toContain('⠸');
      expect(frames).toContain('⠼');
      expect(frames).toContain('⠴');
      expect(frames).toContain('⠦');
      expect(frames).toContain('⠧');
      expect(frames).toContain('⠇');
      expect(frames).toContain('⠏');
    });

    it('should cycle through spinner frames', () => {
      const frame1 = toolBox.getCurrentSpinnerFrame();
      toolBox.advanceSpinner();
      const frame2 = toolBox.getCurrentSpinnerFrame();
      
      expect(frame1).not.toEqual(frame2);
    });
  });

  describe('Tool Execution Summary', () => {
    it('should format execution duration', () => {
      const result: ToolExecutionResult = {
        toolName: 'shell',
        status: 'success',
        output: 'Done',
        timestamp: new Date(),
        duration: 1234
      };

      const summary = toolBox.getExecutionSummary(result);
      
      expect(summary).toContain('1.23s');
    });

    it('should show command or operation details', () => {
      const result: ToolExecutionResult = {
        toolName: 'shell',
        status: 'success',
        output: 'Done',
        timestamp: new Date(),
        metadata: { command: 'npm test' }
      };

      const rendered = toolBox.render(result, 'success');
      
      expect(rendered).toContain('npm test');
    });
  });

  describe('Theme Integration', () => {
    it('should apply theme colors to all elements', () => {
      themeManager.setTheme('synthwave');
      
      const result: ToolExecutionResult = {
        toolName: 'agent',
        status: 'success',
        output: 'Response',
        displayLogs: 'Processing...',
        timestamp: new Date()
      };

      const rendered = toolBox.render(result, 'success');
      
      // Should contain theme-specific styling
      expect(rendered).toBeDefined();
      expect(rendered.length).toBeGreaterThan(0);
    });

    it('should update colors when theme changes', () => {
      const result: ToolExecutionResult = {
        toolName: 'shell',
        status: 'success',
        output: 'Done',
        timestamp: new Date()
      };

      themeManager.setTheme('dark');
      const darkRendered = toolBox.render(result, 'success');
      
      themeManager.setTheme('light');
      const lightRendered = toolBox.render(result, 'success');
      
      // Different themes should produce different output
      expect(darkRendered).not.toEqual(lightRendered);
    });
  });

  describe('Error Handling', () => {
    it('should display error details in log box', () => {
      const result: ToolExecutionResult = {
        toolName: 'shell',
        status: 'error',
        error: 'Command not found',
        logs: 'bash: unknown-command: command not found',
        displayLogs: 'bash: unknown-command: command not found',
        timestamp: new Date()
      };

      const rendered = toolBox.render(result, 'error');
      
      expect(rendered).toContain('❌');
      expect(rendered).toContain('command not found');
    });

    it('should handle missing or undefined values gracefully', () => {
      const result: ToolExecutionResult = {
        toolName: 'agent',
        status: 'success',
        timestamp: new Date()
      };

      const rendered = toolBox.render(result, 'success');
      
      expect(rendered).toBeDefined();
      expect(rendered).toContain('Agent');
    });
  });
});
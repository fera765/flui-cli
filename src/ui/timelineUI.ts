import chalk from 'chalk';
import boxen from 'boxen';
import { ToolExecution } from '../services/cascadeAgent';
import { SpiralLevel } from '../services/enhancedSpiralOrchestrator';

export interface TimelineEvent {
  timestamp: Date;
  type: 'tool' | 'log' | 'agent' | 'level' | 'score' | 'delegation';
  level?: number;
  agentId?: string;
  agentName?: string;
  content: string;
  details?: any;
  success?: boolean;
  score?: number;
}

export class TimelineUI {
  private events: TimelineEvent[] = [];
  private isRealtime: boolean = false;
  private currentLevel: number = 0;

  constructor(realtime: boolean = false) {
    this.isRealtime = realtime;
  }

  /**
   * Add event to timeline
   */
  addEvent(event: TimelineEvent): void {
    this.events.push(event);
    
    if (this.isRealtime) {
      this.renderEvent(event);
    }
  }

  /**
   * Add tool execution to timeline
   */
  addToolExecution(execution: ToolExecution, level?: number): void {
    const event: TimelineEvent = {
      timestamp: execution.timestamp,
      type: 'tool',
      level: level || this.currentLevel,
      agentId: execution.agentId,
      agentName: execution.agentName,
      content: `Tool: ${execution.toolName}`,
      details: {
        params: execution.params,
        result: execution.result
      },
      success: execution.success
    };

    this.addEvent(event);
  }

  /**
   * Add log message to timeline
   */
  addLog(message: string, level?: number, agentName?: string): void {
    const event: TimelineEvent = {
      timestamp: new Date(),
      type: 'log',
      level: level || this.currentLevel,
      agentName: agentName,
      content: message
    };

    this.addEvent(event);
  }

  /**
   * Add agent delegation to timeline
   */
  addDelegation(fromAgent: string, toAgent: string, task: string, level?: number): void {
    const event: TimelineEvent = {
      timestamp: new Date(),
      type: 'delegation',
      level: level || this.currentLevel,
      agentName: fromAgent,
      content: `Delegating to ${toAgent}`,
      details: { task }
    };

    this.addEvent(event);
  }

  /**
   * Add score update to timeline
   */
  addScoreUpdate(score: number, level?: number, agentName?: string): void {
    const event: TimelineEvent = {
      timestamp: new Date(),
      type: 'score',
      level: level || this.currentLevel,
      agentName: agentName,
      content: `Score: ${score}%`,
      score: score
    };

    this.addEvent(event);
  }

  /**
   * Add level change to timeline
   */
  addLevelChange(level: SpiralLevel): void {
    this.currentLevel = level.number;
    
    const event: TimelineEvent = {
      timestamp: new Date(),
      type: 'level',
      level: level.number,
      content: `Level ${level.number}: ${level.strategy.toUpperCase()}`,
      details: {
        strategy: level.strategy,
        previousScore: level.score
      }
    };

    this.addEvent(event);
  }

  /**
   * Render single event
   */
  private renderEvent(event: TimelineEvent): void {
    const time = event.timestamp.toLocaleTimeString();
    const levelStr = event.level ? `L${event.level}` : '  ';
    
    switch (event.type) {
      case 'tool':
        this.renderToolBox(event, time, levelStr);
        break;
      
      case 'log':
        this.renderLogBox(event, time, levelStr);
        break;
      
      case 'delegation':
        this.renderDelegationBox(event, time, levelStr);
        break;
      
      case 'score':
        this.renderScoreBox(event, time, levelStr);
        break;
      
      case 'level':
        this.renderLevelBox(event, time);
        break;
      
      default:
        this.renderGenericBox(event, time, levelStr);
    }
  }

  /**
   * Render tool execution box
   */
  private renderToolBox(event: TimelineEvent, time: string, level: string): void {
    const icon = event.success ? '✅' : '❌';
    const color = event.success ? 'green' : 'red';
    
    const toolBox = boxen(
      `${icon} ${event.content}\n` +
      chalk.gray(`Agent: ${event.agentName || 'Unknown'}\n`) +
      chalk.gray(`Params: ${JSON.stringify(event.details?.params || {}).substring(0, 50)}...`),
      {
        title: `🔧 TOOL [${time}] ${level}`,
        titleAlignment: 'left',
        padding: { top: 0, right: 1, bottom: 0, left: 1 },
        margin: { top: 0, right: 0, bottom: 0, left: 2 },
        borderColor: color,
        borderStyle: 'round'
      }
    );
    
    console.log(toolBox);
    
    // Show result in log box below
    if (event.details?.result) {
      this.renderResultLog(event.details.result, time, level);
    }
  }

  /**
   * Render log message box
   */
  private renderLogBox(event: TimelineEvent, time: string, level: string): void {
    const logBox = boxen(
      event.content,
      {
        title: `📝 LOG [${time}] ${level}`,
        titleAlignment: 'left',
        padding: { top: 0, right: 1, bottom: 0, left: 1 },
        margin: { top: 0, right: 0, bottom: 0, left: 4 },
        borderColor: 'gray',
        borderStyle: 'single'
      }
    );
    
    console.log(logBox);
  }

  /**
   * Render tool result log
   */
  private renderResultLog(result: any, time: string, level: string): void {
    const resultStr = typeof result === 'string' 
      ? result.substring(0, 100) 
      : JSON.stringify(result).substring(0, 100);
    
    const resultBox = boxen(
      chalk.gray(resultStr + '...'),
      {
        title: `↳ Result`,
        titleAlignment: 'left',
        padding: { top: 0, right: 1, bottom: 0, left: 1 },
        margin: { top: 0, right: 0, bottom: 1, left: 6 },
        borderColor: 'gray',
        borderStyle: 'single'
      }
    );
    
    console.log(resultBox);
  }

  /**
   * Render delegation box
   */
  private renderDelegationBox(event: TimelineEvent, time: string, level: string): void {
    const delegationBox = boxen(
      `${event.content}\n` +
      chalk.gray(`Task: ${event.details?.task || 'Unknown'}`),
      {
        title: `👥 DELEGATION [${time}] ${level}`,
        titleAlignment: 'left',
        padding: { top: 0, right: 1, bottom: 0, left: 1 },
        margin: { top: 0, right: 0, bottom: 0, left: 2 },
        borderColor: 'magenta',
        borderStyle: 'round'
      }
    );
    
    console.log(delegationBox);
  }

  /**
   * Render score update box
   */
  private renderScoreBox(event: TimelineEvent, time: string, level: string): void {
    const score = event.score || 0;
    const color = score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red';
    const progressBar = this.createProgressBar(score);
    
    const scoreBox = boxen(
      `${progressBar} ${event.content}\n` +
      (event.agentName ? chalk.gray(`Agent: ${event.agentName}`) : ''),
      {
        title: `📊 SCORE [${time}] ${level}`,
        titleAlignment: 'left',
        padding: { top: 0, right: 1, bottom: 0, left: 1 },
        margin: { top: 0, right: 0, bottom: 0, left: 2 },
        borderColor: color,
        borderStyle: 'double'
      }
    );
    
    console.log(scoreBox);
  }

  /**
   * Render level change box
   */
  private renderLevelBox(event: TimelineEvent, time: string): void {
    const levelBox = boxen(
      chalk.bold(event.content) + '\n' +
      chalk.gray(`Strategy: ${event.details?.strategy || 'Unknown'}\n`) +
      chalk.gray(`Previous Score: ${event.details?.previousScore || 0}%`),
      {
        title: `🌀 SPIRAL LEVEL [${time}]`,
        titleAlignment: 'center',
        padding: 1,
        margin: { top: 1, right: 0, bottom: 1, left: 0 },
        borderColor: 'cyan',
        borderStyle: 'bold'
      }
    );
    
    console.log(levelBox);
  }

  /**
   * Render generic event box
   */
  private renderGenericBox(event: TimelineEvent, time: string, level: string): void {
    const box = boxen(
      event.content,
      {
        title: `📌 EVENT [${time}] ${level}`,
        titleAlignment: 'left',
        padding: { top: 0, right: 1, bottom: 0, left: 1 },
        margin: { top: 0, right: 0, bottom: 0, left: 2 },
        borderColor: 'white',
        borderStyle: 'single'
      }
    );
    
    console.log(box);
  }

  /**
   * Create progress bar for score
   */
  private createProgressBar(score: number, width: number = 20): string {
    const filled = Math.round((score / 100) * width);
    const empty = width - filled;
    
    const filledChar = score >= 80 ? '█' : score >= 60 ? '▓' : '▒';
    const emptyChar = '░';
    
    const color = score >= 80 ? chalk.green : score >= 60 ? chalk.yellow : chalk.red;
    
    return color(filledChar.repeat(filled)) + chalk.gray(emptyChar.repeat(empty));
  }

  /**
   * Render full timeline
   */
  renderTimeline(): void {
    console.log(chalk.bold.cyan('\n━━━ EXECUTION TIMELINE ━━━\n'));
    
    // Group events by level
    const eventsByLevel = new Map<number, TimelineEvent[]>();
    
    this.events.forEach(event => {
      const level = event.level || 0;
      if (!eventsByLevel.has(level)) {
        eventsByLevel.set(level, []);
      }
      eventsByLevel.get(level)!.push(event);
    });
    
    // Render events by level
    Array.from(eventsByLevel.keys()).sort().forEach(level => {
      if (level > 0) {
        console.log(chalk.bold.cyan(`\n━━━ LEVEL ${level} ━━━\n`));
      }
      
      eventsByLevel.get(level)!.forEach(event => {
        this.renderEvent(event);
      });
    });
    
    console.log(chalk.bold.cyan('\n━━━ END TIMELINE ━━━\n'));
  }

  /**
   * Get timeline summary
   */
  getSummary(): any {
    const toolExecutions = this.events.filter(e => e.type === 'tool');
    const delegations = this.events.filter(e => e.type === 'delegation');
    const scores = this.events.filter(e => e.type === 'score');
    const levels = this.events.filter(e => e.type === 'level');
    
    return {
      totalEvents: this.events.length,
      toolExecutions: {
        total: toolExecutions.length,
        successful: toolExecutions.filter(e => e.success).length,
        failed: toolExecutions.filter(e => !e.success).length
      },
      delegations: delegations.length,
      scoreUpdates: scores.length,
      levels: levels.length,
      finalScore: scores.length > 0 ? scores[scores.length - 1].score : 0,
      timeline: this.events.map(e => ({
        time: e.timestamp.toISOString(),
        type: e.type,
        level: e.level,
        agent: e.agentName,
        content: e.content
      }))
    };
  }

  /**
   * Clear timeline
   */
  clear(): void {
    this.events = [];
    this.currentLevel = 0;
  }

  /**
   * Export timeline to file
   */
  async exportToFile(filepath: string): Promise<void> {
    const fs = await import('fs/promises');
    const summary = this.getSummary();
    
    const content = {
      generated: new Date().toISOString(),
      summary: summary,
      events: this.events
    };
    
    await fs.writeFile(filepath, JSON.stringify(content, null, 2));
    console.log(chalk.green(`✅ Timeline exported to ${filepath}`));
  }
}
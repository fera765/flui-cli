#!/usr/bin/env node

const { EnhancedSpiralOrchestrator } = require('./dist/services/enhancedSpiralOrchestrator');
const { CascadeAgent } = require('./dist/services/cascadeAgent');
const { ToolsManager } = require('./dist/services/toolsManager');
const { MemoryManager } = require('./dist/services/memoryManager');
const { OpenAIService } = require('./dist/services/openAIService');
const { ApiService } = require('./dist/services/apiService');
const { TimelineUI } = require('./dist/ui/timelineUI');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

async function testArticle20k() {
  console.log(chalk.bold.cyan('\n════════════════════════════════════════════════════'));
  console.log(chalk.bold.cyan('     TESTE CRÍTICO: ARTIGO DE 20.000 PALAVRAS'));
  console.log(chalk.bold.cyan('════════════════════════════════════════════════════\n'));
  
  // Initialize services
  const apiService = new ApiService('https://api.llm7.io/v1', '');
  const openAIService = new OpenAIService();
  const memoryManager = new MemoryManager();
  const toolsManager = new ToolsManager(apiService, memoryManager, openAIService);
  const timelineUI = new TimelineUI(true); // Realtime mode to track everything
  
  // Create output directory
  const outputDir = path.join(process.cwd(), 'article-test-' + Date.now());
  await fs.mkdir(outputDir, { recursive: true });
  
  // The request for 20,000 words article
  const request = `
    Crie um artigo completo e profissional de EXATAMENTE 20.000 palavras sobre 
    "O Futuro da Inteligência Artificial: Impactos na Sociedade, Economia e Humanidade".
    
    REQUISITOS OBRIGATÓRIOS:
    1. O artigo DEVE ter EXATAMENTE 20.000 palavras (nem mais, nem menos)
    2. Deve ser dividido em múltiplas seções e subseções bem organizadas
    3. Incluir introdução, desenvolvimento detalhado e conclusão
    4. Usar dados, estatísticas e exemplos concretos
    5. Citar fontes e referências quando apropriado
    6. Manter alta qualidade e coesão em todo o texto
    7. Não usar placeholders ou repetições desnecessárias
    8. Cada seção deve agregar valor real ao conteúdo
    
    O artigo deve cobrir:
    - História e evolução da IA
    - Estado atual da tecnologia
    - Aplicações em diferentes setores
    - Impactos econômicos e sociais
    - Questões éticas e filosóficas
    - Desafios e oportunidades
    - Previsões para o futuro
    - Casos de uso reais e estudos de caso
    - Regulamentação e políticas públicas
    - Impacto no mercado de trabalho
    
    IMPORTANTE: Use delegação em cascata para diferentes especialistas criarem cada seção.
  `;
  
  console.log(chalk.yellow('📝 Solicitação:'));
  console.log(chalk.gray(request.substring(0, 300) + '...'));
  console.log(chalk.yellow('\n🎯 Objetivo: Artigo de EXATAMENTE 20.000 palavras\n'));
  
  const startTime = Date.now();
  
  // Use Enhanced Spiral Orchestrator for complex task
  const orchestrator = new EnhancedSpiralOrchestrator(
    toolsManager,
    memoryManager,
    openAIService
  );
  
  console.log(chalk.cyan('🚀 Iniciando processamento em modo Espiral com Cascata...\n'));
  
  try {
    // Process with maximum capabilities
    const result = await orchestrator.processInSpiral(request, {
      maxLevels: 10,        // Allow up to 10 levels for complex task
      minScore: 85,         // High quality requirement
      enableCascade: true,  // Enable cascade delegation
      maxCascadeDepth: 5,   // Deep delegation allowed
      enableCheckpoints: true,
      trackMetrics: true
    });
    
    const executionTime = Date.now() - startTime;
    
    // Get timeline summary for analysis
    const timelineSummary = timelineUI.getSummary();
    
    console.log(chalk.bold.cyan('\n════════════════════════════════════════════════════'));
    console.log(chalk.bold.cyan('                  ANÁLISE CRÍTICA'));
    console.log(chalk.bold.cyan('════════════════════════════════════════════════════\n'));
    
    // 1. Analyze Spiral Execution
    console.log(chalk.bold.yellow('📊 1. ANÁLISE DA EXECUÇÃO ESPIRAL:\n'));
    console.log(chalk.white(`  • Níveis utilizados: ${result.levels.length}/${10}`));
    console.log(chalk.white(`  • Score final: ${result.finalScore}%`));
    console.log(chalk.white(`  • Progressão de scores: ${result.scoreProgression.join('% → ')}%`));
    console.log(chalk.white(`  • Tempo total: ${(executionTime / 1000).toFixed(2)}s`));
    
    if (result.earlyTermination) {
      console.log(chalk.green(`  • Early termination: ${result.terminationReason}`));
    }
    
    // Crítica do Espiral
    if (result.levels.length < 3) {
      console.log(chalk.red('\n  ❌ PROBLEMA: Poucos níveis espirais utilizados!'));
      console.log(chalk.red('     Esperado: Mínimo 3-5 níveis para tarefa complexa'));
    } else {
      console.log(chalk.green('\n  ✅ Uso adequado de níveis espirais'));
    }
    
    // 2. Analyze Cascade Usage
    console.log(chalk.bold.yellow('\n📊 2. ANÁLISE DA CASCATA DE AGENTES:\n'));
    
    if (result.cascadeChains && result.cascadeChains.length > 0) {
      console.log(chalk.white(`  • Cadeias de cascata: ${result.cascadeChains.length}`));
      console.log(chalk.white(`  • Total de agentes usados: ${result.totalAgentsUsed || 'N/A'}`));
      
      result.cascadeChains.forEach((chain, i) => {
        console.log(chalk.gray(`\n  Cadeia ${i + 1}:`));
        console.log(chalk.gray(`    - Nível: ${chain.level}`));
        console.log(chalk.gray(`    - Agentes: ${chain.agents.length}`));
        console.log(chalk.gray(`    - Profundidade: ${chain.depth}`));
      });
      
      // Crítica da Cascata
      const totalAgents = result.cascadeChains.reduce((sum, c) => sum + c.agents.length, 0);
      if (totalAgents < 5) {
        console.log(chalk.red('\n  ❌ PROBLEMA: Poucos agentes delegados!'));
        console.log(chalk.red('     Esperado: Múltiplos especialistas para artigo de 20k palavras'));
        console.log(chalk.red('     Sugestão: Pesquisador, Escritor, Revisor, Especialista em IA, etc.'));
      } else {
        console.log(chalk.green(`\n  ✅ Boa delegação com ${totalAgents} agentes`));
      }
    } else {
      console.log(chalk.red('  ❌ PROBLEMA GRAVE: Nenhuma cascata de delegação detectada!'));
      console.log(chalk.red('     O sistema deveria delegar para múltiplos especialistas'));
    }
    
    // 3. Analyze Tool Usage
    console.log(chalk.bold.yellow('\n📊 3. ANÁLISE DO USO DE FERRAMENTAS:\n'));
    
    console.log(chalk.white(`  • Total de eventos: ${timelineSummary.totalEvents}`));
    console.log(chalk.white(`  • Execuções de ferramentas: ${timelineSummary.toolExecutions.total}`));
    console.log(chalk.white(`    - Bem-sucedidas: ${timelineSummary.toolExecutions.successful}`));
    console.log(chalk.white(`    - Falhadas: ${timelineSummary.toolExecutions.failed}`));
    
    // Crítica do uso de Tools
    if (timelineSummary.toolExecutions.total === 0) {
      console.log(chalk.red('\n  ❌ PROBLEMA GRAVE: Nenhuma ferramenta foi utilizada!'));
      console.log(chalk.red('     Esperado: file_write para salvar o artigo'));
      console.log(chalk.red('     Esperado: file_read para verificar conteúdo'));
    } else if (timelineSummary.toolExecutions.total < 3) {
      console.log(chalk.yellow('\n  ⚠️ AVISO: Poucas ferramentas utilizadas'));
      console.log(chalk.yellow('     Recomendado: Usar mais tools para melhor resultado'));
    } else {
      console.log(chalk.green('\n  ✅ Bom uso de ferramentas'));
    }
    
    // 4. Analyze the Article Content
    console.log(chalk.bold.yellow('\n📊 4. ANÁLISE DO CONTEÚDO DO ARTIGO:\n'));
    
    // Try to find and read the article
    let articleContent = '';
    let wordCount = 0;
    
    try {
      // Check if article was saved
      const files = await fs.readdir(outputDir);
      const articleFile = files.find(f => f.includes('article') || f.includes('.md') || f.includes('.txt'));
      
      if (articleFile) {
        articleContent = await fs.readFile(path.join(outputDir, articleFile), 'utf8');
        console.log(chalk.green(`  ✅ Artigo encontrado: ${articleFile}`));
      } else {
        // Try to extract from result
        if (result.levels && result.levels.length > 0) {
          const lastLevel = result.levels[result.levels.length - 1];
          articleContent = typeof lastLevel.result === 'string' ? lastLevel.result : JSON.stringify(lastLevel.result);
        }
      }
      
      // Count words
      wordCount = articleContent.split(/\s+/).filter(word => word.length > 0).length;
      
      console.log(chalk.white(`\n  • Palavras contadas: ${wordCount.toLocaleString()}`));
      console.log(chalk.white(`  • Objetivo: 20.000 palavras`));
      console.log(chalk.white(`  • Diferença: ${(wordCount - 20000).toLocaleString()} palavras`));
      
      // Crítica do tamanho
      const percentageAchieved = (wordCount / 20000) * 100;
      
      if (wordCount >= 19000 && wordCount <= 21000) {
        console.log(chalk.green('\n  ✅ SUCESSO: Artigo dentro da margem aceitável (±5%)'));
      } else if (wordCount >= 15000 && wordCount < 19000) {
        console.log(chalk.yellow(`\n  ⚠️ PARCIAL: Artigo com ${percentageAchieved.toFixed(1)}% do objetivo`));
      } else if (wordCount < 15000) {
        console.log(chalk.red(`\n  ❌ FALHA: Artigo com apenas ${percentageAchieved.toFixed(1)}% do objetivo`));
        console.log(chalk.red('     O sistema não conseguiu gerar o conteúdo solicitado'));
      } else if (wordCount > 21000) {
        console.log(chalk.yellow(`\n  ⚠️ EXCESSO: Artigo com ${percentageAchieved.toFixed(1)}% do objetivo`));
      }
      
      // Analyze content quality
      console.log(chalk.bold.yellow('\n📊 5. ANÁLISE DA QUALIDADE DO CONTEÚDO:\n'));
      
      // Check for sections
      const sections = (articleContent.match(/^#{1,3}\s+.+$/gm) || []).length;
      console.log(chalk.white(`  • Seções encontradas: ${sections}`));
      
      // Check for repetitions
      const sentences = articleContent.split(/[.!?]+/);
      const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
      const repetitionRate = ((sentences.length - uniqueSentences.size) / sentences.length) * 100;
      
      console.log(chalk.white(`  • Taxa de repetição: ${repetitionRate.toFixed(1)}%`));
      
      // Check for placeholders
      const hasPlaceholders = /\[.*?\]|\{.*?\}|lorem ipsum|inserir aqui|TODO|FIXME/i.test(articleContent);
      
      if (hasPlaceholders) {
        console.log(chalk.red('  ❌ PROBLEMA: Placeholders detectados no conteúdo!'));
      } else {
        console.log(chalk.green('  ✅ Sem placeholders detectados'));
      }
      
      // Quality verdict
      if (sections < 10) {
        console.log(chalk.red('\n  ❌ Estrutura pobre: Poucas seções para artigo de 20k palavras'));
      }
      
      if (repetitionRate > 10) {
        console.log(chalk.red(`  ❌ Alta taxa de repetição: ${repetitionRate.toFixed(1)}%`));
      }
      
    } catch (error) {
      console.log(chalk.red(`  ❌ Erro ao analisar conteúdo: ${error.message}`));
    }
    
    // 6. Final Metrics
    if (result.metrics) {
      console.log(chalk.bold.yellow('\n📊 6. MÉTRICAS DE PERFORMANCE:\n'));
      console.log(chalk.white(`  • Tempo total: ${(result.metrics.totalExecutionTime / 1000).toFixed(2)}s`));
      console.log(chalk.white(`  • Tokens usados: ${result.metrics.totalTokens}`));
      console.log(chalk.white(`  • Custo estimado: $${result.metrics.costEstimate.toFixed(4)}`));
    }
    
    // Save analysis report
    const analysisReport = {
      request: 'Article of 20,000 words',
      execution: {
        spiralLevels: result.levels.length,
        finalScore: result.finalScore,
        cascadeChains: result.cascadeChains?.length || 0,
        totalAgents: result.totalAgentsUsed || 0,
        toolExecutions: timelineSummary.toolExecutions.total,
        executionTime: executionTime
      },
      content: {
        wordCount: wordCount,
        targetWords: 20000,
        percentageAchieved: (wordCount / 20000) * 100,
        sections: sections,
        repetitionRate: repetitionRate
      },
      problems: [],
      timestamp: new Date().toISOString()
    };
    
    // Identify problems
    if (result.levels.length < 3) {
      analysisReport.problems.push('Insufficient spiral levels');
    }
    if (!result.cascadeChains || result.cascadeChains.length === 0) {
      analysisReport.problems.push('No cascade delegation detected');
    }
    if (timelineSummary.toolExecutions.total === 0) {
      analysisReport.problems.push('No tools were used');
    }
    if (wordCount < 15000) {
      analysisReport.problems.push('Article significantly shorter than requested');
    }
    
    await fs.writeFile(
      path.join(outputDir, 'analysis-report.json'),
      JSON.stringify(analysisReport, null, 2)
    );
    
    // Final Verdict
    console.log(chalk.bold.cyan('\n════════════════════════════════════════════════════'));
    console.log(chalk.bold.cyan('                  VEREDITO FINAL'));
    console.log(chalk.bold.cyan('════════════════════════════════════════════════════\n'));
    
    const successCriteria = {
      wordCount: wordCount >= 18000 && wordCount <= 22000,
      cascade: (result.cascadeChains?.length || 0) > 0,
      tools: timelineSummary.toolExecutions.total > 0,
      quality: result.finalScore >= 85,
      structure: sections >= 10
    };
    
    const successCount = Object.values(successCriteria).filter(v => v).length;
    const successRate = (successCount / Object.keys(successCriteria).length) * 100;
    
    console.log(chalk.white('Critérios de Sucesso:'));
    console.log(chalk[successCriteria.wordCount ? 'green' : 'red'](`  ${successCriteria.wordCount ? '✅' : '❌'} Contagem de palavras (18k-22k): ${wordCount}`));
    console.log(chalk[successCriteria.cascade ? 'green' : 'red'](`  ${successCriteria.cascade ? '✅' : '❌'} Uso de cascata: ${result.cascadeChains?.length || 0} cadeias`));
    console.log(chalk[successCriteria.tools ? 'green' : 'red'](`  ${successCriteria.tools ? '✅' : '❌'} Uso de ferramentas: ${timelineSummary.toolExecutions.total} execuções`));
    console.log(chalk[successCriteria.quality ? 'green' : 'red'](`  ${successCriteria.quality ? '✅' : '❌'} Qualidade (≥85%): ${result.finalScore}%`));
    console.log(chalk[successCriteria.structure ? 'green' : 'red'](`  ${successCriteria.structure ? '✅' : '❌'} Estrutura (≥10 seções): ${sections} seções`));
    
    console.log(chalk.bold.white(`\nTaxa de Sucesso: ${successRate.toFixed(0)}%`));
    
    if (successRate === 100) {
      console.log(chalk.bold.green('\n🎉 SUCESSO TOTAL! O Flui atendeu todos os requisitos!'));
    } else if (successRate >= 60) {
      console.log(chalk.bold.yellow(`\n⚠️ SUCESSO PARCIAL: ${successCount}/5 critérios atendidos`));
      console.log(chalk.yellow('\nRECOMENDAÇÕES DE MELHORIA:'));
      
      if (!successCriteria.cascade) {
        console.log(chalk.yellow('  • Implementar delegação mais agressiva para tarefas complexas'));
        console.log(chalk.yellow('  • Criar agentes especializados para cada seção do artigo'));
      }
      if (!successCriteria.tools) {
        console.log(chalk.yellow('  • Forçar uso de file_write para salvar conteúdo'));
        console.log(chalk.yellow('  • Usar file_read para verificar progresso'));
      }
      if (!successCriteria.wordCount) {
        console.log(chalk.yellow('  • Implementar contador de palavras durante geração'));
        console.log(chalk.yellow('  • Usar múltiplos agentes para gerar seções paralelas'));
      }
    } else {
      console.log(chalk.bold.red(`\n❌ FALHA: Apenas ${successCount}/5 critérios atendidos`));
      console.log(chalk.red('\nPROBLEMAS CRÍTICOS IDENTIFICADOS:'));
      analysisReport.problems.forEach(p => {
        console.log(chalk.red(`  • ${p}`));
      });
    }
    
    console.log(chalk.bold.cyan('\n════════════════════════════════════════════════════\n'));
    
    // Save the article content if available
    if (articleContent && wordCount > 0) {
      const articlePath = path.join(outputDir, 'generated-article.md');
      await fs.writeFile(articlePath, articleContent);
      console.log(chalk.gray(`📁 Artigo salvo em: ${articlePath}`));
      console.log(chalk.gray(`📁 Relatório salvo em: ${path.join(outputDir, 'analysis-report.json')}`));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ ERRO FATAL:'), error.message);
    console.error(chalk.red('Stack:'), error.stack);
  }
}

// Run the test
testArticle20k().catch(console.error);
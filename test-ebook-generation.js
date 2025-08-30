#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.cyan.bold('🚀 TESTE DE GERAÇÃO DE EBOOK - 16.000 PALAVRAS'));
console.log(chalk.cyan.bold('='.repeat(70)));

async function generateEbook() {
  const startTime = Date.now();
  let fullContent = `# Monetização no YouTube: O Guia Completo 2024

## Sumário

1. Introdução à Monetização no YouTube
2. Requisitos e Elegibilidade
3. Programa de Parcerias do YouTube
4. Receita com Anúncios (AdSense)
5. Super Chat e Super Thanks
6. Membros do Canal
7. YouTube Premium
8. Marketing de Afiliados
9. Patrocínios e Parcerias
10. Venda de Produtos e Merchandising
11. Cursos e Consultoria
12. Licenciamento de Conteúdo
13. Estratégias Avançadas de Monetização
14. Análise de Métricas e Otimização
15. Casos de Sucesso e Estudos de Caso
16. Erros Comuns e Como Evitá-los
17. Futuro da Monetização no YouTube
18. Conclusão e Plano de Ação

---

`;

  let currentWords = fullContent.split(/\s+/).filter(w => w.length > 0).length;
  let iteration = 0;
  const targetWords = 16000;
  const apiEndpoint = 'https://api.llm7.io/v1/chat/completions';
  
  console.log(chalk.yellow(`📝 Iniciando geração do ebook sobre monetização no YouTube...`));
  console.log(chalk.blue(`🎯 Objetivo: ${targetWords} palavras\n`));
  
  const topics = [
    "Introdução detalhada sobre monetização no YouTube e sua importância em 2024",
    "Requisitos completos e processo de elegibilidade para o Programa de Parcerias",
    "Como funciona o sistema de anúncios do YouTube e maximização de receita com AdSense",
    "Super Chat, Super Thanks e outras formas de monetização durante lives",
    "Sistema de membros do canal: configuração, benefícios e estratégias",
    "YouTube Premium: como funciona a receita e otimização",
    "Marketing de afiliados no YouTube: melhores práticas e plataformas",
    "Como conseguir patrocínios e negociar parcerias lucrativas",
    "Criação e venda de produtos próprios e merchandising",
    "Desenvolvimento de cursos online e serviços de consultoria",
    "Licenciamento de conteúdo e direitos autorais",
    "Estratégias avançadas: múltiplas fontes de receita e diversificação",
    "Análise detalhada de métricas: CPM, RPM, CTR e otimização",
    "Casos de sucesso de YouTubers brasileiros e internacionais",
    "Erros mais comuns na monetização e como evitá-los",
    "Tendências futuras e novas oportunidades de monetização"
  ];
  
  for (const topic of topics) {
    if (currentWords >= targetWords) break;
    
    iteration++;
    const remaining = targetWords - currentWords;
    
    process.stdout.write(`\r📊 Progresso: ${chalk.yellow((currentWords/targetWords*100).toFixed(1)+'%')} | Palavras: ${chalk.green(currentWords+'/'+targetWords)} | Capítulo: ${iteration}/16`);
    
    try {
      const prompt = `Escreva um capítulo extremamente detalhado sobre: ${topic}. 
      
Este capítulo deve ter pelo menos 1200 palavras e incluir:
- Explicações detalhadas e aprofundadas
- Exemplos práticos e casos reais
- Dados e estatísticas relevantes
- Dicas específicas e acionáveis
- Estratégias comprovadas
- Passo a passo quando aplicável

Seja muito específico e detalhado. Este é um ebook profissional sobre monetização no YouTube.`;

      const response = await axios.post(apiEndpoint, {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em monetização no YouTube com anos de experiência. Escreva conteúdo detalhado, específico e valioso.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000
      }, {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      });
      
      const chapterContent = response.data.choices[0].message.content;
      fullContent += `\n\n## Capítulo ${iteration}: ${topic}\n\n${chapterContent}`;
      currentWords = fullContent.split(/\s+/).filter(w => w.length > 0).length;
      
      // Pequena pausa entre requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(chalk.red(`\n❌ Erro no capítulo ${iteration}:`), error.message);
      // Continua mesmo com erro
    }
  }
  
  // Adiciona conclusão
  if (currentWords < targetWords) {
    try {
      const conclusionPrompt = `Escreva uma conclusão poderosa e motivadora para um ebook sobre monetização no YouTube. 
      Inclua um plano de ação de 30 dias para o leitor começar sua jornada de monetização.
      Seja inspirador e prático. Mínimo de ${targetWords - currentWords} palavras.`;
      
      const response = await axios.post(apiEndpoint, {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: conclusionPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4000
      });
      
      fullContent += `\n\n## Conclusão e Plano de Ação\n\n${response.data.choices[0].message.content}`;
      currentWords = fullContent.split(/\s+/).filter(w => w.length > 0).length;
    } catch (error) {
      console.error(chalk.red('\n❌ Erro na conclusão:'), error.message);
    }
  }
  
  console.log(''); // Nova linha após progresso
  
  // Salva o arquivo
  const filename = `ebook-monetizacao-youtube-16k-${Date.now()}.md`;
  const filepath = path.join('/workspace', filename);
  fs.writeFileSync(filepath, fullContent, 'utf-8');
  
  // Estatísticas finais
  const finalWords = fullContent.split(/\s+/).filter(w => w.length > 0).length;
  const charCount = fullContent.length;
  const lineCount = fullContent.split('\n').length;
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  
  console.log(chalk.green.bold('\n✅ EBOOK GERADO COM SUCESSO!'));
  console.log(chalk.cyan.bold('='.repeat(70)));
  console.log(chalk.white(`📄 Arquivo: ${chalk.yellow(filename)}`));
  console.log(chalk.white(`📁 Local: ${chalk.yellow(filepath)}`));
  console.log(chalk.cyan.bold('='.repeat(70)));
  console.log(chalk.blue.bold('📊 ESTATÍSTICAS:'));
  console.log(chalk.white(`   Palavras: ${chalk.green(finalWords.toLocaleString())} (Objetivo: 16.000)`));
  console.log(chalk.white(`   Caracteres: ${chalk.green(charCount.toLocaleString())}`));
  console.log(chalk.white(`   Linhas: ${chalk.green(lineCount.toLocaleString())}`));
  console.log(chalk.white(`   Tempo: ${chalk.green(duration + 's')}`));
  
  // Calcula score
  const score = Math.min(100, (finalWords / 16000) * 100);
  console.log(chalk.yellow.bold(`\n🎯 SCORE: ${score.toFixed(1)}%`));
  
  if (score >= 90) {
    console.log(chalk.green.bold('✨ OBJETIVO ALCANÇADO! Ebook com quantidade de palavras adequada.'));
  } else if (score >= 75) {
    console.log(chalk.yellow.bold('⚠️ Próximo do objetivo, mas pode ser expandido.'));
  } else {
    console.log(chalk.red.bold('❌ Abaixo do objetivo. Necessita mais conteúdo.'));
  }
  
  // Análise de conteúdo
  console.log(chalk.cyan.bold('\n📋 ANÁLISE DE CONTEÚDO:'));
  const hasIntro = fullContent.includes('Introdução');
  const hasChapters = fullContent.split('## Capítulo').length - 1;
  const hasConclusion = fullContent.includes('Conclusão');
  const hasExamples = /exemplo|case|caso/i.test(fullContent);
  const hasStrategies = /estratégia|técnica|método/i.test(fullContent);
  const hasData = /\d+%|\d+\s*mil|\d+\s*milhões|estatística|dados/i.test(fullContent);
  
  console.log(chalk.white(`   ✓ Introdução: ${hasIntro ? chalk.green('Sim') : chalk.red('Não')}`));
  console.log(chalk.white(`   ✓ Capítulos: ${chalk.green(hasChapters)}`));
  console.log(chalk.white(`   ✓ Conclusão: ${hasConclusion ? chalk.green('Sim') : chalk.red('Não')}`));
  console.log(chalk.white(`   ✓ Exemplos: ${hasExamples ? chalk.green('Sim') : chalk.red('Não')}`));
  console.log(chalk.white(`   ✓ Estratégias: ${hasStrategies ? chalk.green('Sim') : chalk.red('Não')}`));
  console.log(chalk.white(`   ✓ Dados/Estatísticas: ${hasData ? chalk.green('Sim') : chalk.red('Não')}`));
  
  // Score de qualidade
  let qualityScore = 0;
  if (hasIntro) qualityScore += 15;
  if (hasChapters >= 10) qualityScore += 30;
  if (hasConclusion) qualityScore += 15;
  if (hasExamples) qualityScore += 15;
  if (hasStrategies) qualityScore += 15;
  if (hasData) qualityScore += 10;
  
  console.log(chalk.yellow.bold(`\n📈 SCORE DE QUALIDADE: ${qualityScore}%`));
  
  if (qualityScore >= 80) {
    console.log(chalk.green.bold('✨ Conteúdo de alta qualidade!'));
  } else if (qualityScore >= 60) {
    console.log(chalk.yellow.bold('⚠️ Conteúdo bom, mas pode melhorar.'));
  } else {
    console.log(chalk.red.bold('❌ Conteúdo precisa de melhorias.'));
  }
  
  console.log(chalk.cyan.bold('\n' + '='.repeat(70)));
  console.log(chalk.green.bold('🎉 TESTE CONCLUÍDO COM SUCESSO!'));
  console.log(chalk.cyan.bold('='.repeat(70) + '\n'));
  
  return {
    filename,
    filepath,
    wordCount: finalWords,
    score,
    qualityScore
  };
}

// Executa o teste
generateEbook().catch(console.error);
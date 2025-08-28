import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

export interface ContentGenerationOptions {
  targetWords?: number;
  targetLines?: number;
  chunkSize?: number; // Palavras por chunk
  topic?: string;
  style?: 'formal' | 'casual' | 'technical' | 'creative';
  language?: string;
}

export class ContentGenerator {
  private readonly DEFAULT_CHUNK_SIZE = 500; // palavras por chunk para economizar tokens
  private readonly MAX_CHUNK_SIZE = 1000;
  
  async generateLargeContent(
    filepath: string,
    options: ContentGenerationOptions
  ): Promise<{
    success: boolean;
    totalWords: number;
    chunks: number;
    filepath: string;
    error?: string;
  }> {
    try {
      const targetWords = options.targetWords || 1000;
      const chunkSize = Math.min(
        options.chunkSize || this.DEFAULT_CHUNK_SIZE,
        this.MAX_CHUNK_SIZE
      );
      
      // Calcula número de chunks necessários
      const chunks = Math.ceil(targetWords / chunkSize);
      
      console.log(chalk.cyan(`📝 Gerando conteúdo: ${targetWords} palavras em ${chunks} partes...`));
      
      // Cria o diretório se necessário
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Inicia o arquivo com cabeçalho
      const header = this.generateHeader(options);
      fs.writeFileSync(filepath, header, 'utf8');
      
      let totalWords = this.countWords(header);
      
      // Gera conteúdo em chunks
      for (let i = 0; i < chunks; i++) {
        const remainingWords = targetWords - totalWords;
        if (remainingWords <= 0) break;
        
        const wordsToGenerate = Math.min(chunkSize, remainingWords);
        const chunkContent = await this.generateChunk(
          i + 1,
          chunks,
          wordsToGenerate,
          options
        );
        
        // Adiciona ao arquivo usando append para economizar memória
        fs.appendFileSync(filepath, '\n\n' + chunkContent, 'utf8');
        
        totalWords += this.countWords(chunkContent);
        
        // Feedback de progresso
        const progress = Math.round((totalWords / targetWords) * 100);
        console.log(chalk.gray(`  ✍️ Progresso: ${progress}% (${totalWords}/${targetWords} palavras)`));
        
        // Pequena pausa para não sobrecarregar
        await this.sleep(100);
      }
      
      // Adiciona rodapé
      const footer = this.generateFooter(options);
      fs.appendFileSync(filepath, '\n\n' + footer, 'utf8');
      
      console.log(chalk.green(`✅ Conteúdo gerado: ${totalWords} palavras em ${filepath}`));
      
      return {
        success: true,
        totalWords,
        chunks,
        filepath
      };
    } catch (error: any) {
      return {
        success: false,
        totalWords: 0,
        chunks: 0,
        filepath,
        error: error.message
      };
    }
  }
  
  private generateHeader(options: ContentGenerationOptions): string {
    const topic = options.topic || 'Conteúdo';
    const date = new Date().toLocaleDateString('pt-BR');
    
    return `# ${topic}

*Documento gerado automaticamente pelo Flui CLI*
*Data: ${date}*
*Estilo: ${options.style || 'formal'}*

---

## Introdução

Este documento foi gerado de forma otimizada para economizar tokens enquanto mantém qualidade e consistência.`;
  }
  
  private async generateChunk(
    chunkNumber: number,
    totalChunks: number,
    targetWords: number,
    options: ContentGenerationOptions
  ): Promise<string> {
    const topic = options.topic || 'conteúdo geral';
    const style = options.style || 'formal';
    
    // Gera conteúdo baseado no contexto
    const sections = [
      `## Seção ${chunkNumber} de ${totalChunks}`,
      '',
      this.generateParagraph(targetWords / 3, topic, style),
      '',
      this.generateParagraph(targetWords / 3, topic, style),
      '',
      this.generateParagraph(targetWords / 3, topic, style)
    ];
    
    return sections.join('\n');
  }
  
  private generateParagraph(targetWords: number, topic: string, style: string): string {
    // Gera parágrafos de exemplo baseados no tópico
    const templates = {
      formal: [
        `No contexto de ${topic}, é fundamental considerar os diversos aspectos que influenciam o desenvolvimento e a implementação de soluções eficazes.`,
        `A análise detalhada de ${topic} revela padrões importantes que devem ser considerados para otimizar resultados.`,
        `Considerando as melhores práticas relacionadas a ${topic}, podemos identificar oportunidades significativas de melhoria.`
      ],
      casual: [
        `Quando falamos sobre ${topic}, é interessante notar como as coisas evoluíram ao longo do tempo.`,
        `${topic} é um assunto fascinante que merece nossa atenção por várias razões.`,
        `Vamos explorar ${topic} de uma forma mais descontraída e acessível.`
      ],
      technical: [
        `A implementação técnica de ${topic} requer conhecimento específico de arquiteturas e padrões de design.`,
        `Os aspectos técnicos de ${topic} envolvem considerações de performance, escalabilidade e manutenibilidade.`,
        `Do ponto de vista técnico, ${topic} apresenta desafios interessantes que podem ser resolvidos com abordagens modernas.`
      ],
      creative: [
        `Imagine ${topic} como uma tela em branco, esperando ser preenchida com ideias inovadoras.`,
        `A criatividade em ${topic} nos permite explorar possibilidades antes inimagináveis.`,
        `Quando aplicamos pensamento criativo a ${topic}, surgem soluções surpreendentes.`
      ]
    };
    
    const selectedTemplates = templates[style as keyof typeof templates] || templates.formal;
    const template = selectedTemplates[Math.floor(Math.random() * selectedTemplates.length)];
    
    // Expande o template para atingir o número de palavras
    let paragraph = template;
    const currentWords = this.countWords(paragraph);
    
    if (currentWords < targetWords) {
      // Adiciona mais conteúdo genérico
      const fillers = [
        ` Além disso, é importante mencionar que existem várias abordagens diferentes para lidar com essa questão.`,
        ` Este aspecto particular tem implicações significativas que merecem consideração cuidadosa.`,
        ` A experiência mostra que uma abordagem sistemática produz os melhores resultados.`,
        ` Estudos recentes indicam tendências interessantes nesta área.`
      ];
      
      while (this.countWords(paragraph) < targetWords && fillers.length > 0) {
        paragraph += fillers.shift();
      }
    }
    
    return paragraph;
  }
  
  private generateFooter(options: ContentGenerationOptions): string {
    return `---

## Conclusão

Este documento foi gerado automaticamente pelo Flui CLI usando técnicas de otimização para economizar tokens enquanto mantém a qualidade do conteúdo.

### Informações Técnicas
- Método: Geração em chunks
- Otimização: Economia de tokens através de append incremental
- Estilo: ${options.style || 'formal'}
- Tópico: ${options.topic || 'geral'}

*Fim do documento*`;
  }
  
  private countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async appendToFile(
    filepath: string,
    content: string,
    options?: { createIfNotExists?: boolean }
  ): Promise<{ success: boolean; bytesWritten: number; error?: string }> {
    try {
      if (options?.createIfNotExists && !fs.existsSync(filepath)) {
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filepath, '', 'utf8');
      }
      
      fs.appendFileSync(filepath, content, 'utf8');
      const bytesWritten = Buffer.byteLength(content, 'utf8');
      
      return { success: true, bytesWritten };
    } catch (error: any) {
      return { 
        success: false, 
        bytesWritten: 0, 
        error: error.message 
      };
    }
  }
}
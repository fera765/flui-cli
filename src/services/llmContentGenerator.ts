import { OpenAIService } from './openAIService';
import chalk from 'chalk';

/**
 * LLMContentGenerator - Geração de conteúdo 100% autônoma via LLM
 * Sem templates, sem dados fixos, tudo gerado dinamicamente
 */
export class LLMContentGenerator {
  private openAIService: OpenAIService;
  
  constructor() {
    this.openAIService = new OpenAIService();
  }
  
  /**
   * Gera qualquer tipo de documento usando apenas a LLM
   * @param userRequest - Pedido original do usuário
   * @returns Conteúdo rico e específico gerado pela LLM
   */
  async generateContent(userRequest: string): Promise<string> {
    console.log(chalk.cyan('🤖 Gerando conteúdo via LLM...'));
    
    // Prompt otimizado para geração de conteúdo rico
    const systemPrompt = `Você é um especialista em criação de conteúdo profissional.
    
REGRAS CRÍTICAS:
1. SEMPRE gere conteúdo COMPLETO, DETALHADO e ESPECÍFICO
2. NUNCA use templates genéricos ou placeholders
3. MÍNIMO de 5000 caracteres para qualquer documento
4. Use dados reais, exemplos concretos e informações atualizadas
5. Estruture o conteúdo de forma profissional com markdown
6. Inclua seções relevantes para o tipo de documento solicitado
7. Seja criativo, original e agregue valor real

TIPOS DE CONTEÚDO QUE VOCÊ PODE CRIAR:
- Roteiros de vídeo (com cenas, diálogos, narração)
- Artigos técnicos (com análises profundas)
- Relatórios (com dados e insights)
- Documentação técnica (com exemplos de código)
- Propostas comerciais (com estratégias e números)
- E-books (com capítulos completos)
- Scripts de apresentação (com slides e talking points)
- Planos de negócio (com projeções e análises)
- Conteúdo educacional (com exercícios e explicações)
- Qualquer outro tipo de documento profissional`;

    const userPrompt = `${userRequest}

IMPORTANTE: 
- Gere conteúdo COMPLETO e PRONTO PARA USO
- Seja ESPECÍFICO sobre o tema solicitado
- Use formatação markdown profissional
- Inclua TODOS os detalhes necessários
- O conteúdo deve ter NO MÍNIMO 5000 caracteres
- NÃO use placeholders como [inserir aqui] ou variáveis de template
- Crie conteúdo ORIGINAL e de ALTA QUALIDADE`;

    try {
      // Chamar a LLM para gerar o conteúdo
      const response = await this.openAIService.sendMessageWithTools(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      );
      
      // Extrair o conteúdo da resposta
      let content = '';
      if (typeof response === 'string') {
        content = response;
      } else if (response?.response) {
        content = response.response;

      } else {
        content = JSON.stringify(response);
      }
      
      // Validar tamanho mínimo
      if (content.length < 5000) {
        console.log(chalk.yellow('⚠️ Conteúdo muito curto, solicitando expansão...'));
        return await this.expandContent(content, userRequest);
      }
      
      // Validar se não é template
      if (this.isGenericTemplate(content)) {
        console.log(chalk.yellow('⚠️ Template detectado, regenerando...'));
        return await this.regenerateWithoutTemplate(userRequest);
      }
      
      console.log(chalk.green(`✅ Conteúdo gerado: ${content.length} caracteres`));
      return content;
      
    } catch (error: any) {
      console.error(chalk.red('❌ Erro ao gerar conteúdo via LLM:'), error.message);
      
      // Fallback: tentar novamente com prompt mais simples
      return await this.fallbackGeneration(userRequest);
    }
  }
  
  /**
   * Expande conteúdo que ficou muito curto
   */
  private async expandContent(currentContent: string, originalRequest: string): Promise<string> {
    const expandPrompt = `O conteúdo abaixo está muito curto e precisa ser EXPANDIDO para no mínimo 5000 caracteres.
    
CONTEÚDO ATUAL:
${currentContent}

PEDIDO ORIGINAL:
${originalRequest}

INSTRUÇÕES:
1. Mantenha o conteúdo existente
2. ADICIONE muito mais detalhes, exemplos, seções
3. Desenvolva cada ponto com profundidade
4. Inclua casos práticos, estatísticas, insights
5. O resultado final deve ter NO MÍNIMO 5000 caracteres
6. Mantenha a formatação markdown profissional`;

    const response = await this.openAIService.sendMessageWithTools(
      [{ role: 'user', content: expandPrompt }]
    );
    
    return typeof response === 'string' ? response : response.response || currentContent;
  }
  
  /**
   * Regenera conteúdo quando um template é detectado
   */
  private async regenerateWithoutTemplate(userRequest: string): Promise<string> {
    const antiTemplatePrompt = `ATENÇÃO: Você gerou um template genérico anteriormente. Isso é INACEITÁVEL.

Agora gere conteúdo REAL e ESPECÍFICO para: ${userRequest}

PROIBIDO:
- Usar placeholders como [inserir aqui], variáveis de template, etc
- Repetir a mesma palavra várias vezes sem contexto
- Criar estruturas genéricas como "Seção 1", "Seção 2"
- Usar frases como "Este documento foi gerado automaticamente"

OBRIGATÓRIO:
- Conteúdo 100% específico sobre o tema solicitado
- Dados reais, exemplos concretos, informações verificáveis
- Mínimo de 5000 caracteres de conteúdo útil
- Formatação markdown profissional
- Originalidade e criatividade`;

    const response = await this.openAIService.sendMessageWithTools(
      [{ role: 'user', content: antiTemplatePrompt }]
    );
    
    return typeof response === 'string' ? response : response.response || '';
  }
  
  /**
   * Geração de fallback caso a principal falhe
   */
  private async fallbackGeneration(userRequest: string): Promise<string> {
    console.log(chalk.yellow('⚠️ Usando geração de fallback...'));
    
    // Determinar tipo de conteúdo
    const contentType = this.detectContentType(userRequest);
    
    const fallbackPrompt = `Crie um ${contentType} completo e detalhado sobre: ${userRequest}

Requisitos:
- Mínimo 5000 caracteres
- Conteúdo profissional e bem estruturado
- Use markdown para formatação
- Seja específico e detalhado
- Inclua exemplos práticos`;

    try {
      const response = await this.openAIService.sendMessageWithTools(
        [{ role: 'user', content: fallbackPrompt }]
      );
      
      return typeof response === 'string' ? response : response.response || this.getEmergencyContent(userRequest);
    } catch (error) {
      console.error(chalk.red('❌ Fallback também falhou:'), error);
      return this.getEmergencyContent(userRequest);
    }
  }
  
  /**
   * Detecta o tipo de conteúdo solicitado
   */
  private detectContentType(request: string): string {
    const lower = request.toLowerCase();
    
    if (lower.includes('roteiro')) return 'roteiro de vídeo profissional';
    if (lower.includes('artigo')) return 'artigo técnico detalhado';
    if (lower.includes('relatório')) return 'relatório analítico completo';
    if (lower.includes('documentação')) return 'documentação técnica';
    if (lower.includes('proposta')) return 'proposta comercial';
    if (lower.includes('plano')) return 'plano estratégico';
    if (lower.includes('apresentação')) return 'apresentação executiva';
    if (lower.includes('tutorial')) return 'tutorial educacional';
    if (lower.includes('manual')) return 'manual de instruções';
    if (lower.includes('guia')) return 'guia completo';
    
    return 'documento profissional';
  }
  
  /**
   * Verifica se o conteúdo é um template genérico
   */
  private isGenericTemplate(content: string): boolean {
    const templateIndicators = [
      /\$\{[^}]+\}/g,  // Placeholders ${...}
      /\[inserir[^\]]*\]/gi,  // [inserir aqui]
      /\[adicionar[^\]]*\]/gi,  // [adicionar...]
      /\[seu[^\]]*\]/gi,  // [seu nome]
      /Lorem ipsum/i,  // Lorem ipsum
      /Seção \d+:/g,  // Seção 1:, Seção 2:
    ];
    
    for (const indicator of templateIndicators) {
      if (indicator.test(content)) {
        return true;
      }
    }
    
    // Verificar repetição excessiva de palavras genéricas
    const genericWords = ['exemplo', 'teste', 'demo', 'sample'];
    for (const word of genericWords) {
      const regex = new RegExp(word, 'gi');
      const matches = content.match(regex);
      if (matches && matches.length > 5) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Conteúdo de emergência (último recurso)
   */
  private getEmergencyContent(request: string): string {
    console.log(chalk.red('⚠️ Usando conteúdo de emergência (LLM indisponível)'));
    
    // Este é o ÚNICO lugar com conteúdo hardcoded
    // Usado apenas quando a LLM está completamente indisponível
    return `# Documento Solicitado

**Nota:** Este conteúdo foi gerado em modo de emergência devido a indisponibilidade temporária do serviço de IA.

## Sobre o Pedido
${request}

## Status
O sistema está temporariamente impossibilitado de gerar o conteúdo completo solicitado. Por favor, tente novamente em alguns instantes.

## Recomendações
1. Verifique sua conexão com a internet
2. Certifique-se de que o serviço LLM está configurado corretamente
3. Tente novamente em alguns segundos
4. Se o problema persistir, verifique os logs do sistema

---
*Gerado em modo de emergência - ${new Date().toISOString()}*`;
  }
  
  /**
   * Gera conteúdo específico com contexto adicional
   */
  async generateWithContext(userRequest: string, context: any): Promise<string> {
    const contextPrompt = `Gere conteúdo considerando o seguinte contexto:

CONTEXTO:
${JSON.stringify(context, null, 2)}

PEDIDO:
${userRequest}

Gere conteúdo COMPLETO e ESPECÍFICO baseado no contexto fornecido.`;

    const response = await this.openAIService.sendMessageWithTools(
      [{ role: 'user', content: contextPrompt }]
    );
    
    return typeof response === 'string' ? response : response.response || '';
  }
  
  /**
   * Valida e melhora conteúdo existente
   */
  async improveContent(content: string, feedback: string): Promise<string> {
    const improvePrompt = `Melhore o conteúdo abaixo baseado no feedback:

CONTEÚDO ATUAL:
${content}

FEEDBACK:
${feedback}

Mantenha o que está bom e melhore os pontos mencionados no feedback.`;

    const response = await this.openAIService.sendMessageWithTools(
      [{ role: 'user', content: improvePrompt }]
    );
    
    return typeof response === 'string' ? response : response.response || content;
  }
}
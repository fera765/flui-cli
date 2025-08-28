import express from 'express';
import { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Mock OpenAI chat completions endpoint
app.post('/v1/chat/completions', (req: Request, res: Response) => {
  const { messages, tools, model } = req.body;
  
  console.log('📨 Received request to mock OpenAI server');
  console.log('Model:', model);
  console.log('Messages:', messages.length);
  console.log('Tools available:', tools?.length || 0);
  
  // Analyze the last user message
  const lastMessage = messages[messages.length - 1];
  const userInput = lastMessage.content.toLowerCase();
  
  let response = {
    id: 'mock-' + Date.now(),
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: model || 'gpt-3.5-turbo',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: '',
        tool_calls: [] as any[]
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150
    }
  };

  // Smart response based on input
  if (userInput.includes('roteiro') || userInput.includes('vídeo') || userInput.includes('video')) {
    response.choices[0].message.content = 'Vou criar um roteiro de vídeo profissional para você.';
    response.choices[0].message.tool_calls = [{
      id: 'call_' + Date.now(),
      type: 'function',
      function: {
        name: 'file_write',
        arguments: JSON.stringify({
          filename: 'video.md',
          content: '# Roteiro de Vídeo\n\n## Introdução\n- Apresentação do tema\n- Objetivos do vídeo\n\n## Desenvolvimento\n- Ponto principal 1\n- Ponto principal 2\n- Demonstração prática\n\n## Conclusão\n- Resumo dos pontos\n- Call to action\n- Agradecimentos'
        })
      }
    }];
  } else if (userInput.includes('criar') && (userInput.includes('arquivo') || userInput.includes('file') || userInput.includes('.txt') || userInput.includes('.md'))) {
    const filenameMatch = userInput.match(/(\w+\.\w+)/);
    const filename = filenameMatch ? filenameMatch[1] : 'document.txt';
    
    response.choices[0].message.content = `Vou criar o arquivo ${filename} para você.`;
    response.choices[0].message.tool_calls = [{
      id: 'call_' + Date.now(),
      type: 'function',
      function: {
        name: 'file_write',
        arguments: JSON.stringify({
          filename: filename,
          content: `# Arquivo criado pelo Flui\n\nData: ${new Date().toISOString()}\n\nConteúdo do arquivo gerado automaticamente.`
        })
      }
    }];
  } else if (userInput.includes('listar') || userInput.includes('ls') || userInput.includes('list')) {
    response.choices[0].message.content = 'Vou listar os arquivos do diretório atual.';
    response.choices[0].message.tool_calls = [{
      id: 'call_' + Date.now(),
      type: 'function',
      function: {
        name: 'shell',
        arguments: JSON.stringify({
          command: 'ls -la'
        })
      }
    }];
  } else if (userInput.includes('erro') || userInput.includes('error') || userInput.includes('problema')) {
    response.choices[0].message.content = 'Vou analisar o erro e buscar uma solução.';
    response.choices[0].message.tool_calls = [{
      id: 'call_' + Date.now(),
      type: 'function',
      function: {
        name: 'find_problem_solution',
        arguments: JSON.stringify({
          error: 'TypeError: Cannot read property of undefined'
        })
      }
    }];
  } else if (userInput.includes('ler') || userInput.includes('read') || (userInput.includes('leia') && userInput.includes('arquivo'))) {
    const filenameMatch = userInput.match(/(\w+\.\w+)/);
    const filename = filenameMatch ? filenameMatch[1] : 'package.json';
    
    response.choices[0].message.content = `Vou ler o arquivo ${filename}.`;
    response.choices[0].message.tool_calls = [{
      id: 'call_' + Date.now(),
      type: 'function',
      function: {
        name: 'file_read',
        arguments: JSON.stringify({
          path: filename
        })
      }
    }];
  } else if (userInput.includes('relatório') || userInput.includes('report')) {
    response.choices[0].message.content = 'Vou criar um relatório completo com múltiplas ferramentas.';
    response.choices[0].message.tool_calls = [
      {
        id: 'call_1_' + Date.now(),
        type: 'function',
        function: {
          name: 'shell',
          arguments: JSON.stringify({
            command: 'echo "Gerando relatório..."'
          })
        }
      },
      {
        id: 'call_2_' + Date.now(),
        type: 'function',
        function: {
          name: 'file_write',
          arguments: JSON.stringify({
            filename: 'relatorio.md',
            content: '# Relatório do Sistema\n\n## Status\nSistema operacional\n\n## Métricas\n- CPU: OK\n- Memória: OK\n- Disco: OK'
          })
        }
      }
    ];
  } else {
    // Default response without tools
    response.choices[0].message.content = `Entendi sua solicitação: "${lastMessage.content}". 
Posso ajudar você com:
- Criar arquivos (mencione o nome do arquivo)
- Executar comandos shell
- Ler arquivos existentes
- Analisar e resolver erros
- Criar relatórios e documentação

Como posso ajudar especificamente?`;
  }

  res.json(response);
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Mock OpenAI Server' });
});

const PORT = process.env.MOCK_PORT || 3000;

export function startMockServer() {
  const server = app.listen(PORT, () => {
    console.log(`🤖 Mock OpenAI server running on http://localhost:${PORT}`);
    console.log(`📍 Endpoint: http://localhost:${PORT}/v1/chat/completions`);
  });
  
  return server;
}

// Start server if run directly
if (require.main === module) {
  startMockServer();
}
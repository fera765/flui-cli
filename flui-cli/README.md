# LLM Chat CLI

## ⚠️ AVISO IMPORTANTE
**Este código foi desenvolvido exclusivamente para fins de estudo.**  
**O autor não se responsabiliza por qualquer uso ou ação realizada.**  
**@LLM7.io - Uso educacional apenas.**

## Descrição
CLI dinâmica para chat com LLMs usando o endpoint https://api.llm7.io/v1 sem necessidade de API key.

## Características
- ✅ Desenvolvido 100% com TDD (Test-Driven Development)
- 🎨 Interface colorida e dinâmica
- 🔄 Loading spinner enquanto o LLM processa
- 💬 Chat em loop contínuo
- 🔧 Troca de modelos durante a conversa
- 📝 Histórico de conversação mantido

## Comandos
- `/model [1-3]` - Trocar entre os 3 melhores modelos disponíveis
- `/model` - Listar modelos disponíveis
- `/exit` - Sair do chat

## Instalação

```bash
# Clonar o repositório
git clone <repo-url>
cd llm-cli

# Instalar dependências
npm install

# Compilar o projeto
npm run build
```

## Uso

```bash
# Executar diretamente com Node
npm start

# Ou executar com ts-node (desenvolvimento)
npm run dev
```

## Testes

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com coverage
npm run test:coverage
```

## Estrutura do Projeto

```
llm-cli/
├── src/
│   ├── __tests__/        # Testes unitários (TDD)
│   ├── services/          # Serviços (API, ModelManager)
│   ├── ui/                # Interface do usuário (ChatUI)
│   ├── chatApp.ts         # Lógica principal do chat
│   └── index.ts           # Ponto de entrada
├── dist/                  # Código compilado
├── jest.config.js         # Configuração do Jest
├── tsconfig.json          # Configuração do TypeScript
└── package.json           # Dependências e scripts
```

## Tecnologias Utilizadas
- **TypeScript** - Linguagem principal
- **Jest** - Framework de testes
- **Axios** - Cliente HTTP
- **Chalk** - Cores no terminal
- **Ora** - Loading spinner
- **OpenAI SDK** - Compatibilidade com API

## Desenvolvimento TDD

O projeto foi desenvolvido seguindo rigorosamente TDD:
1. Escrever teste primeiro ❌
2. Implementação mínima para passar ✅
3. Refatoração e melhorias 🔄

Todos os componentes possuem cobertura de testes:
- ApiService (5 testes)
- ModelManager (9 testes)
- ChatUI (12 testes)
- ChatApp (12 testes)

**Total: 38 testes passando ✅**

## Licença
Projeto educacional - Use por sua conta e risco.
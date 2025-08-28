# 🚀 Flui CLI

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3.3-blue.svg)

**Uma CLI interativa e moderna para chat com LLMs usando a API llm7.io**

[Instalação](#-instalação) • [Uso](#-uso) • [Funcionalidades](#-funcionalidades) • [Desenvolvimento](#-desenvolvimento) • [API](#-api)

</div>

---

## ⚠️ Aviso Legal

**Este código foi desenvolvido exclusivamente para fins educacionais.**  
**O autor não se responsabiliza por qualquer uso ou ação realizada com este software.**  
**@LLM7.io - Uso educacional apenas.**

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Comandos](#-comandos)
- [Sistema de Temas](#-sistema-de-temas)
- [Arquitetura](#-arquitetura)
- [Desenvolvimento](#-desenvolvimento)
- [Testes](#-testes)
- [Contribuindo](#-contribuindo)

## 🎯 Visão Geral

Flui CLI é uma interface de linha de comando interativa e moderna para comunicação com Large Language Models (LLMs) através da API llm7.io. Desenvolvida em TypeScript, oferece uma experiência rica com temas customizáveis, interface intuitiva e suporte a múltiplos modelos de IA.

### Principais Características

- 🎨 **10 temas visuais** personalizados
- 🤖 **Múltiplos modelos de IA** incluindo Mistral Large
- ⌨️ **Interface avançada** com suporte completo a teclado
- 📜 **Histórico de conversas** com navegação intuitiva
- 🎭 **Renderização Markdown** para respostas formatadas
- ⚡ **Performance otimizada** com TypeScript
- 🧪 **Cobertura de testes** com Jest

## ✨ Funcionalidades

### Interface Interativa
- **Input Box Fixo**: Campo de entrada sempre visível na parte inferior
- **Navegação por Setas**: 
  - ↑/↓ para navegar no histórico de comandos
  - ←/→ para mover o cursor na linha
- **Loading Animado**: Indicador visual enquanto aguarda resposta
- **Timeline de Mensagens**: Histórico formatado e colorido

### Sistema de Temas
10 temas profissionais disponíveis:
- 🌑 **Dark** (padrão) - Tema escuro clássico
- ☀️ **Light** - Tema claro para ambientes iluminados
- 🎨 **Monokai** - Inspirado no editor Sublime Text
- 🧛 **Dracula** - Tema popular dark com cores vibrantes
- 🌅 **Solarized** - Paleta de cores cientificamente projetada
- ❄️ **Nord** - Tema ártico, limpo e elegante
- 🍂 **Gruvbox** - Cores retrô e aconchegantes
- 🌃 **Tokyo Night** - Tema noturno moderno
- 🌈 **Synthwave** - Estilo anos 80 neon
- 💾 **Cyberpunk** - Futurista com cores neon

### Modelos de IA
- **Mistral Large**: Modelo mais poderoso com 256k tokens de contexto
- **DeepSeek R1**: Modelo otimizado para raciocínio
- **Gemini**: Modelo multimodal do Google
- Seleção dinâmica baseada na disponibilidade da API

## 📦 Instalação

### Pré-requisitos
- Node.js >= 14.0.0
- npm ou yarn

### Instalação Global

```bash
# Clone o repositório
git clone https://github.com/fera765/flui-cli.git
cd flui-cli

# Instale as dependências
npm install

# Compile o projeto
npm run build

# Execute
npm start
```

### Instalação como Pacote NPM (futuro)

```bash
npm install -g flui-cli
# ou
yarn global add flui-cli
```

## 🚀 Uso

### Iniciando o Chat

```bash
# Após instalação
npm start

# Ou se instalado globalmente (futuro)
flui
```

### Interface Principal

```
┌─────────────────────────────────────────┐
│  Flui CLI - Chat Interativo com IA      │
├─────────────────────────────────────────┤
│                                         │
│  > Olá! Como posso ajudar?              │
│                                         │
│  Claro! Estou aqui para ajudar com     │
│  qualquer dúvida que você tenha.       │
│                                         │
├─────────────────────────────────────────┤
│  Digite sua mensagem...                 │
└─────────────────────────────────────────┘
```

## 📝 Comandos

### Comandos do Sistema

| Comando | Descrição | Exemplo |
|---------|-----------|---------|
| `/theme` | Lista todos os temas disponíveis | `/theme` |
| `/theme [nome]` | Altera o tema atual | `/theme dracula` |
| `/model` | Lista modelos de IA disponíveis | `/model` |
| `/model [número]` | Seleciona um modelo específico | `/model 1` |
| `/clear` | Limpa o histórico de conversas | `/clear` |
| `/help` | Exibe ajuda e comandos disponíveis | `/help` |
| `/exit` | Encerra a aplicação | `/exit` |

### Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `↑` | Comando anterior do histórico |
| `↓` | Próximo comando do histórico |
| `←` | Move cursor para esquerda |
| `→` | Move cursor para direita |
| `Ctrl+C` | Cancela entrada atual |
| `Ctrl+D` | Sai da aplicação |
| `Enter` | Envia mensagem |

## 🎨 Sistema de Temas

### Mudando o Tema

```bash
# Listar temas disponíveis
/theme

# Mudar para tema específico
/theme synthwave
```

### Estrutura de um Tema

```typescript
interface Theme {
  name: string;
  primary: string;      // Cor principal
  secondary: string;    // Cor secundária
  accent: string;       // Cor de destaque
  background: string;   // Cor de fundo
  text: string;        // Cor do texto
  error: string;       // Cor de erro
  success: string;     // Cor de sucesso
  warning: string;     // Cor de aviso
  info: string;        // Cor de informação
  muted: string;       // Cor suave
}
```

## 🏗️ Arquitetura

### Estrutura do Projeto

```
flui-cli/
├── src/
│   ├── __tests__/              # Testes unitários
│   ├── __mocks__/              # Mocks para testes
│   ├── services/               # Serviços da aplicação
│   │   ├── apiService.ts       # Comunicação com API
│   │   ├── modelManager.ts     # Gerenciamento de modelos
│   │   └── settingsManager.ts  # Configurações persistentes
│   ├── ui/                     # Componentes de interface
│   │   ├── chatUI.ts           # Interface principal
│   │   ├── inputBox.ts         # Campo de entrada
│   │   ├── messageTimeline.ts  # Timeline de mensagens
│   │   ├── themeManager.ts     # Sistema de temas
│   │   ├── markdownRenderer.ts # Renderização Markdown
│   │   └── ...                 # Outros componentes UI
│   ├── chatApp.ts              # Aplicação principal
│   └── index.ts                # Ponto de entrada
├── dist/                       # Código compilado
├── package.json                # Dependências e scripts
├── tsconfig.json              # Configuração TypeScript
└── jest.config.js             # Configuração de testes
```

### Componentes Principais

#### ApiService
Responsável pela comunicação com a API llm7.io:
- Busca de modelos disponíveis
- Envio de mensagens
- Gerenciamento de respostas

#### ModelManager
Gerencia os modelos de IA:
- Lista modelos disponíveis
- Seleção de modelo
- Informações de contexto

#### ThemeManager
Sistema completo de temas:
- 10 temas pré-configurados
- Mudança dinâmica de cores
- Persistência de preferências

#### ChatUI
Interface principal do usuário:
- Renderização de mensagens
- Controle de input
- Aplicação de temas

## 🛠️ Desenvolvimento

### Configuração do Ambiente

```bash
# Clone o repositório
git clone https://github.com/fera765/flui-cli.git
cd flui-cli

# Instale as dependências
npm install

# Modo desenvolvimento
npm run dev
```

### Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| `build` | `npm run build` | Compila TypeScript para JavaScript |
| `start` | `npm start` | Executa a versão compilada |
| `dev` | `npm run dev` | Executa em modo desenvolvimento |
| `test` | `npm test` | Executa todos os testes |
| `test:watch` | `npm run test:watch` | Testes em modo watch |
| `test:coverage` | `npm run test:coverage` | Gera relatório de cobertura |
| `clean` | `npm run clean` | Limpa arquivos compilados |
| `rebuild` | `npm run rebuild` | Limpa e recompila |

### Tecnologias Utilizadas

- **TypeScript** 5.3.3 - Linguagem principal
- **Node.js** - Runtime JavaScript
- **Axios** - Cliente HTTP
- **Chalk** 4.1.2 - Estilização de terminal
- **Inquirer** 8.2.6 - Prompts interativos
- **Marked** 4.3.0 - Renderização Markdown
- **Ora** 5.4.1 - Spinners de loading
- **Jest** 29.5.0 - Framework de testes

## 🧪 Testes

### Executando Testes

```bash
# Todos os testes
npm test

# Modo watch
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Estrutura de Testes

```
src/__tests__/
├── apiService.test.ts      # Testes do serviço de API
├── chatApp.test.ts         # Testes da aplicação principal
├── chatUI.test.ts          # Testes da interface
├── inputBox.test.ts        # Testes do input
├── messageTimeline.test.ts # Testes da timeline
├── modelManager.test.ts    # Testes do gerenciador de modelos
└── themeManager.test.ts    # Testes do sistema de temas
```

### Cobertura de Testes

- ✅ 82 testes totais
- ✅ 66 testes passando
- ✅ Cobertura TDD em componentes novos
- ✅ Mocks configurados para dependências externas

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estas etapas:

1. **Fork** o projeto
2. Crie uma **branch** para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. Abra um **Pull Request**

### Diretrizes de Contribuição

- Mantenha o código em TypeScript
- Adicione testes para novas funcionalidades
- Siga o padrão de código existente
- Atualize a documentação conforme necessário
- Teste localmente antes de submeter PR

## 📄 Licença

Este projeto está sob a licença ISC. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Autores

- **Seu Nome** - *Desenvolvimento inicial* - [fera765](https://github.com/fera765)

## 🙏 Agradecimentos

- API llm7.io por fornecer acesso aos modelos
- Comunidade open source pelas bibliotecas utilizadas
- Todos os contribuidores do projeto

## 📞 Suporte

Para suporte, abra uma issue no [GitHub Issues](https://github.com/fera765/flui-cli/issues).

## 🔮 Roadmap

### Versão 1.1.0 (Planejado)
- [ ] Suporte a streaming de respostas
- [ ] Exportação de conversas
- [ ] Plugins customizáveis
- [ ] Modo offline com cache

### Versão 1.2.0 (Futuro)
- [ ] Interface web complementar
- [ ] Suporte a múltiplas sessões
- [ ] Integração com mais APIs de LLM
- [ ] Comandos personalizáveis

---

<div align="center">

**Desenvolvido com ❤️ para a comunidade**

[⬆ Voltar ao topo](#-flui-cli)

</div>
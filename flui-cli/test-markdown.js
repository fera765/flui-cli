// Test markdown renderer
const mt = require('marked-terminal');
const { marked } = require('marked');

console.log('Testing marked-terminal...');
console.log('Type of markedTerminal:', typeof mt.markedTerminal);

// Setup marked with terminal renderer
marked.use(mt.markedTerminal());

// Test markdown
const markdown = `
# Hello World

This is **bold** and this is *italic*.

\`\`\`javascript
console.log('Hello');
\`\`\`

- Item 1
- Item 2
`;

console.log('\nRendered output:');
console.log(marked(markdown));
console.log('\n✅ Markdown rendering works!');
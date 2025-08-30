const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Backend gerado pelo Flui Autonomous está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  res.json({
    success: true,
    token: 'jwt-token-example',
    user: { id: 1, email }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  res.status(201).json({
    success: true,
    message: 'Usuário registrado com sucesso',
    user: { id: Date.now(), email, name }
  });
});

// User profile
app.get('/api/profile', (req, res) => {
  res.json({
    id: 1,
    name: 'Usuário Teste',
    email: 'user@example.com',
    plan: 'Premium',
    createdAt: new Date().toISOString()
  });
});

app.put('/api/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Perfil atualizado',
    data: req.body
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Flui Backend API',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/profile',
      'PUT /api/profile'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando na porta ${PORT}`);
  console.log(`📍 Endpoints disponíveis em http://localhost:${PORT}`);
});
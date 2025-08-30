const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/plans', (req, res) => {
  res.json([
    { id: 1, name: 'Básico', price: 199.90 },
    { id: 2, name: 'Premium', price: 399.90 },
    { id: 3, name: 'Empresarial', price: 299.90 }
  ]);
});

app.post('/api/contact', (req, res) => {
  res.json({ success: true, message: 'Contato recebido' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
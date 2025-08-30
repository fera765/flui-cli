import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.get('/api/v1/users', (req, res) => {
  res.json({ success: true, data: [] });
});

app.post('/api/v1/users', (req, res) => {
  res.status(201).json({ success: true, data: req.body });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
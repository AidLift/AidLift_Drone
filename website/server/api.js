// server/api.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));


app.post('/hospitals', (req, res) => {
  const { hospitals } = req.body;

  if (!hospitals || !Array.isArray(hospitals)) {
    return res.status(400).json({ error: 'Invalid hospital data' });
  }

  console.log('Received hospitals:', hospitals);

  res.status(200).json({ message: 'Hospitals received successfully', count: hospitals.length });
});

app.post('/chat', async (req, res) => {
  const { message } = req.body;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }]
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'OpenAI request failed' });
  }
});


app.get('/test', (req, res) => {
    res.json({ message: 'Connection successful!' });
});


app.listen(5000, () => {
  console.log('API server listening on port 5000');
});

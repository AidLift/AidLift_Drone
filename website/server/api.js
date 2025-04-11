// server/api.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import helmet from 'helmet'
import path from 'path';
import { fileURLToPath } from 'url';
// import fetch from 'node-fetch'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
// app.use(helmet());
  
// app.use((req, res, next) => {
//   res.setHeader("Content-Security-Policy", 
//     "default-src 'self'; " + 
//     "script-src 'self' https://unpkg.com; " + 
//     "style-src 'self' 'unsafe-inline' https://unpkg.com; " + 
//     "img-src 'self' http://localhost:5173; " +
//     "connect-src 'self';"
//   );
//   next();
// });

// app.use(express.static(path.join(__dirname, '../client/public')));
// app.use(express.static(path.join(__dirname, '../client/dist')));
  
  
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

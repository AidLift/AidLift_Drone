// server/api.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(path.join(__dirname, 'dist')));
// app.use(express.static(path.join(__dirname, 'client', 'dist')));




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


const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.post('/upload-media', (req, res) => {
  console.log('IN')
  const boundary = req.headers['content-type'].split('boundary=')[1];

  let rawData = Buffer.alloc(0);

  req.on('data', chunk => {
    rawData = Buffer.concat([rawData, chunk]);
  });

  req.on('end', () => {
    const parts = rawData.toString().split(`--${boundary}`);
    const filePart = parts.find(part => part.includes('filename='));

    if (!filePart) {
      return res.status(400).send('No file found in the request.');
    }

    // Extract filename and file content
    const matchFilename = filePart.match(/filename="(.+?)"/);
    const filename = matchFilename ? matchFilename[1] : `file-${Date.now()}`;
    const startOfContent = filePart.indexOf('\r\n\r\n') + 4;
    const fileContent = filePart.slice(startOfContent, filePart.lastIndexOf('\r\n'));

    const filePath = path.join(__dirname, 'uploads', filename);
    fs.writeFileSync(filePath, fileContent, 'binary');

    res.send('File uploaded successfully (no multer)! 🧠🔥');
  });
});


app.listen(5000, () => {
  console.log('API server listening on port 5000');
});

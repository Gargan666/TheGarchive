import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // allow any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

app.get('/', (req, res) => {
  res.send('CountAPI proxy server is running.');
});

app.get('/countapi/:action/:key', async (req, res) => {
  const { action, key } = req.params;
  const url = `https://api.countapi.xyz/${action}/THEGARCHIVE/${encodeURIComponent(key)}`;

  try {
    const response = await fetch(url);
    const text = await response.text(); // get raw text first

    // Try parsing JSON
    try {
      const data = JSON.parse(text);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(data));
    } catch (err) {
      console.error("CountAPI did not return valid JSON:", text);
      res.status(500).json({ error: "CountAPI response invalid JSON", raw: text });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`CountAPI proxy running on http://localhost:${PORT}`));

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Proxy route to handle HTTP and HTTPS streaming URLs
app.get('/proxy', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send('Error: No target URL provided.');
  }

  console.log(`Proxying: ${targetUrl}`);

  try {
    const response = await axios.get(targetUrl, {
      responseType: 'stream', // Stream response for live playback
      timeout: 15000, // 15 seconds timeout to prevent hang-ups
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Connection: 'keep-alive',
      },
    });

    res.set({
      ...response.headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    });

    response.data.pipe(res); // Stream data to client
  } catch (error) {
    console.error('Proxy Error:', error.message);

    if (error.code === 'ECONNRESET') {
      res.status(500).send('Error: Connection was reset by the target server.');
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).send('Error: Target server took too long to respond.');
    } else {
      res.status(500).send(`Proxy error: ${error.message}`);
    }
  }
});

// Route to render the homepage
app.get('/', (req, res) => {
  res.render('index');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const express = require('express');
const http = require('http');
const https = require('https');
const axios = require('axios');
const path = require('path');

const app = express();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Proxy endpoint to handle M3U8 streaming
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    
    if (!targetUrl) {
        return res.status(400).send("Error: No target URL provided.");
    }

    console.log(`Proxying: ${targetUrl}`);

    try {
        const response = await axios.get(targetUrl, {
            responseType: 'stream',
            timeout: 15000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                "Connection": "keep-alive",
            },
            httpAgent: targetUrl.startsWith("https") ? new https.Agent({ keepAlive: true }) : new http.Agent({ keepAlive: true }),
        });

        res.set({
            ...response.headers,
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        });

        response.data.pipe(res);
    } catch (error) {
        console.error("Proxy Error:", error.message);
        res.status(500).send(`Proxy error: ${error.message}`);
    }
});

// Home route
app.get('/', (req, res) => {
    res.render('index');
});

// Export the app for Vercel
module.exports = app;

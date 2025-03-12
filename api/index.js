const express = require("express");
const http = require("http");
const https = require("https");
const axios = require("axios");
const path = require("path");
const { URL } = require("url");

const app = express();

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

app.use(express.static(path.join(__dirname, "../public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send("Error: No target URL provided.");
    }
  
    console.log(`Proxying: ${targetUrl}`);
  
    try {
      const parsedUrl = new URL(targetUrl);
      const referer = `${parsedUrl.protocol}//${parsedUrl.hostname}/`;
  
      const response = await axios.get(targetUrl, {
        responseType: "text",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: referer,
          Connection: "keep-alive",
        },
        httpAgent: targetUrl.startsWith("https") ? httpsAgent : httpAgent
      });
  
      if (targetUrl.endsWith(".m3u8")) {
        let modifiedM3U8 = response.data.replace(
          /(https?:\/\/[^ \n]+)/g,
          (match) => {
            return `/proxy?url=${encodeURIComponent(match)}`;
          }
        );
  
        res.set({
          "Content-Type": "application/vnd.apple.mpegurl",
          "Access-Control-Allow-Origin": "*",
        });
  
        return res.send(modifiedM3U8);
      }
  
      res.set({
        ...response.headers,
        "Access-Control-Allow-Origin": "*",
      });
  
      response.data.pipe(res);
    } catch (error) {
      console.error("Proxy Error:", error.message);
      res.status(500).send(`Proxy error: ${error.message}`);
    }
  });

// Home route
app.get("/", (req, res) => {
  res.render("index");
});

// Export the app for Vercel
module.exports = app;

// Add Express
const path = require('path');
const express = require("express");
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
let initialized = null;
const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ],
  },
  authStrategy: new LocalAuth()
});

// Initialize Express
const app = express();
// Create GET request
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'), {
    root: __dirname
  });
});

app.get("/initialize", async (req, res) => {
  const setHeaderSSE = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  }
  
  res.set(setHeaderSSE);

  initialized = initialized || await client.initialize().catch(_ => _);

  res.write(`data: ${JSON.stringify({
    "event": "INTIALIZED",
  })}\n\n`);

  client.on('qr', async (qr) => {
    res.write(`data: ${JSON.stringify({
      "event": "QR",
      "qr": await QRCode.toDataURL(qr)
    })}\n\n`);
  });

  client.on('ready', async () => {
    res.write(`data: ${JSON.stringify({
      "event": "READY",
    })}\n\n`);
  });

  client.on('authenticated', async () => {
    res.write(`data: ${JSON.stringify({
      "event": "AUTHENTICATED",
    })}\n\n`);
  });

  client.on('message', async msg  => {
    res.write(`data: ${JSON.stringify({
      "event": "MESSAGE",
      "body": msg.body
    })}\n\n`);
  });

  client.on('disconnected', async (reason) => {
    res.write(`data: ${JSON.stringify({
      "event": "DISCONNECTED",
      "body": msg.body
    })}\n\n`);
    client.destroy().catch(_ => _);
    initialized = await client.initialize().catch(_ => _);
  });
});
// Initialize server
app.listen(5000, () => {
  console.log("Running on port 5000.");
});

module.exports = app
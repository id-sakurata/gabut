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
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Whatsapp API by Ngekoding</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <!-- This parts is optional, just for improve the styles -->
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap" rel="stylesheet">
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: 'Montserrat', sans-serif;
        padding: 20px;
      }
      #app {
        max-width: 500px;
        margin: 20px auto;
      }
      #qrcode {
        display: none; /* Showed when qr code received */
        width: 100%;
        margin: 10px 0;
        border: 1px solid #efefef;
        border-radius: 4px;
      }
      ul.logs {
        max-height: 150px;
        padding: 15px 15px 15px 30px;
        margin-top: 5px;
        border-radius: 4px;
        overflow-y: auto;
        background: #efefef;
        color: #666;
        font-size: 14px;
      }
      ul.logs li:first-child {
        color: green;
      }
    </style>
  </head>
  <body>

    <div id="app">
      <h1>Whatsapp API</h1>
      <p>Powered by ME</p>
      <img src="" alt="QR Code" id="qrcode">
      <h3>Logs:</h3>
      <ul class="logs"></ul>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js" crossorigin="anonymous"></script>
    <script>
      $(document).ready(function() {
        var source = new EventSource('/initialize');
        source.onmessage = function (event) {
          try {
            const data = JSON.parse(event.data);
            $('.logs').prepend($('<li>').text(data.event));
            switch (data.event) {
              case 'QR':
                $("#qrcode").prop('src', data.qr).show();
                break;

              case 'ready':
                $("#qrcode").hide().prop('src', "");
                break;
            }
          } catch (error) {
            console.log(error);
            console.log(event);
          }
        }
      });
    </script>
  </body>
  </html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
  res.end(html);
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
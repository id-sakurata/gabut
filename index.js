// Add Express
const express = require("express");
// Add Whatsapp-web.js
const { Client } = require('whatsapp-web.js');

const client = new Client();

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize()

// Initialize Express
const app = express();
// Create GET request
app.get("/", (req, res) => {
  res.send("Express on Vercel");
});
// Initialize server
app.listen(5000, () => {
  console.log("Running on port 5000.");
});

module.exports = app
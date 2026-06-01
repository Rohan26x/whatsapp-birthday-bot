/**
 * WhatsApp Birthday Bot
 * =====================
 * Main entry point. Initializes the WhatsApp client,
 * handles QR code auth, and wires up command handling
 * and the birthday checker cron job.
 *
 * Usage:
 *   node index.js
 *
 * First run: scan the QR code with WhatsApp.
 * Subsequent runs: session is restored automatically.
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const config = require('./config');
const { handleMessage } = require('./handlers/commandHandler');
const { startBirthdayChecker } = require('./handlers/birthdayChecker');
const excelService = require('./services/excelService');

// ─── Express Server (Keep-Alive & QR Display) ───────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

let qrDataURL = null;
let isAuthenticated = false;

app.get('/', (req, res) => {
  if (isAuthenticated) {
    res.send('<h3>🤖 WhatsApp Birthday Bot is running and connected!</h3><p>UptimeRobot can safely ping this page.</p>');
  } else if (qrDataURL) {
    res.send(`
      <h3>📱 Scan this QR Code with WhatsApp</h3>
      <img src="${qrDataURL}" alt="WhatsApp QR Code" style="width:300px;height:300px;border:1px solid #ccc;padding:10px;border-radius:10px;"/>
      <p>Once scanned, the bot will log in and this page will update on refresh.</p>
    `);
  } else {
    res.send('<h3>⏳ Starting bot and generating QR Code...</h3><p>Please refresh this page in a few seconds.</p>');
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Web server is listening on port ${PORT}`);
});

// ─── Banner ─────────────────────────────────────────────────────────
console.log('');
console.log('  🎂 ═══════════════════════════════════════');
console.log('  🎂  WhatsApp Birthday Bot v1.0.0');
console.log('  🎂 ═══════════════════════════════════════');
console.log('');

// ─── Create sample template on first run ────────────────────────────
try {
  const fs = require('fs');
  const path = require('path');
  const templatePath = path.resolve(config.TEMPLATE_FILE);
  if (!fs.existsSync(templatePath)) {
    excelService.createTemplate(templatePath);
  }
} catch (err) {
  console.warn('⚠️ Could not create sample template:', err.message);
}

// ─── Initialize WhatsApp Client ─────────────────────────────────────
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './data' }), // Save session in ./data for Render persistent disk
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--disable-gpu',
    ],
  },
});

// ─── QR Code Event ──────────────────────────────────────────────────
client.on('qr', async (qr) => {
  console.log('');
  console.log("📱 QR code generated! Open your bot's web address to scan it.");
  console.log('   (e.g., http://localhost:3000 or your Render URL)');
  console.log('');
  
  try {
    const qrcodeLib = require('qrcode');
    qrDataURL = await qrcodeLib.toDataURL(qr);
  } catch (err) {
    console.error('Failed to generate QR image:', err);
  }
  
  // Also print to terminal as a backup
  qrcode.generate(qr, { small: true });
});

// ─── Authentication Events ──────────────────────────────────────────
client.on('authenticated', () => {
  console.log('✅ Authentication successful!');
  isAuthenticated = true;
  qrDataURL = null;
});

client.on('auth_failure', (msg) => {
  console.error('❌ Authentication failed:', msg);
  console.error('   Try deleting the ./data folder and restart.');
  isAuthenticated = false;
});

// ─── Ready Event ────────────────────────────────────────────────────
client.on('ready', () => {
  console.log('');
  console.log('🟢 Bot is READY and connected to WhatsApp!');
  console.log('');

  // Display configuration
  if (config.TARGET_GROUP_ID === 'YOUR_GROUP_ID@g.us') {
    console.log('⚠️  GROUP ID NOT SET!');
    console.log('   Send any message in your target group.');
    console.log('   The Group ID will appear in the logs below.');
    console.log('   Then update TARGET_GROUP_ID in config.js and restart.');
    console.log('');
  } else {
    console.log(`📍 Target Group: ${config.TARGET_GROUP_ID}`);
  }

  console.log(`⏰ Wish Schedule: ${config.WISH_CRON}`);
  console.log(`🔤 Command Prefix: ${config.COMMAND_PREFIX}`);
  console.log('');
  console.log('💡 Send !help in the group to see all commands.');
  console.log('───────────────────────────────────────────────');
  console.log('');

  // Start the birthday checker cron job
  startBirthdayChecker(client);
});

// ─── Message Event ──────────────────────────────────────────────────
client.on('message', async (msg) => {
  try {
    const chat = await msg.getChat();

    // Log group messages to help find Group IDs
    if (chat.isGroup) {
      // Only log if group ID is not yet configured (to help user find it)
      if (config.TARGET_GROUP_ID === 'YOUR_GROUP_ID@g.us') {
        console.log(`📨 Group: "${chat.name}" | ID: ${chat.id._serialized}`);
      }
    }

    // Route to command handler
    await handleMessage(msg, client);
  } catch (err) {
    console.error('Error processing message:', err.message);
  }
});

// Handle messages sent by the bot itself (for detecting Excel file sends)
client.on('message_create', async (msg) => {
  // Only process messages from others (not the bot itself)
  if (msg.fromMe) return;

  // This event fires alongside 'message', so we let 'message' handle it
});

// ─── Disconnection Handling ─────────────────────────────────────────
client.on('disconnected', (reason) => {
  console.log('');
  console.log('🔴 Bot disconnected:', reason);
  console.log('   Attempting to reconnect...');
  console.log('');
  isAuthenticated = false;
  client.initialize();
});

// ─── Graceful Shutdown ──────────────────────────────────────────────
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await client.destroy();
  process.exit(0);
});

// ─── Start the Client ───────────────────────────────────────────────
console.log('🔄 Initializing WhatsApp client...');
console.log('   (This may take a moment on first run)');
console.log('');
client.initialize();

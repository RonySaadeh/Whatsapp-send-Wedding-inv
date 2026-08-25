const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

let isReady = false;
let lastQr = null;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: '.wwebjs_auth' }),
  puppeteer: {
    headless: true,
  },
});

client.on('qr', (qr) => {
  lastQr = qr;
  isReady = false;
  console.log('\nScan this QR code with WhatsApp on your phone (Linked Devices > Link a Device):\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  isReady = true;
  lastQr = null;
  console.log('WhatsApp client is ready. You can now send invitations from the web page.');
});

client.on('auth_failure', (msg) => {
  isReady = false;
  console.error('Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.error('WhatsApp client disconnected:', reason);
});

client.initialize();

function getStatus() {
  return { ready: isReady, hasQr: !!lastQr };
}

function toChatId(rawPhone) {
  const digits = String(rawPhone).replace(/[^0-9]/g, '');
  return `${digits}@c.us`;
}

async function sendMessage(rawPhone, text) {
  const chatId = toChatId(rawPhone);
  const numberId = await client.getNumberId(chatId);
  if (!numberId) {
    throw new Error(`Number ${rawPhone} is not registered on WhatsApp`);
  }
  await client.sendMessage(numberId._serialized, text);
}

module.exports = { client, getStatus, sendMessage };

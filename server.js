const fs = require('fs');
const path = require('path');
const express = require('express');
const { getStatus, sendMessage } = require('./whatsapp');

const PORT = process.env.PORT || 3000;
const CONTACTS_FILE = path.join(__dirname, 'contacts.csv');
const TEMPLATE_FILE = path.join(__dirname, 'message-template.txt');

// Delay between messages so WhatsApp doesn't flag the account for
// sending too many messages too fast. Randomized within a range.
const MIN_DELAY_MS = 4000;
const MAX_DELAY_MS = 8000;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  return MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
}

function loadTemplate() {
  return fs.readFileSync(TEMPLATE_FILE, 'utf8');
}

// Simple CSV parser for the "Name,Phone" format used by contacts.csv.
function loadContacts() {
  const raw = fs.readFileSync(CONTACTS_FILE, 'utf8');
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const [header, ...rows] = lines;
  const columns = header.split(',').map((c) => c.trim().toLowerCase());
  const nameIdx = columns.indexOf('name');
  const phoneIdx = columns.indexOf('phone');

  if (nameIdx === -1 || phoneIdx === -1) {
    throw new Error('contacts.csv must have "Name" and "Phone" columns');
  }

  return rows.map((row) => {
    const cells = row.split(',');
    return {
      name: cells[nameIdx].trim(),
      phone: cells[phoneIdx].trim(),
    };
  });
}

function renderMessage(template, name) {
  return template.replace(/\{\{\s*Name\s*\}\}/g, name);
}

app.get('/status', (req, res) => {
  res.json(getStatus());
});

app.get('/template', (req, res) => {
  try {
    res.json({ template: loadTemplate() });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/preview', (req, res) => {
  try {
    const template = loadTemplate();
    const contacts = loadContacts();
    res.json({
      contacts,
      sample: contacts[0] ? renderMessage(template, contacts[0].name) : renderMessage(template, 'Example Name'),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.use(express.json());

app.post('/send-one', async (req, res) => {
  const status = getStatus();
  if (!status.ready) {
    res.status(409).json({ error: 'WhatsApp is not connected yet. Scan the QR code in the terminal first.' });
    return;
  }

  const { name, phone, message } = req.body || {};

  if (!phone || !String(phone).trim()) {
    res.status(400).json({ error: 'Phone number is required.' });
    return;
  }
  if (!message || !String(message).trim()) {
    res.status(400).json({ error: 'Message is required.' });
    return;
  }

  const rendered = renderMessage(message, name || '');

  try {
    await sendMessage(phone, rendered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/send', async (req, res) => {
  const status = getStatus();
  if (!status.ready) {
    res.status(409).json({ error: 'WhatsApp is not connected yet. Scan the QR code in the terminal first.' });
    return;
  }

  let template;
  let contacts;
  try {
    template = loadTemplate();
    contacts = loadContacts();
  } catch (err) {
    res.status(400).json({ error: err.message });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
  });

  res.write(`Starting send to ${contacts.length} contact(s)...\n`);

  for (let i = 0; i < contacts.length; i += 1) {
    const { name, phone } = contacts[i];
    const message = renderMessage(template, name);
    try {
      await sendMessage(phone, message);
      res.write(`[${i + 1}/${contacts.length}] Sent to ${name} (${phone})\n`);
    } catch (err) {
      res.write(`[${i + 1}/${contacts.length}] FAILED for ${name} (${phone}): ${err.message}\n`);
    }

    if (i < contacts.length - 1) {
      await sleep(randomDelay());
    }
  }

  res.write('Done.\n');
  res.end();
});

app.listen(PORT, () => {
  console.log(`Open http://localhost:${PORT} in your browser.`);
});

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const sendBtn = document.getElementById('sendBtn');
const preview = document.getElementById('preview');
const count = document.getElementById('count');
const log = document.getElementById('log');

let isReady = false;

async function refreshStatus() {
  try {
    const res = await fetch('/status');
    const data = await res.json();
    isReady = data.ready;
    if (data.ready) {
      statusDot.classList.add('ready');
      statusText.textContent = 'Connected to WhatsApp';
      sendBtn.disabled = false;
    } else if (data.hasQr) {
      statusDot.classList.remove('ready');
      statusText.textContent = 'Scan the QR code shown in the terminal';
      sendBtn.disabled = true;
    } else {
      statusDot.classList.remove('ready');
      statusText.textContent = 'Starting WhatsApp session…';
      sendBtn.disabled = true;
    }
  } catch (err) {
    statusText.textContent = 'Cannot reach server';
  }
}

async function loadPreview() {
  try {
    const res = await fetch('/preview');
    const data = await res.json();
    if (data.error) {
      preview.textContent = `Error: ${data.error}`;
      return;
    }
    preview.textContent = data.sample;
    count.textContent = `${data.contacts.length} recipient(s) in contacts.csv`;
  } catch (err) {
    preview.textContent = 'Could not load preview.';
  }
}

sendBtn.addEventListener('click', async () => {
  if (!isReady) return;
  const confirmed = confirm('This will send the wedding invitation to every contact in contacts.csv. Continue?');
  if (!confirmed) return;

  sendBtn.disabled = true;
  log.style.display = 'block';
  log.textContent = '';

  try {
    const res = await fetch('/send', { method: 'POST' });
    if (!res.body) {
      log.textContent += 'Streaming not supported by this browser.\n';
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      log.textContent += decoder.decode(value, { stream: true });
      log.scrollTop = log.scrollHeight;
    }
  } catch (err) {
    log.textContent += `\nError: ${err.message}\n`;
  } finally {
    sendBtn.disabled = !isReady;
  }
});

refreshStatus();
loadPreview();
setInterval(refreshStatus, 3000);

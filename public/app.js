const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const sendBtn = document.getElementById('sendBtn');
const preview = document.getElementById('preview');
const count = document.getElementById('count');
const log = document.getElementById('log');

const oneName = document.getElementById('oneName');
const onePhone = document.getElementById('onePhone');
const oneMessage = document.getElementById('oneMessage');
const oneSendBtn = document.getElementById('oneSendBtn');
const oneResult = document.getElementById('oneResult');

let isReady = false;
let templateLoaded = false;

async function refreshStatus() {
  try {
    const res = await fetch('/status');
    const data = await res.json();
    isReady = data.ready;
    if (data.ready) {
      statusDot.classList.add('ready');
      statusText.textContent = data.connectedNumber
        ? `Connected as +${data.connectedNumber}`
        : 'Connected to WhatsApp';
      sendBtn.disabled = false;
      oneSendBtn.disabled = false;
    } else if (data.hasQr) {
      statusDot.classList.remove('ready');
      statusText.textContent = 'Scan the QR code shown in the terminal';
      sendBtn.disabled = true;
      oneSendBtn.disabled = true;
    } else {
      statusDot.classList.remove('ready');
      statusText.textContent = 'Starting WhatsApp session…';
      sendBtn.disabled = true;
      oneSendBtn.disabled = true;
    }
  } catch (err) {
    statusText.textContent = 'Cannot reach server';
  }
}

async function loadDefaultTemplate() {
  if (templateLoaded) return;
  try {
    const res = await fetch('/template');
    const data = await res.json();
    if (data.template) {
      oneMessage.value = data.template;
      templateLoaded = true;
    }
  } catch (err) {
    // no default template available, leave the textarea empty
  }
}

oneSendBtn.addEventListener('click', async () => {
  if (!isReady) return;

  const name = oneName.value.trim();
  const phone = onePhone.value.trim();
  const message = oneMessage.value.trim();

  oneResult.className = '';
  oneResult.textContent = '';

  if (!phone) {
    oneResult.className = 'err';
    oneResult.textContent = 'Enter a phone number.';
    return;
  }
  if (!message) {
    oneResult.className = 'err';
    oneResult.textContent = 'Enter a message.';
    return;
  }

  oneSendBtn.disabled = true;
  oneResult.textContent = 'Sending…';

  try {
    const res = await fetch('/send-one', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, message }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send.');
    }
    oneResult.className = 'ok';
    oneResult.textContent = `Sent to ${name || phone}.`;
  } catch (err) {
    oneResult.className = 'err';
    oneResult.textContent = err.message;
  } finally {
    oneSendBtn.disabled = !isReady;
  }
});

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
loadDefaultTemplate();
setInterval(refreshStatus, 3000);

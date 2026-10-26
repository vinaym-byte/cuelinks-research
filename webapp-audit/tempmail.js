// Minimal mail.tm client: disposable inbox for test signups.
const API = 'https://api.mail.tm';

async function call(path, { token, ...opts } = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
  });
  if (!res.ok) throw new Error(`mail.tm ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function createInbox() {
  const { 'hydra:member': domains } = await call('/domains');
  const address = `qacl${Date.now().toString(36)}@${domains[0].domain}`;
  const password = 'Qa' + Math.random().toString(36).slice(2) + '7';
  await call('/accounts', { method: 'POST', body: JSON.stringify({ address, password }) });
  // New accounts can take a few seconds before they accept a login
  for (let attempt = 1; ; attempt++) {
    try {
      const { token } = await call('/token', { method: 'POST', body: JSON.stringify({ address, password }) });
      return { address, token };
    } catch (e) {
      if (attempt === 5) throw e;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

// Polls until a message arrives (or timeout); returns full messages with text/html.
async function waitForMail(token, { timeoutMs = 120000, seen = new Set() } = {}) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    const { 'hydra:member': list } = await call('/messages', { token });
    const fresh = list.filter(m => !seen.has(m.id));
    if (fresh.length) return Promise.all(fresh.map(m => (seen.add(m.id), call(`/messages/${m.id}`, { token }))));
    await new Promise(r => setTimeout(r, 5000));
  }
  return [];
}

module.exports = { createInbox, waitForMail };

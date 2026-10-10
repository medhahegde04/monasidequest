const crypto = require('crypto');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  if (!process.env.ADMIN_PASSPHRASE) {
    return res.status(500).json({ error: 'Server not configured (missing env vars).' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};

    if (!safeEqual(body.passphrase || '', process.env.ADMIN_PASSPHRASE)) {
    await sleep(1500);
    return res.status(401).json({ error: 'Wrong passphrase.' });
  }

  return res.status(200).json({ ok: true });
};
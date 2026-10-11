const { checkAuth } = require('./_authenticate');
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;


function clean(s, max) {
  return String(s == null ? '' : s)
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}


function sniffImage(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}


module.exports = async (req, res) => {
  const body = await checkAuth(req, res);
  if (!body) return;

  const title = clean(body.title, 80);
  const tag = clean(body.tag, 30) || 'note';
  const caption = clean(body.caption, 600);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date || '')
    ? body.date
    : new Date().toISOString().slice(0, 10);
  const commitMessage = clean(body.commitMessage, 200) || `add: ${title}`;

  if (!title) {
    return res.status(400).json({ error: 'A title is required.' });
  }

  let imageKind = null;
  let imageBytes = 0;
  
  if (body.imageBase64) {
    const buf = Buffer.from(String(body.imageBase64), 'base64');

    if (buf.length > MAX_IMAGE_BYTES) {
        return res.status(413).json({ error: 'Image too large (max 3 MB).' });
    }

    imageKind = sniffImage(buf);

    if (!imageKind) {
        return res.status(400).json({ error: 'Unsupported image type (use JPG, PNG or WebP).' });
    }

    imageBytes = buf.length;
  } 
  else if (!caption) {
    return res.status(400).json({ error: 'Add an image or write a note/caption.' });
  }

  return res.status(200).json({
    ok: true,
    dryRun: true,
    entry: { title, tag, caption, date },
    imageKind,
    imageBytes,
    commitMessage,
  });
};
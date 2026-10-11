const { checkAuth } = require('./_authenticate');
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const REPO = process.env.GITHUB_REPO || 'medhahegde04/monasidequest';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const DATA_PATH = 'creative-data.js';
const IMG_DIR = 'creative';


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


async function gh(path, opts = {}) {
  const r = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'monasidequest-studio',
    },
  });

  const text = await r.text();
  let data;

  try {
    data = JSON.parse(text);
  }
  catch {
    data = { message: text }; 
  }

  if (!r.ok) {
    throw new Error(`GitHub ${r.status}: ${data.message || text}`);
  }

  return data;
}


function parseItems(src) {
  const s = src.indexOf('[');
  const e = src.lastIndexOf(']');

  if (s < 0 || e < s) return [];

  const literal = src.slice(s, e + 1);
  let arr;

  try {
    arr = JSON.parse(literal);
  }
  catch {
    arr = new Function(`return ${literal}`)();
  }

  return arr.filter((it) => it && (it.title || it.caption || it.image));
}


async function exists(path) {
  try {
    await gh(`/contents/${path}?ref=${BRANCH}`);
    return true;
  } 
  catch {
    return false;
  }
}


function serialize(items) {
  return `const creativeItems = ${JSON.stringify(items, null, 4)};\n`;
}


function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'untitled';
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
  
  let imgBuf = null;
  let ext = null;
  
  if (body.imageBase64) {
    imgBuf = Buffer.from(String(body.imageBase64), 'base64');
    if (imgBuf.length > MAX_IMAGE_BYTES) return res.status(413).json({ error: 'Image too large (max 3 MB).' });
    ext = sniffImage(imgBuf);
    if (!ext) return res.status(400).json({ error: 'Unsupported image type (use JPG, PNG or WebP).' });
  } 
  else if (!caption) {
    return res.status(400).json({ error: 'Add an image or write a note/caption.' });
  }

    if (!process.env.GITHUB_TOKEN) {
    return res.status(500).json({ error: 'Server not configured (missing GITHUB_TOKEN).' });
  }

    try {
    const ref = await gh(`/git/ref/heads/${BRANCH}`);
    const headSha = ref.object.sha;
    const headCommit = await gh(`/git/commits/${headSha}`);

    const file = await gh(`/contents/${DATA_PATH}?ref=${BRANCH}`);
    const items = parseItems(Buffer.from(file.content, 'base64').toString('utf8'));

    let imagePath = '';
    if (imgBuf) {
      imagePath = `${IMG_DIR}/${date}-${slugify(title)}.${ext}`;
      if (await exists(imagePath)) {
        imagePath = `${IMG_DIR}/${date}-${slugify(title)}-${Date.now().toString(36)}.${ext}`;
      }
    }

    items.unshift({ title, tag, image: imagePath, caption, date });

    const treeEntries = [];
    if (imgBuf) {
      const imgBlob = await gh('/git/blobs', {
        method: 'POST',
        body: JSON.stringify({ content: imgBuf.toString('base64'), encoding: 'base64' }),
      });
      treeEntries.push({ path: imagePath, mode: '100644', type: 'blob', sha: imgBlob.sha });
    }
    const dataBlob = await gh('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content: serialize(items), encoding: 'utf-8' }),
    });
    treeEntries.push({ path: DATA_PATH, mode: '100644', type: 'blob', sha: dataBlob.sha });

    const tree = await gh('/git/trees', {
      method: 'POST',
      body: JSON.stringify({ base_tree: headCommit.tree.sha, tree: treeEntries }),
    });
    const commit = await gh('/git/commits', {
      method: 'POST',
      body: JSON.stringify({ message: commitMessage, tree: tree.sha, parents: [headSha] }),
    });
    await gh(`/git/refs/heads/${BRANCH}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha }),
    });

    return res.status(200).json({
      ok: true,
      commitUrl: `https://github.com/${REPO}/commit/${commit.sha}`,
    });
  } 
  catch (err) {
    console.error(err);
    return res.status(502).json({ error: String(err.message || err) });
  }
};
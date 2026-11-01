const $ = id => document.getElementById(id);
const MAX_PICTURES = 4;
const MAX_TOTAL = 3 * 1024 * 1024;

let passphrase = '';
let pictures = [];
let pending = null;
const views = ['login', 'compose', 'preview', 'done'];
const today = () => new Date().toLocaleDateString('en-CA');
$('date').value = today();
$('date').max = today();

function show(name) {
    views.forEach(v => $('view-' + v).classList.toggle('hidden', v !== name));
    window.scrollTo(0, 0);
}

function say(id, text) {
    $(id).textContent = text;
}


async function api(url, payload = {}) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase, ...payload })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.error || 'Something went wrong (' + res.status + ')');
    }

    return data;
}


$('btn-login').addEventListener('click', async () => {
    passphrase = $('pass').value;
    say('msg-login', 'checking...');
    
    try {
        await api('/api/validate');
        say('msg-login', '');
        show('compose');
    } 
    catch (err) {
        passphrase = '';
        say('msg-login', 'ERROR: ' + err.message);
    }
});


$('btn-lock').addEventListener('click', () => {
    passphrase = '';
    $('pass').value = '';
    show('login');
});


function blobToBase64(blob) {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(blob);
    });
}


async function processFile(file) {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.src = src;
    await img.decode();

    const scale = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(src);

    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    return {
        url: URL.createObjectURL(blob),
        b64: await blobToBase64(blob),
        size: blob.size
    };
}


function totalSize() {
    return pictures.reduce((sum, p) => sum + p.size, 0);
}


function updateStatus(skipped = 0) {
    if (!pictures.length) {
        say('pick-status', skipped ? 'ERROR: ' + skipped + ' skipped (max ' + MAX_PICTURES + ' pictures, 3 MB total)' : '');
        return;
    }
    let text = pictures.length + (pictures.length === 1 ? ' picture' : ' pictures') + ' · ' + Math.round(totalSize() / 1024) + ' KB';
    if (skipped) {
        text += ' · ' + skipped + ' skipped (max ' + MAX_PICTURES + ' pictures, 3 MB total)';
    }
    say('pick-status', text);
}


function renderThumbs() {
    $('thumbs').innerHTML = '';

    pictures.forEach((pic, i) => {
        const box = document.createElement('div');
        box.className = 'thumb';

        const img = document.createElement('img');
        img.src = pic.url;
        img.alt = 'Picture ' + (i + 1);

        const btn = document.createElement('button');
        btn.textContent = '×';
        btn.setAttribute('aria-label', 'Remove picture ' + (i + 1));
        btn.addEventListener('click', () => removePicture(i));

        box.append(img, btn);
        $('thumbs').appendChild(box);
    });
}


function removePicture(i) {
    URL.revokeObjectURL(pictures[i].url);
    pictures.splice(i, 1);
    renderThumbs();
    updateStatus();
}


$('btn-pick').addEventListener('click', () => $('file').click());


$('file').addEventListener('change', async () => {
    const files = Array.from($('file').files);
    $('file').value = '';

    if (!files.length) {
        return;
    }

    say('pick-status', 'processing...');
    let skipped = 0;

    for (const file of files) {
        if (pictures.length >= MAX_PICTURES) {
            skipped++;
            continue;
        }

        try {
            const pic = await processFile(file);
            if (totalSize() + pic.size > MAX_TOTAL) {
                URL.revokeObjectURL(pic.url);
                skipped++;
                continue;
            }
            pictures.push(pic);
        }
        catch (err) {
            skipped++;
        }
    }

    renderThumbs();
    updateStatus(skipped);
});


$('btn-preview').addEventListener('click', () => {
    const title = $('title').value.trim();
    const tag = $('tag').value.trim() || (pictures.length ? 'sketch' : 'note');
    const caption = $('caption').value.trim();

    if (!title) return say('msg-compose', 'Give it a title!');
    if (!pictures.length && !caption) return say('msg-compose', 'Add a picture or write a note!');
    const date = $('date').value || today();
    pending = { title, tag, caption, date };
    
    $('preview-card').innerHTML = buildCreativeCard({ ...pending, images: pictures.map(p => p.url) });
    observeNewCards($('preview-card'));

    const n = pictures.length;
    $('files-list').innerHTML =
        (n ? '+ ' + n + (n === 1 ? ' new image' : ' new images') + ' in images/creative/<br>' : '') +
        '~ creative-data.js (1 new entry)';
    $('commit').value = 'Add: ' + tag + ' – ' + title;
    say('msg-preview', '');
    show('preview');
});


$('btn-back').addEventListener('click', () => show('compose'));


$('btn-publish').addEventListener('click', async () => {
    $('btn-publish').disabled = true;
    say('msg-preview', 'sending...');
    try {
        const out = await api('/api/publish', {
            ...pending,
            images: pictures.map(p => p.b64),
            commitMessage: $('commit').value
        });
        $('commit-link').href = out.commitUrl;
        show('done');
    } catch (err) {
        say('msg-preview', 'ERROR: ' + err.message);
    }
    $('btn-publish').disabled = false;
});


$('btn-again').addEventListener('click', () => {
    $('title').value = '';
    $('tag').value = '';
    $('date').value = today();
    $('caption').value = '';
    pictures.forEach(p => URL.revokeObjectURL(p.url));
    pictures = [];
    renderThumbs();
    pending = null;
    say('pick-status', '');
    say('msg-compose', '');
    show('compose');
});
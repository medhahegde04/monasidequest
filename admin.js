const $ = id => document.getElementById(id);
let passphrase = '';
let imageB64 = '';
let imageURL = '';
let pending = null;
const views = ['login', 'compose', 'preview'];

function show(name) {
    views.forEach(v => $('view-' + v).classList.toggle('hidden', v !== name));
}

function say(id, text) {
    $(id).textContent = text;
}


async function api(payload) {
    const res = await fetch('/api/validate', {
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
        await api({ action: 'ping' });
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


$('btn-pick').addEventListener('click', () => $('file').click());


$('file').addEventListener('change', async () => {
    const file = $('file').files[0];

    if (!file) {
        return;
    }

    say('pick-status', 'processing...');

    try {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();

        const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
        imageURL = URL.createObjectURL(blob);
        imageB64 = await blobToBase64(blob);
        say('pick-status', 'ready · ' + Math.round(blob.size / 1024) + ' KB');
    } 
    catch (err) {
        say('pick-status', 'ERROR: Could not read that image.');
    }
});


$('btn-preview').addEventListener('click', () => {
    const title = $('title').value.trim();
    const tag = $('tag').value.trim() || (imageB64 ? 'sketch' : 'note');
    const caption = $('caption').value.trim();

    if (!title) return say('msg-compose', 'Give it a title!');
    if (!imageB64 && !caption) return say('msg-compose', 'Add a picture or write a note!');

    const date = new Date().toLocaleDateString('en-CA');
    pending = { title, tag, caption, date };

    $('preview-card').innerHTML = buildCreativeCard({ ...pending, image: imageURL });
    observeNewCards($('preview-card'));

    $('files-list').innerHTML =
        (imageB64 ? '+ a new image in creative/<br>' : '') +
        '~ creative-data.js (1 new entry)';
    $('commit').value = 'Add: ' + tag + ' – ' + title;
    say('msg-preview', '');
    show('preview');
});


$('btn-back').addEventListener('click', () => show('compose'));


$('btn-publish').addEventListener('click', () => {
    say('msg-preview', 'Publishing...');
});
const $ = id => document.getElementById(id);

let passphrase = '';

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
        say('msg-login', 'unlocked ✓');
    } 
    catch (err) {
        passphrase = '';
        say('msg-login', 'ERROR: ' + err.message);
    }
});
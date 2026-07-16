const DEFAULTS = {
    name: 'Your Name',
    bio: 'Write something about yourself.',
    links: []
};

const AVATAR_BASE = 'https://api.dicebear.com/10.x/notionists/svg';

function loadProfile() {
    try {
        const raw = localStorage.getItem('pb-profile');
        if (raw) return JSON.parse(raw);
    } catch (_) { }
    return { ...DEFAULTS };
}

function saveProfile(profile) {
    localStorage.setItem('pb-profile', JSON.stringify(profile));
}

function avatarUrl(seed) {
    return `${AVATAR_BASE}?seed=${encodeURIComponent(seed || 'default')}`;
}

function platformIcon(id) {
    const icons = {
        github: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>',
        x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46L20 4"/></svg>',
        bluesky: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 13.5c-2-2.5-5-4-8-4.5 0 0 0 0 0 0 0 6 4 9 8 10.5 4-1.5 8-4.5 8-10.5-3 .5-6 2-8 4.5z"/></svg>',
        mastodon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C8 2 4 4 4 8v6c0 4 3 6 8 6s8-2 8-6V8c0-4-4-6-8-6z"/><path d="M8 8v4c0 2 1.5 3 4 3s4-1 4-3V8"/><path d="M8 11h8"/></svg>'
    };
    return icons[id] || '';
}

function detectPlatform(url) {
    if (!url) return null;
    const u = url.toLowerCase();
    if (u.includes('github.com')) return 'github';
    if (u.includes('x.com') || u.includes('twitter.com')) return 'x';
    if (u.includes('bsky.app')) return 'bluesky';
    if (u.includes('mastodon')) return 'mastodon';
    return null;
}

function formatLink(url) {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
}

function updatePreview() {
    const p = loadProfile();
    document.getElementById('avatar').src = avatarUrl(p.name || 'default');
    document.getElementById('displayName').textContent = p.name || DEFAULTS.name;
    document.getElementById('displayBio').textContent = p.bio || DEFAULTS.bio;

    const container = document.getElementById('displayLinks');
    container.innerHTML = '';
    for (const link of (p.links || [])) {
        if (!link.url) continue;
        const platform = detectPlatform(link.url);
        const a = document.createElement('a');
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.className = 'no-ext';
        a.innerHTML = platform ? platformIcon(platform) + (link.label || platform) : (link.label || 'link');
        container.appendChild(a);
    }
}

function syncForm() {
    const p = loadProfile();
    document.getElementById('inputName').value = p.name || '';
    document.getElementById('inputBio').value = p.bio || '';
    document.getElementById('bioCount').textContent = (p.bio || '').length;

    const map = { github: '', x: '', bluesky: '', mastodon: '' };
    for (const link of (p.links || [])) {
        const pl = detectPlatform(link.url);
        if (pl && pl in map) map[pl] = link.url;
    }
    document.getElementById('inputGh').value = map.github || '';
    document.getElementById('inputX').value = map.x || '';
    document.getElementById('inputBs').value = map.bluesky || '';
    document.getElementById('inputMs').value = map.mastodon || '';
}

function collectFromForm() {
    const name = document.getElementById('inputName').value.trim() || DEFAULTS.name;
    const bio = document.getElementById('inputBio').value.trim() || DEFAULTS.bio;

    const links = [];
    for (const item of [
        { label: 'GitHub', url: formatLink(document.getElementById('inputGh').value) },
        { label: 'X', url: formatLink(document.getElementById('inputX').value) },
        { label: 'Bluesky', url: formatLink(document.getElementById('inputBs').value) },
        { label: 'Mastodon', url: formatLink(document.getElementById('inputMs').value) },
    ]) {
        if (item.url) links.push(item);
    }
    return { name, bio, links };
}

function onFormChange() {
    const profile = collectFromForm();
    saveProfile(profile);
    updatePreview();
    document.getElementById('bioCount').textContent = document.getElementById('inputBio').value.length;
}

document.querySelectorAll('#inputName, #inputBio, #inputGh, #inputX, #inputBs, #inputMs').forEach(el => {
    el.addEventListener('input', onFormChange);
});

document.getElementById('resetBtn').addEventListener('click', () => {
    saveProfile({ ...DEFAULTS });
    syncForm();
    updatePreview();
    showToast('Profile reset');
});

function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2200);
}

function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}

function generateHtmlEmbed() {
    const p = loadProfile();
    const avatar = avatarUrl(p.name || 'default');
    let linksHtml = '';
    for (const link of (p.links || [])) {
        if (!link.url) continue;
        const platform = detectPlatform(link.url);
        const label = link.label || platform || 'link';
        linksHtml += `<a href="${link.url}" style="display:inline-flex;align-items:center;gap:5px;font:10px/1 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;text-decoration:none;color:#7a766c;padding:6px 12px;border:1px solid rgba(26,24,22,0.10);border-radius:6px">${label}</a>`;
    }
    return `<div style="background:#f3eee5;border-radius:16px;padding:36px;text-align:center;font-family:-apple-system,system-ui,sans-serif;max-width:400px;margin:0 auto;border:1px solid rgba(26,24,22,0.12)">\n  <img src="${avatar}" alt="avatar" style="width:96px;height:96px;border-radius:50%;margin:0 auto 16px;display:block;background:#f3eee5;border:2px solid rgba(26,24,22,0.10)"/>\n  <h3 style="font-family:Georgia,serif;font-size:28px;font-style:italic;margin:0 0 6px;color:#1a1816;font-weight:400">${escHtml(p.name)}</h3>\n  <p style="font-size:13px;line-height:1.6;color:#7a766c;margin:0 0 20px">${escHtml(p.bio)}</p>\n  <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap">\n    ${linksHtml}\n  </div>\n</div>`;
}

function generateMdEmbed() {
    const p = loadProfile();
    const avatar = avatarUrl(p.name || 'default');
    let linksMd = '';
    for (const link of (p.links || [])) {
        if (!link.url) continue;
        const platform = detectPlatform(link.url);
        const label = link.label || platform || 'link';
        linksMd += `- [${label}](${link.url})\n`;
    }
    return `[![avatar](${avatar})](${avatar})\n**${p.name}**\n\n${p.bio}\n\n${linksMd}`.trim();
}

function refreshExport() {
    document.getElementById('htmlSnippet').textContent = generateHtmlEmbed();
    document.getElementById('mdSnippet').textContent = generateMdEmbed();
}

document.getElementById('exportBtn').addEventListener('click', () => {
    refreshExport();
    document.getElementById('exportOverlay').classList.add('show');
});

document.getElementById('exportClose').addEventListener('click', () => {
    document.getElementById('exportOverlay').classList.remove('show');
});

document.getElementById('exportOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('exportOverlay').classList.remove('show');
    }
});

document.querySelectorAll('.export-tabs button').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.export-tabs button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.export-pane').forEach(p => p.classList.remove('active'));
        const id = 'pane' + btn.dataset.pane.charAt(0).toUpperCase() + btn.dataset.pane.slice(1);
        document.getElementById(id).classList.add('active');
    });
});

document.querySelectorAll('.copy-btn[data-target]').forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.dataset.target === 'html' ? generateHtmlEmbed() : generateMdEmbed();
        navigator.clipboard.writeText(text).then(() => {
            btn.textContent = 'Copied!';
            btn.classList.add('copied');
            setTimeout(() => {
                const label = btn.dataset.target === 'html' ? 'Copy HTML' : 'Copy Markdown';
                btn.textContent = label;
                btn.classList.remove('copied');
            }, 1800);
            showToast('Copied to clipboard');
        });
    });
});

document.getElementById('downloadPng').addEventListener('click', () => {
    document.getElementById('exportOverlay').classList.remove('show');
    const preview = document.querySelector('.preview');
    const clone = preview.cloneNode(true);
    clone.querySelector('.toolbar')?.remove();
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = '400px';
    clone.style.zIndex = '-1';
    document.body.appendChild(clone);

    const seed = loadProfile().name || 'default';
    const url = avatarUrl(seed);

    fetch(url, { mode: 'cors' })
        .then(r => r.text())
        .then(svg => {
            const wrap = clone.querySelector('.avatar-wrap');
            wrap.innerHTML = svg;
            const svgEl = wrap.querySelector('svg');
            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            svgEl.style.display = 'block';
            svgEl.setAttribute('width', '100%');
            svgEl.setAttribute('height', '100%');
            return new Promise(r => setTimeout(r, 100));
        })
        .then(() => {
            return html2canvas(clone, {
                scale: 2,
                backgroundColor: null,
                useCORS: true,
                allowTaint: true,
                logging: false
            });
        })
        .then(canvas => {
            document.body.removeChild(clone);
            const link = document.createElement('a');
            link.download = 'profile-card.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            showToast('PNG downloaded');
        })
        .catch(() => {
            document.body.removeChild(clone);
            showToast('PNG export failed');
        });
});

syncForm();
updatePreview();

(function () {
  'use strict';
  const PROTOCOL_VERSION = 1;
  let metadata = null;

  function applyVars(rootVars, darkVars) {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(rootVars || {})) root.style.setProperty(k, v);
    // dark vars are scoped — emulate stratos by toggling .dark-theme + setting overrides as needed
    // For MVP we apply both sets and rely on the .dark-theme selector chain in the snapshot's stylesheet
    if (darkVars && Object.keys(darkVars).length > 0) {
      let styleEl = document.getElementById('stb-dark-overrides');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'stb-dark-overrides';
        document.head.appendChild(styleEl);
      }
      const decls = Object.entries(darkVars).map(([k, v]) => `${k}: ${v};`).join(' ');
      styleEl.textContent = `.dark-theme { ${decls} }`;
    }
  }

  function setDark(dark) {
    document.documentElement.classList.toggle('dark-theme', !!dark);
  }

  async function loadMetadata() {
    const link = document.querySelector('link[rel="stratos-metadata"]');
    const url = link ? link.getAttribute('href') : './metadata.json';
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      metadata = await res.json();
    } catch {
      // no metadata; highlight will be disabled
    }
  }

  function highlightToken(token) {
    document.querySelectorAll('[data-stb-highlight]').forEach((el) => el.removeAttribute('data-stb-highlight'));
    if (!token || !metadata) return;
    for (const entry of (metadata.mappings || [])) {
      if ((entry.tokens || []).some((t) => t.name === token)) {
        try { document.querySelectorAll(entry.selector).forEach((el) => el.setAttribute('data-stb-highlight', '')); }
        catch { /* invalid selector */ }
      }
    }
    ensureHighlightStyles();
  }

  function highlightElement(snapshotId) {
    document.querySelectorAll('[data-stb-highlight]').forEach((el) => el.removeAttribute('data-stb-highlight'));
    if (!snapshotId) return;
    const el = document.querySelector('[data-stratos-snapshot-id="' + snapshotId + '"]');
    if (el) el.setAttribute('data-stb-highlight', '');
    ensureHighlightStyles();
  }

  function ensureHighlightStyles() {
    if (document.getElementById('stb-highlight-style')) return;
    const el = document.createElement('style');
    el.id = 'stb-highlight-style';
    // negative offset draws the outline just *inside* the element so full-bleed
    // elements (page, background) stay visible instead of clipping past the frame edge
    el.textContent = '[data-stb-highlight] { outline: 2px solid #ff8c00 !important; outline-offset: -2px; }';
    document.head.appendChild(el);
  }

  function applyLeversInShim(levers) {
    for (var i = 0; i < (levers || []).length; i++) {
      var p = levers[i];
      if (p.kind === 'visibility') {
        var tid = p.snapshotId.replace(/\.show-/, '.');
        var ve = document.querySelector('[data-stratos-snapshot-id="' + tid + '"]');
        if (ve) ve.style.display = p.shown ? '' : 'none';
        continue;
      }
      var e = document.querySelector('[data-stratos-snapshot-id="' + p.snapshotId + '"]');
      if (!e) continue;
      if (p.kind === 'content' && p.text !== undefined) e.textContent = p.text;
      if (p.kind === 'asset') {
        var src = p.blob ? URL.createObjectURL(p.blob) : p.ref; // NOTE: object URL not revoked
        if (src === undefined) continue;
        if (e.tagName === 'IMG') e.setAttribute('src', src);
        else e.style.backgroundImage = 'url(' + src + ')';
      }
    }
  }

  function markLevers(ids) {
    document.querySelectorAll('[data-stb-lever]').forEach((el) => el.removeAttribute('data-stb-lever'));
    for (const id of ids || []) {
      const el = document.querySelector('[data-stratos-snapshot-id="' + id + '"]');
      if (el) el.setAttribute('data-stb-lever', '');
    }
    ensureLeverStyles();
  }

  function setLeverOutline(on) {
    document.documentElement.toggleAttribute('data-stb-show-levers', !!on);
    ensureLeverStyles();
  }

  function ensureLeverStyles() {
    if (document.getElementById('stb-lever-style')) return;
    const el = document.createElement('style');
    el.id = 'stb-lever-style';
    el.textContent =
      '[data-stb-lever] { cursor: pointer; }' +
      '[data-stb-lever]:hover { outline: 2px dashed #3b82f6 !important; outline-offset: 2px; }' +
      '[data-stb-show-levers] [data-stb-lever] { outline: 2px dashed #3b82f6 !important; outline-offset: 2px; }';
    document.head.appendChild(el);
  }

  function tokensForElement(el) {
    if (!metadata) return [];
    const out = new Set();
    for (const entry of (metadata.mappings || [])) {
      try {
        if (el.matches(entry.selector) || el.closest(entry.selector)) {
          for (const t of (entry.tokens || [])) out.add(t.name);
        }
      } catch { /* invalid selector */ }
    }
    return [...out];
  }

  window.addEventListener('message', (event) => {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    switch (msg.type) {
      case 'STB_HELLO':
        window.parent.postMessage({ type: 'STB_PREVIEW_READY', version: PROTOCOL_VERSION }, '*');
        break;
      case 'STB_APPLY_VARS':
        applyVars(msg.root, msg.dark);
        break;
      case 'STB_SET_DARK':
        setDark(msg.dark);
        break;
      case 'STB_HIGHLIGHT_TOKEN':
        highlightToken(msg.token);
        break;
      case 'STB_HIGHLIGHT_ELEMENT':
        highlightElement(msg.snapshotId);
        break;
      case 'STB_APPLY_LEVERS':
        applyLeversInShim(msg.levers);
        break;
      case 'STB_SET_LEVERS':
        markLevers(msg.ids);
        break;
      case 'STB_SET_LEVER_OUTLINE':
        setLeverOutline(msg.on);
        break;
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const el = target.closest('[data-stratos-snapshot-id]');
    if (!el) return;
    const snapshotId = el.getAttribute('data-stratos-snapshot-id');
    const selector = bestSelector(el);
    window.parent.postMessage({ type: 'STB_ELEMENT_SELECTED', selector, tokens: tokensForElement(target), snapshotId }, '*');
  });

  function bestSelector(el) {
    const id = el.getAttribute('data-stratos-snapshot-id');
    if (id) return `[data-stratos-snapshot-id="${id}"]`;
    return el.tagName.toLowerCase();
  }

  loadMetadata().then(() => {
    window.parent.postMessage({ type: 'STB_PREVIEW_READY', version: PROTOCOL_VERSION }, '*');
  });
})();

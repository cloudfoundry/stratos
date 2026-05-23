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
    document.querySelectorAll('[data-stb-highlight]').forEach((el) => {
      el.removeAttribute('data-stb-highlight');
    });
    if (!token || !metadata) return;
    for (const entry of (metadata.selectorTokens || [])) {
      if ((entry.tokens || []).includes(token)) {
        try {
          document.querySelectorAll(entry.selector).forEach((el) => {
            el.setAttribute('data-stb-highlight', '');
          });
        } catch { /* invalid selector */ }
      }
    }
    ensureHighlightStyles();
  }

  function ensureHighlightStyles() {
    if (document.getElementById('stb-highlight-style')) return;
    const el = document.createElement('style');
    el.id = 'stb-highlight-style';
    el.textContent = '[data-stb-highlight] { outline: 2px solid #ff8c00 !important; outline-offset: 2px; }';
    document.head.appendChild(el);
  }

  function tokensForElement(el) {
    if (!metadata) return [];
    const out = new Set();
    for (const entry of (metadata.selectorTokens || [])) {
      try {
        if (el.matches(entry.selector) || el.closest(entry.selector)) {
          for (const t of entry.tokens || []) out.add(t);
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
    }
  });

  document.addEventListener('click', (e) => {
    if (!metadata) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    const tokens = tokensForElement(target);
    if (tokens.length === 0) return;
    const selector = bestSelector(target);
    window.parent.postMessage({ type: 'STB_ELEMENT_SELECTED', selector, tokens }, '*');
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

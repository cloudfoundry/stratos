(function () {
  'use strict';
  const PROTOCOL_VERSION = 1;
  let metadata = null;

  function applyVars(rootVars, darkVars) {
    // Apply :root vars via a <style> block (NOT inline on documentElement): inline
    // custom props beat any selector, which would shadow the .dark-theme overrides
    // below and silently break dark mode. A :root rule sits at the same cascade
    // level as .dark-theme, so dark overrides win when the class is present.
    let rootEl = document.getElementById('stb-root-vars');
    if (!rootEl) { rootEl = document.createElement('style'); rootEl.id = 'stb-root-vars'; document.head.appendChild(rootEl); }
    const rootDecls = Object.entries(rootVars || {}).map(([k, v]) => `${k}: ${v};`).join(' ');
    rootEl.textContent = `:root { ${rootDecls} }`;

    if (darkVars && Object.keys(darkVars).length > 0) {
      let styleEl = document.getElementById('stb-dark-overrides');
      if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'stb-dark-overrides'; document.head.appendChild(styleEl); }
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
    const el = document.querySelector('[stb-snapshot-id="' + snapshotId + '"]');
    if (el) el.setAttribute('data-stb-highlight', '');
    ensureHighlightStyles();
  }

  function revealElement(snapshotId) {
    document.querySelectorAll('[data-stb-reveal]').forEach((el) => el.removeAttribute('data-stb-reveal'));
    if (!snapshotId) return;
    const el = document.querySelector('[stb-snapshot-id="' + snapshotId + '"]');
    if (el) el.setAttribute('data-stb-reveal', '');
    ensureRevealStyles();
  }

  function ensureRevealStyles() {
    if (document.getElementById('stb-reveal-style')) return;
    const el = document.createElement('style');
    el.id = 'stb-reveal-style';
    // Give a hidden/empty themable element enough presence that its colour renders:
    // min-* is a no-op on already-sized elements; the ::before glyph only lands on
    // empty ones and inherits the element's text colour, so text-colour levers show.
    // Two triggers: [data-stb-reveal] = the selected element; [data-stb-show-levers]
    // = every editable region at once ("Show editable regions").
    el.textContent =
      '[data-stb-reveal], [data-stb-show-levers] [data-stb-lever] { min-width: 1.5rem !important; min-height: 1.25rem !important; }' +
      '[data-stb-reveal]:empty::before, [data-stb-show-levers] [data-stb-lever]:empty::before { content: attr(data-stb-reveal-label); opacity: 0.7; }';
    document.head.appendChild(el);
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

  // Plain-JS mirror of the closed-grammar subset parser — reference
  // implementation: src/content/subset-format.ts (keep the two in lockstep).
  // Grammar v1: **bold** → <strong>, _italic_ → <em>, newline → <br>;
  // everything else is a text node; unterminated markers render literally.
  // DELIBERATELY DOM-construction, NOT innerHTML: this shim accepts postMessage
  // from any origin ('*'), so an innerHTML sink here would be an XSS primitive
  // for any window that can message the iframe. Building only strong/em/br/text
  // nodes bounds a hostile payload to harmless formatting.
  function renderSubsetInto(el, text) {
    el.textContent = '';
    appendSubsetSpan(el, String(text));
  }
  function appendSubsetSpan(parent, s) {
    var doc = parent.ownerDocument;
    var buf = '';
    function flush() {
      if (buf) { parent.appendChild(doc.createTextNode(buf)); buf = ''; }
    }
    var i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (ch === '\n') { flush(); parent.appendChild(doc.createElement('br')); i++; continue; }
      if (s.slice(i, i + 2) === '**') {
        var endB = s.indexOf('**', i + 2);
        if (endB !== -1) {
          flush();
          var strong = doc.createElement('strong');
          appendSubsetSpan(strong, s.slice(i + 2, endB));
          parent.appendChild(strong);
          i = endB + 2;
          continue;
        }
      } else if (ch === '_') {
        var endI = s.indexOf('_', i + 1);
        if (endI !== -1) {
          flush();
          var em = doc.createElement('em');
          appendSubsetSpan(em, s.slice(i + 1, endI));
          parent.appendChild(em);
          i = endI + 1;
          continue;
        }
      }
      buf += ch;
      i++;
    }
    flush();
  }

  function applyLeversInShim(levers) {
    for (var i = 0; i < (levers || []).length; i++) {
      var p = levers[i];
      if (p.kind === 'visibility') {
        var tid = p.snapshotId.replace(/\.show-/, '.');
        var ve = document.querySelector('[stb-snapshot-id="' + tid + '"]');
        if (ve) ve.style.display = p.shown ? '' : 'none';
        continue;
      }
      var e = document.querySelector('[stb-snapshot-id="' + p.snapshotId + '"]');
      if (!e) continue;
      if (p.kind === 'content' && p.text !== undefined) {
        if (p.format === 'subset') renderSubsetInto(e, p.text);
        else e.textContent = p.text;
      }
      if (p.kind === 'asset') {
        var src = p.blob ? URL.createObjectURL(p.blob) : p.ref; // NOTE: object URL not revoked
        if (src === undefined) continue;
        if (e.tagName === 'IMG') e.setAttribute('src', src);
        else e.style.backgroundImage = 'url(' + src + ')';
      }
    }
  }

  function applyScopedBlocks(cssText) {
    // upsert ONE late <style> at the end of <head> so the element-scoped rules
    // sit after the snapshot stylesheet and win the source-order tie (R1 facet)
    var styleEl = document.getElementById('stb-scoped-blocks');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'stb-scoped-blocks';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = cssText || '';
  }

  function markLevers(levers) {
    document.querySelectorAll('[data-stb-lever]').forEach((el) => {
      el.removeAttribute('data-stb-lever');
      el.removeAttribute('data-stb-reveal-label');
    });
    for (const lever of levers || []) {
      const el = document.querySelector('[stb-snapshot-id="' + lever.id + '"]');
      if (!el) continue;
      el.setAttribute('data-stb-lever', '');
      // stamp the element's real name so a revealed empty element labels itself
      if (lever.name) el.setAttribute('data-stb-reveal-label', lever.name);
    }
    ensureLeverStyles();
  }

  function setLeverOutline(on) {
    document.documentElement.toggleAttribute('data-stb-show-levers', !!on);
    ensureLeverStyles();
    ensureRevealStyles();
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
      case 'STB_REVEAL':
        revealElement(msg.snapshotId);
        break;
      case 'STB_APPLY_LEVERS':
        applyLeversInShim(msg.levers);
        break;
      case 'STB_APPLY_BLOCKS':
        applyScopedBlocks(msg.css);
        break;
      case 'STB_SET_LEVERS':
        markLevers(msg.levers);
        break;
      case 'STB_SET_LEVER_OUTLINE':
        setLeverOutline(msg.on);
        break;
    }
  });

  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;
    const el = target.closest('[stb-snapshot-id]');
    if (!el) return;
    const snapshotId = el.getAttribute('stb-snapshot-id');
    const selector = bestSelector(el);
    window.parent.postMessage({ type: 'STB_ELEMENT_SELECTED', selector, tokens: tokensForElement(target), snapshotId }, '*');
  });

  function bestSelector(el) {
    const id = el.getAttribute('stb-snapshot-id');
    if (id) return `[stb-snapshot-id="${id}"]`;
    return el.tagName.toLowerCase();
  }

  loadMetadata().then(() => {
    window.parent.postMessage({ type: 'STB_PREVIEW_READY', version: PROTOCOL_VERSION }, '*');
  });
})();

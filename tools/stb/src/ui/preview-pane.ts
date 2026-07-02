import { effect } from '@preact/signals-core';
import { rootValues, darkValues } from '@/state/tokens';
import { activeSceneId, previewDark, compareMode } from '@/state/scene';
import { brandingModel, loadBrandingModel } from '@/state/branding';
import type { ParentToPreview, PreviewToParent } from '@/iframe-bridge/messages';
import type { BrandingModel } from '@/metadata/types';
import type { LeverPatch } from '@/iframe-bridge/apply-levers';
import { attachAssetBlobs, brandingAssets, rewriteAssetUrls } from '@/state/branding-assets';
import { emitScopedBlocks } from '@/parse/css-emitter';

// Background is no longer patched here: the scoped-blocks CSS (emitScopedBlocks, sent via
// STB_APPLY_BLOCKS) is the sole owner of preview backgrounds, light and dark alike — see
// applyScopedBlocksToPreview below. Keeping a single leg avoids the two legs drifting apart
// and lets uploaded background images resolve (raw asset refs get rewritten to blob: URLs
// there; an inline-style leg would need the same rewrite duplicated).
export function leverPatchesFor(model: BrandingModel): LeverPatch[] {
  const out: LeverPatch[] = [];
  for (const n of model.nodes) {
    if (n.facets.content) {
      out.push({
        snapshotId: n.snapshotId, kind: 'content', text: n.facets.content.text,
        // plain content stays byte-identical to the pre-format patch shape
        ...(n.facets.content.format === 'subset' ? { format: 'subset' as const } : {}),
      });
    }
    else if (n.facets.asset) out.push({ snapshotId: n.snapshotId, kind: 'asset', ref: n.facets.asset.ref });
    if (n.visibility !== undefined) out.push({ snapshotId: n.snapshotId, kind: 'visibility', shown: n.visibility });
  }
  return out;
}

export interface PreviewPaneOptions {
  onElementSelected?: (selector: string, tokens: string[], snapshotId: string | null) => void;
  /**
   * Which mode this pane renders. 'follow-global' (default) tracks the
   * previewDark signal — today's single-pane behavior. 'light'/'dark' pin the
   * pane regardless of the global signal (the compare panes), so the dark pane
   * stays dark while previewDark is false.
   */
  mode?: 'light' | 'dark' | 'follow-global';
}

export interface PreviewPane {
  mount(host: HTMLElement): void;
  highlightToken(token: string | null): void;
  highlightElement(snapshotId: string | null): void;
  revealElement(snapshotId: string | null): void;
  showLevers(on: boolean): void;
}

let paneCounter = 0;

export function createPreviewPane(opts: PreviewPaneOptions = {}): PreviewPane {
  let iframe: HTMLIFrameElement | null = null;
  let ready = false;
  const mode = opts.mode ?? 'follow-global';
  const isDark = (): boolean => (mode === 'follow-global' ? previewDark.value : mode === 'dark');
  // Distinct key per pane instance so rewriteAssetUrls's revoke-on-replace never
  // clobbers another live pane's still-displayed blob: URLs (e.g. compare mode's
  // light + pinned-dark panes both hold scoped-block CSS with rewritten refs).
  const assetUrlKey = `preview-pane-${paneCounter++}`;

  function send(msg: ParentToPreview): void {
    if (!iframe || !iframe.contentWindow || !ready) return;
    iframe.contentWindow.postMessage(msg, '*');
  }

  function applyTokens(): void {
    const rootObj = Object.fromEntries(rootValues.value);
    const darkObj = Object.fromEntries(darkValues.value);
    send({ type: 'STB_APPLY_VARS', root: rootObj, dark: darkObj });
  }

  function applyDark(): void {
    send({ type: 'STB_SET_DARK', dark: isDark() });
  }

  function applyLeversToPreview(): void {
    const m = brandingModel.value;
    if (!m) return;
    send({ type: 'STB_APPLY_LEVERS', levers: attachAssetBlobs(leverPatchesFor(m), brandingAssets.value) });
    // tell the shim which elements are editable (name rides along so a revealed
    // empty element can label itself with its real name, not invented text)
    send({ type: 'STB_SET_LEVERS', levers: m.nodes.map((n) => ({ id: n.snapshotId, name: n.name })) });
  }

  function applyScopedBlocksToPreview(): void {
    const m = brandingModel.value;
    const css = m ? emitScopedBlocks(m.nodes) : '';
    // send even when empty so clearing a block removes the rule from the iframe;
    // rewrite user-uploaded asset refs to blob: URLs so they resolve inside the iframe
    // (snapshot-bundled refs pass through untouched — no stored blob for those).
    send({ type: 'STB_APPLY_BLOCKS', css: css ? rewriteAssetUrls(css, brandingAssets.value, assetUrlKey) : '' });
  }

  function onMessage(event: MessageEvent): void {
    // Pane-scoped: with two live panes every instance hears every iframe's
    // messages on window — without this filter pane B would mark itself ready
    // on pane A's READY and a click would select through BOTH panes.
    if (!iframe || event.source !== iframe.contentWindow) return;
    const msg = event.data as PreviewToParent | undefined;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'STB_PREVIEW_READY') {
      ready = true;
      applyTokens();
      applyDark();
      applyLeversToPreview();
      applyScopedBlocksToPreview();
    } else if (msg.type === 'STB_ELEMENT_SELECTED') {
      opts.onElementSelected?.(msg.selector, msg.tokens, msg.snapshotId);
    }
  }

  function loadScene(sceneId: string): void {
    if (!iframe) return;
    ready = false;
    iframe.src = `/snapshots/v1/${sceneId}/index.html`;
  }

  return {
    mount(host) {
      iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.setAttribute('title', 'Theme preview');
      host.appendChild(iframe);

      window.addEventListener('message', onMessage);

      effect(() => {
        const scene = activeSceneId.value;
        loadScene(scene);
        void loadBrandingModel(scene);
      });

      effect(() => {
        // re-run whenever token signals or dark mode change
        void rootValues.value;
        void darkValues.value;
        if (ready) applyTokens();
      });

      effect(() => {
        // pinned panes never react to the global toggle — their mode is fixed
        if (mode === 'follow-global') void previewDark.value;
        if (ready) applyDark();
      });

      effect(() => {
        // previewDark is subscribed unconditionally (not just via the guarded
        // applyLeversToPreview read) so a dark toggle re-sends the mode-aware
        // background patches even if the model hasn't changed since ready.
        void brandingModel.value;
        if (mode === 'follow-global') void previewDark.value;
        if (ready) { applyLeversToPreview(); applyScopedBlocksToPreview(); }
      });
    },

    highlightToken(token) {
      send({ type: 'STB_HIGHLIGHT_TOKEN', token });
    },

    highlightElement(snapshotId) {
      send({ type: 'STB_HIGHLIGHT_ELEMENT', snapshotId });
    },

    revealElement(snapshotId) {
      send({ type: 'STB_REVEAL', snapshotId });
    },

    showLevers(on) {
      send({ type: 'STB_SET_LEVER_OUTLINE', on });
    },
  };
}

export interface CompareToggleOptions {
  /** `.stb-preview-host` — gains `.stb-compare` while compare is on. */
  panesHost: HTMLElement;
  /** The second (pinned-dark) pane's container; hidden while compare is off. */
  darkPaneHost: HTMLElement;
  /** The global "Dark preview" checkbox — made inert (disabled) during compare. */
  darkToggle?: HTMLInputElement | null;
  /** Lazy dark-pane creation: fires exactly once, on the first enable. */
  onFirstEnable?: () => void;
}

/**
 * The "Compare" mode switch. OFF (default): today's single follow-global pane +
 * Dark preview checkbox, unchanged. ON: two panes pinned light|dark; the global
 * Dark preview is forced off and DISABLED (not hidden — it stays discoverable
 * and visibly "managed by compare" rather than silently missing), and restored
 * to its prior state when compare turns off. The full single-source-of-truth
 * mode redesign is deliberately deferred (design doc, "Open / deferred").
 */
export function mountCompareToggle(host: HTMLElement, opts: CompareToggleOptions): void {
  const label = document.createElement('label');
  label.className = 'stb-compare-toggle';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.id = 'stb-compare-mode';
  label.appendChild(cb);
  label.append(' Compare');
  host.appendChild(label);

  let created = false;
  let savedDark = false;
  cb.addEventListener('change', () => {
    compareMode.value = cb.checked;
    if (cb.checked) {
      savedDark = previewDark.value;
      previewDark.value = false; // primary pane renders light; dark is the second pane's job
      if (opts.darkToggle) { opts.darkToggle.checked = false; opts.darkToggle.disabled = true; }
      opts.darkPaneHost.hidden = false;
      opts.panesHost.classList.add('stb-compare');
      if (!created) { created = true; opts.onFirstEnable?.(); }
    } else {
      previewDark.value = savedDark;
      if (opts.darkToggle) { opts.darkToggle.checked = savedDark; opts.darkToggle.disabled = false; }
      opts.darkPaneHost.hidden = true;
      opts.panesHost.classList.remove('stb-compare');
    }
  });
}

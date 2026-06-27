import { effect } from '@preact/signals-core';
import { rootValues, darkValues } from '@/state/tokens';
import { activeSceneId, previewDark } from '@/state/scene';
import { brandingModel, loadBrandingModel } from '@/state/branding';
import type { ParentToPreview, PreviewToParent } from '@/iframe-bridge/messages';
import type { BrandingModel } from '@/metadata/types';
import type { LeverPatch } from '@/iframe-bridge/apply-levers';
import { attachAssetBlobs, brandingAssets } from '@/state/branding-assets';

export function leverPatchesFor(model: BrandingModel): LeverPatch[] {
  const out: LeverPatch[] = [];
  for (const n of model.nodes) {
    if (n.value.kind === 'content') out.push({ snapshotId: n.snapshotId, kind: 'content', text: n.value.text });
    else if (n.value.kind === 'asset') out.push({ snapshotId: n.snapshotId, kind: 'asset', ref: n.value.ref });
    else if (n.value.kind === 'visibility') out.push({ snapshotId: n.snapshotId, kind: 'visibility', shown: n.value.shown });
  }
  return out;
}

export interface PreviewPaneOptions {
  onElementSelected?: (selector: string, tokens: string[], snapshotId: string | null) => void;
}

export interface PreviewPane {
  mount(host: HTMLElement): void;
  highlightToken(token: string | null): void;
  showLevers(on: boolean): void;
}

export function createPreviewPane(opts: PreviewPaneOptions = {}): PreviewPane {
  let iframe: HTMLIFrameElement | null = null;
  let ready = false;

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
    send({ type: 'STB_SET_DARK', dark: previewDark.value });
  }

  function applyLeversToPreview(): void {
    const m = brandingModel.value;
    if (!m) return;
    send({ type: 'STB_APPLY_LEVERS', levers: attachAssetBlobs(leverPatchesFor(m), brandingAssets.value) });
    // tell the shim which elements are editable so it can show a click affordance
    send({ type: 'STB_SET_LEVERS', ids: m.nodes.map((n) => n.snapshotId) });
  }

  function onMessage(event: MessageEvent): void {
    const msg = event.data as PreviewToParent | undefined;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'STB_PREVIEW_READY') {
      ready = true;
      applyTokens();
      applyDark();
      applyLeversToPreview();
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
        void previewDark.value;
        if (ready) applyDark();
      });

      effect(() => {
        void brandingModel.value;
        if (ready) applyLeversToPreview();
      });
    },

    highlightToken(token) {
      send({ type: 'STB_HIGHLIGHT_TOKEN', token });
    },

    showLevers(on) {
      send({ type: 'STB_SET_LEVER_OUTLINE', on });
    },
  };
}

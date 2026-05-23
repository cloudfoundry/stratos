import { effect } from '@preact/signals-core';
import { rootValues, darkValues } from '@/state/tokens';
import { activeSceneId, previewDark } from '@/state/scene';
import type { ParentToPreview, PreviewToParent } from '@/iframe-bridge/messages';

export interface PreviewPaneOptions {
  onElementSelected?: (selector: string, tokens: string[]) => void;
}

export interface PreviewPane {
  mount(host: HTMLElement): void;
  highlightToken(token: string | null): void;
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

  function onMessage(event: MessageEvent): void {
    const msg = event.data as PreviewToParent | undefined;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'STB_PREVIEW_READY') {
      ready = true;
      applyTokens();
      applyDark();
    } else if (msg.type === 'STB_ELEMENT_SELECTED') {
      opts.onElementSelected?.(msg.selector, msg.tokens);
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
        loadScene(activeSceneId.value);
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
    },

    highlightToken(token) {
      send({ type: 'STB_HIGHLIGHT_TOKEN', token });
    },
  };
}

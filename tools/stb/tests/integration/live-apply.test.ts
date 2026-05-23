import { describe, it, expect, beforeEach } from 'vitest';
import { setRootValue, resetTokens } from '@/state/tokens';
import { activeSceneId } from '@/state/scene';
import { createPreviewPane } from '@/ui/preview-pane';

describe('live-apply pipeline', () => {
  beforeEach(() => {
    resetTokens();
    activeSceneId.value = 'login';
    document.body.innerHTML = '<div id="host" style="width:600px;height:400px"></div>';
  });

  it('updates iframe CSS var when signal changes', async () => {
    const host = document.getElementById('host')!;
    const pane = createPreviewPane();
    pane.mount(host);

    const iframe = host.querySelector('iframe')!;
    await new Promise<void>((resolve) => {
      function listen(e: MessageEvent) {
        if (e.data?.type === 'STB_PREVIEW_READY') {
          window.removeEventListener('message', listen);
          resolve();
        }
      }
      window.addEventListener('message', listen);
    });

    setRootValue('--color-brand-500', '#ff0000');

    await new Promise((r) => setTimeout(r, 100));

    const innerDoc = iframe.contentDocument!;
    const root = innerDoc.documentElement;
    expect(root.style.getPropertyValue('--color-brand-500')).toBe('#ff0000');
  });
});

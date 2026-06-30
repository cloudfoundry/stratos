import { describe, it, expect, beforeEach } from 'vitest';
import { setRootValue, resetTokens } from '@/state/tokens';
import { activeSceneId } from '@/state/scene';
import { brandingModel } from '@/state/branding';
import { createPreviewPane } from '@/ui/preview-pane';
import type { BrandingModel } from '@/metadata/types';

function signInModel(scopedBlock: string): BrandingModel {
  return { scene: 'login', nodes: [
    { snapshotId: 'auth.login.page.card.sign-in', role: 'button', name: 'S', description: 'btn',
      facets: {}, scopedBlock },
  ] };
}

describe('live-apply pipeline', () => {
  beforeEach(() => {
    resetTokens();
    activeSceneId.value = 'login';
    brandingModel.value = null;
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
    expect(getComputedStyle(root).getPropertyValue('--color-brand-500').trim()).toBe('#ff0000');
  });

  it('injects a late scoped-block style that applies, upserting on change', async () => {
    const host = document.getElementById('host')!;
    const pane = createPreviewPane();
    pane.mount(host);
    const iframe = host.querySelector('iframe')!;
    await new Promise<void>((resolve) => {
      function listen(e: MessageEvent) {
        if (e.data?.type === 'STB_PREVIEW_READY') { window.removeEventListener('message', listen); resolve(); }
      }
      window.addEventListener('message', listen);
    });

    brandingModel.value = signInModel('color: rgb(0, 255, 0)');
    await new Promise((r) => setTimeout(r, 100));

    const innerDoc = iframe.contentDocument!;
    const styles = innerDoc.querySelectorAll('#stb-scoped-blocks');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('[stb-snapshot-id="auth.login.page.card.sign-in"]');
    const el = innerDoc.querySelector('[stb-snapshot-id="auth.login.page.card.sign-in"]')!;
    expect(getComputedStyle(el).color).toBe('rgb(0, 255, 0)');

    // a second change upserts the SAME style element (no duplicate) and re-applies
    brandingModel.value = signInModel('color: rgb(0, 0, 255)');
    await new Promise((r) => setTimeout(r, 100));
    expect(innerDoc.querySelectorAll('#stb-scoped-blocks').length).toBe(1);
    expect(getComputedStyle(el).color).toBe('rgb(0, 0, 255)');
  });

  it('applies a facet literal edit to the preview live', async () => {
    const host = document.getElementById('host')!;
    const pane = createPreviewPane();
    pane.mount(host);
    const iframe = host.querySelector('iframe')!;
    await new Promise<void>((resolve) => {
      function listen(e: MessageEvent) {
        if (e.data?.type === 'STB_PREVIEW_READY') { window.removeEventListener('message', listen); resolve(); }
      }
      window.addEventListener('message', listen);
    });

    // Set a model with a facet literal (no scopedBlock); emitScopedBlocks should
    // emit the font-size rule from facetDeclarations, not scopedBlock.
    brandingModel.value = {
      scene: 'login',
      nodes: [{
        snapshotId: 'auth.login.page.card.sign-in',
        role: 'button',
        name: 'S',
        description: 'btn',
        facets: { text: { fontSize: { literal: '18px' } } },
      }],
    };
    await new Promise((r) => setTimeout(r, 100));

    const innerDoc = iframe.contentDocument!;
    const styles = innerDoc.querySelectorAll('#stb-scoped-blocks');
    expect(styles.length).toBe(1);
    expect(styles[0]!.textContent).toContain('[stb-snapshot-id="auth.login.page.card.sign-in"]');
    expect(styles[0]!.textContent).toContain('font-size: 18px');
    const el = innerDoc.querySelector('[stb-snapshot-id="auth.login.page.card.sign-in"]')!;
    expect(getComputedStyle(el).fontSize).toBe('18px');

    // Upsert: change to 22px — must produce exactly ONE #stb-scoped-blocks
    brandingModel.value = {
      scene: 'login',
      nodes: [{
        snapshotId: 'auth.login.page.card.sign-in',
        role: 'button',
        name: 'S',
        description: 'btn',
        facets: { text: { fontSize: { literal: '22px' } } },
      }],
    };
    await new Promise((r) => setTimeout(r, 100));
    expect(innerDoc.querySelectorAll('#stb-scoped-blocks').length).toBe(1);
    expect(getComputedStyle(el).fontSize).toBe('22px');
  });
});

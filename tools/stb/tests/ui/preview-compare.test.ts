import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPreviewPane, mountCompareToggle } from '@/ui/preview-pane';
import { previewDark, compareMode, activeSceneId } from '@/state/scene';
import { brandingModel } from '@/state/branding';
import { openLeverEditor } from '@/ui/lever-editor';
import type { BrandingModel } from '@/metadata/types';

// Model with divergent light/dark background bundles so we can tell which
// bundle a pane's lever patches were composed from.
const bgModel = {
  scene: 'login',
  nodes: [
    { snapshotId: 'a.hero', role: 'region', name: 'H', description: '',
      facets: { background: { color: { literal: '#dddddd' } } },
      facetsDark: { background: { color: { literal: '#111111' } } } },
  ],
} as unknown as BrandingModel;

function dispatchFrom(iframe: HTMLIFrameElement, data: unknown): void {
  window.dispatchEvent(new MessageEvent('message', { data, source: iframe.contentWindow as Window }));
}

async function tick(): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
}

function mountPane(host: HTMLElement, opts: Parameters<typeof createPreviewPane>[0] = {}) {
  const pane = createPreviewPane(opts);
  pane.mount(host);
  const iframe = host.querySelector('iframe')!;
  // Spy on the REAL contentWindow: MessageEvent.source must be a WindowProxy,
  // so the same object doubles as the event source and the send sink.
  const post = vi.spyOn(iframe.contentWindow!, 'postMessage').mockImplementation(() => {});
  return { pane, iframe, post };
}

function sent(post: { mock: { calls: unknown[][] } }, type: string): any[] {
  return post.mock.calls.map((c) => c[0]).filter((m: any) => m?.type === type);
}

beforeEach(() => {
  // loadBrandingModel/routing fetches must not hit the network from jsdom;
  // a rejecting stub takes the catch path (brandingModel = null).
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no network in unit tests'))));
  document.body.innerHTML = '<div id="p1"></div><div id="p2"></div>';
  activeSceneId.value = 'login';
  previewDark.value = false;
  compareMode.value = false;
  brandingModel.value = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
  previewDark.value = false;
  compareMode.value = false;
  brandingModel.value = null;
});

describe('pinned-mode preview pane', () => {
  it('pinned-dark pane applies dark while the global previewDark stays false', async () => {
    const { iframe, post } = mountPane(document.getElementById('p1')!, { mode: 'dark' });
    await tick(); // let the mount-time loadBrandingModel settle
    dispatchFrom(iframe, { type: 'STB_PREVIEW_READY' });
    expect(previewDark.value).toBe(false);
    expect(sent(post, 'STB_SET_DARK')).toContainEqual({ type: 'STB_SET_DARK', dark: true });
  });

  it('pinned-dark pane composes lever patches from the dark bundle', async () => {
    const { iframe, post } = mountPane(document.getElementById('p1')!, { mode: 'dark' });
    await tick();
    brandingModel.value = bgModel;
    dispatchFrom(iframe, { type: 'STB_PREVIEW_READY' });
    const levers = sent(post, 'STB_APPLY_LEVERS').at(-1)!.levers;
    expect(levers).toContainEqual({ snapshotId: 'a.hero', kind: 'background', backgroundColor: '#111111' });
    expect(levers.filter((p: any) => p.backgroundColor === '#dddddd')).toHaveLength(0);
  });

  it('follow-global pane (default) still follows previewDark', async () => {
    const { iframe, post } = mountPane(document.getElementById('p1')!);
    await tick();
    dispatchFrom(iframe, { type: 'STB_PREVIEW_READY' });
    expect(sent(post, 'STB_SET_DARK')).toContainEqual({ type: 'STB_SET_DARK', dark: false });
    previewDark.value = true;
    expect(sent(post, 'STB_SET_DARK')).toContainEqual({ type: 'STB_SET_DARK', dark: true });
  });

  it('pinned pane ignores previewDark flips (no re-send, mode is pinned)', async () => {
    const { iframe, post } = mountPane(document.getElementById('p1')!, { mode: 'dark' });
    await tick();
    dispatchFrom(iframe, { type: 'STB_PREVIEW_READY' });
    post.mockClear();
    previewDark.value = true;
    expect(sent(post, 'STB_SET_DARK')).toHaveLength(0);
  });
});

describe('per-pane message scoping (two live panes)', () => {
  it('READY from pane A does not ready pane B, and a click selects only via the clicked pane', async () => {
    const selectedA = vi.fn();
    const selectedB = vi.fn();
    const a = mountPane(document.getElementById('p1')!, { onElementSelected: selectedA });
    const b = mountPane(document.getElementById('p2')!, { mode: 'dark', onElementSelected: selectedB });
    await tick();

    dispatchFrom(a.iframe, { type: 'STB_PREVIEW_READY' });
    expect(a.post).toHaveBeenCalled();
    expect(b.post).not.toHaveBeenCalled(); // B is not ready; A's READY must not leak

    dispatchFrom(a.iframe, { type: 'STB_ELEMENT_SELECTED', selector: 's', tokens: [], snapshotId: 'x' });
    expect(selectedA).toHaveBeenCalledTimes(1);
    expect(selectedB).not.toHaveBeenCalled();

    dispatchFrom(b.iframe, { type: 'STB_PREVIEW_READY' });
    dispatchFrom(b.iframe, { type: 'STB_ELEMENT_SELECTED', selector: 's', tokens: [], snapshotId: 'y' });
    expect(selectedB).toHaveBeenCalledTimes(1);
    expect(selectedA).toHaveBeenCalledTimes(1); // unchanged
  });
});

describe('mountCompareToggle', () => {
  function setup(dark = false) {
    document.body.innerHTML = `
      <div class="toggle-host"></div>
      <label><input type="checkbox" id="stb-preview-dark"></label>
      <div class="stb-preview-host">
        <div class="pane-a"></div>
        <div class="pane-b" hidden></div>
      </div>
    `;
    const darkToggle = document.getElementById('stb-preview-dark') as HTMLInputElement;
    previewDark.value = dark;
    darkToggle.checked = dark;
    const panesHost = document.querySelector('.stb-preview-host') as HTMLElement;
    const darkPaneHost = document.querySelector('.pane-b') as HTMLElement;
    const onFirstEnable = vi.fn();
    mountCompareToggle(document.querySelector('.toggle-host') as HTMLElement,
      { panesHost, darkPaneHost, darkToggle, onFirstEnable });
    const cb = document.querySelector('.toggle-host input[type="checkbox"]') as HTMLInputElement;
    return { cb, darkToggle, panesHost, darkPaneHost, onFirstEnable };
  }

  function flip(cb: HTMLInputElement, on: boolean): void {
    cb.checked = on;
    cb.dispatchEvent(new Event('change'));
  }

  it('renders a Compare checkbox, off by default (single-pane unchanged)', () => {
    const { cb, darkPaneHost, panesHost } = setup();
    expect(cb).toBeTruthy();
    expect(cb.checked).toBe(false);
    expect(compareMode.value).toBe(false);
    expect(darkPaneHost.hidden).toBe(true);
    expect(panesHost.classList.contains('stb-compare')).toBe(false);
  });

  it('toggle ON: reveals the dark pane host, flags compare, pins light, disables Dark preview', () => {
    const { cb, darkToggle, panesHost, darkPaneHost, onFirstEnable } = setup(true);
    flip(cb, true);
    expect(compareMode.value).toBe(true);
    expect(darkPaneHost.hidden).toBe(false);
    expect(panesHost.classList.contains('stb-compare')).toBe(true);
    // panes own the mode axis: primary pane pinned light, global control inert
    expect(previewDark.value).toBe(false);
    expect(darkToggle.checked).toBe(false);
    expect(darkToggle.disabled).toBe(true);
    expect(onFirstEnable).toHaveBeenCalledTimes(1);
  });

  it('toggle OFF: restores single pane and the saved Dark preview state', () => {
    const { cb, darkToggle, panesHost, darkPaneHost } = setup(true);
    flip(cb, true);
    flip(cb, false);
    expect(compareMode.value).toBe(false);
    expect(darkPaneHost.hidden).toBe(true);
    expect(panesHost.classList.contains('stb-compare')).toBe(false);
    expect(previewDark.value).toBe(true); // restored, not lost
    expect(darkToggle.checked).toBe(true);
    expect(darkToggle.disabled).toBe(false);
  });

  it('onFirstEnable fires once across repeated toggles (dark pane created lazily, kept)', () => {
    const { cb, onFirstEnable } = setup();
    flip(cb, true);
    flip(cb, false);
    flip(cb, true);
    expect(onFirstEnable).toHaveBeenCalledTimes(1);
  });
});

describe('lever editor initial position in compare mode', () => {
  it('opens ABOVE the panes (not in the left gutter) while compare is on', () => {
    document.body.innerHTML = '<div class="stb-preview-host"></div>';
    const previewHost = document.querySelector('.stb-preview-host') as HTMLElement;
    previewHost.getBoundingClientRect = () =>
      ({ top: 300, left: 0, width: 800, height: 400, right: 800, bottom: 700, x: 0, y: 300, toJSON: () => ({}) }) as DOMRect;
    compareMode.value = true;
    openLeverEditor({ previewHost, snapshotId: 'x', onChange: () => {}, facets: {} });
    const panel = document.querySelector('.stb-lever-editor') as HTMLElement;
    // jsdom offsetHeight = 0 → top = host.top - 0 - 8 = 292; left pinned to the edge
    expect(panel.style.top).toBe('292px');
    expect(panel.style.left).toBe('8px');
  });

  it('keeps the gutter placement when compare is off', () => {
    document.body.innerHTML = '<div class="stb-preview-host"></div>';
    const previewHost = document.querySelector('.stb-preview-host') as HTMLElement;
    previewHost.getBoundingClientRect = () =>
      ({ top: 300, left: 0, width: 800, height: 400, right: 800, bottom: 700, x: 0, y: 300, toJSON: () => ({}) }) as DOMRect;
    compareMode.value = false;
    openLeverEditor({ previewHost, snapshotId: 'x', onChange: () => {}, facets: {} });
    const panel = document.querySelector('.stb-lever-editor') as HTMLElement;
    // cardW = min(480, 800*0.5) = 400 → gutter = 200; panel width 0 → left = 200/2 = 100
    expect(panel.style.left).toBe('100px');
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentValue, assetValue, openLeverEditor, clearRememberedPanelRect } from '@/ui/lever-editor';
import { brandingModel, nodeFor, setNodeFacets, setNodeFacetsDark } from '@/state/branding';
import { setSide, setLayer } from '@/state/facets-edit';
import { previewDark, compareMode } from '@/state/scene';
import type { BrandingModel } from '@/metadata/types';

const cssDir = dirname(fileURLToPath(import.meta.url));
const stbCss = readFileSync(resolve(cssDir, '../../src/styles/stb.css'), 'utf8');

describe('lever-editor value helpers', () => {
  it('contentValue / assetValue shape the union', () => {
    expect(contentValue('Hi')).toEqual({ kind: 'content', text: 'Hi' });
    expect(contentValue('Hi', 'plain')).toEqual({ kind: 'content', text: 'Hi' }); // plain carries no format key
    expect(contentValue('**Hi**', 'subset')).toEqual({ kind: 'content', text: '**Hi**', format: 'subset' });
    expect(assetValue('logo.png')).toEqual({ kind: 'asset', ref: 'logo.png' });
  });
});

describe('lever-editor light+dark per-row editing (no toggle)', () => {
  beforeEach(() => { document.body.innerHTML = '<div class="host"></div>'; });
  afterEach(() => { brandingModel.value = null; });

  it('renders light and dark swatches for a color row simultaneously, with no radio', () => {
    const previewHost = document.querySelector('.host') as HTMLElement;
    openLeverEditor({
      previewHost,
      snapshotId: 'x',
      onChange: () => {},
      facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } },
      facetsDark: { text: { color: { literal: { l: 0.2, c: 0.05, h: 100 } } } },
      onFacetEdit: () => {},
      onFacetEditDark: () => {},
    });
    expect(document.querySelector('input[name="stb-edit-target"]')).toBeNull(); // radio fully removed
    const leaf = [...document.querySelectorAll('.stb-facet-leaf')]
      .find((l) => (l as HTMLElement).dataset.key === 'text.color')!;
    const lightBtn = leaf.querySelector('.stb-facet-swatch') as HTMLButtonElement;
    const darkBtn = leaf.querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
    expect(lightBtn).toBeTruthy();
    expect(darkBtn).toBeTruthy();
    expect(darkBtn.classList.contains('stb-facet-swatch-empty')).toBe(false); // dark literal is set
  });

  it('non-color rows render once and are unaffected by facetsDark', () => {
    const previewHost = document.querySelector('.host') as HTMLElement;
    openLeverEditor({
      previewHost,
      snapshotId: 'x',
      onChange: () => {},
      facets: { text: { fontSize: { literal: '14px' } } },
      facetsDark: { text: { fontSize: { literal: '20px' } } },
      onFacetEdit: () => {},
      onFacetEditDark: () => {},
    });
    const fontSizeLeaf = [...document.querySelectorAll('.stb-facet-leaf')]
      .find((l) => (l as HTMLElement).dataset.key === 'text.fontSize')!;
    const inputs = fontSizeLeaf.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBe(1);
    expect((inputs[0] as HTMLInputElement).value).toBe('14px'); // light only, dark bundle ignored
  });

  it('re-renders the dark field from the live model when facetsDark changes (no toggle)', () => {
    const previewHost = document.querySelector('.host') as HTMLElement;
    brandingModel.value = { scene: 's', nodes: [
      { snapshotId: 'x', role: '', name: null, description: '', facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } } },
    ] } as BrandingModel;
    openLeverEditor({
      previewHost, snapshotId: 'x', onChange: () => {},
      facets: { text: { color: { literal: { l: 0.5, c: 0.1, h: 250 } } } },
      facetsDark: {},
      onFacetEdit: () => {}, onFacetEditDark: () => {},
    });
    const darkBtn = () => [...document.querySelectorAll('.stb-facet-leaf')]
      .find((l) => (l as HTMLElement).dataset.key === 'text.color')!
      .querySelector('.stb-facet-swatch-dark') as HTMLButtonElement;
    expect(darkBtn().classList.contains('stb-facet-swatch-empty')).toBe(true); // dark empty before the edit
    // model edit arrives from outside the focused control
    setNodeFacetsDark('x', { text: { color: { literal: { l: 0.2, c: 0.05, h: 100 } } } });
    expect(darkBtn().classList.contains('stb-facet-swatch-empty')).toBe(false); // editor re-rendered from the live model
  });
});

describe('lever-editor composite-edit focus survival', () => {
  beforeEach(() => { document.body.innerHTML = '<div class="host"></div>'; });
  afterEach(() => { brandingModel.value = null; });

  it('typing into a spacing input mutates the model without unmounting the input (focus survives)', () => {
    const previewHost = document.querySelector('.host') as HTMLElement;
    brandingModel.value = { scene: 's', nodes: [
      { snapshotId: 'x', role: '', name: null, description: '', facets: { spacing: {} } },
    ] } as unknown as BrandingModel;
    openLeverEditor({
      previewHost, snapshotId: 'x', onChange: () => {},
      facets: nodeFor('x')!.facets,
      // wired the way main.ts wires it after the focus-survival fix: fresh
      // model read + single-slot write, NO editor rebuild on a typed edit
      onSetSide: (group, side, value) => {
        const n = nodeFor('x')!;
        setNodeFacets('x', setSide(n.facets, group, side, value));
      },
    });
    const input = document.querySelector('.stb-facet-spacing-side[data-stb-side="top"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    input.focus();
    input.value = '4px';
    input.dispatchEvent(new Event('input'));
    // the typed edit must land in the model AND leave the focused input mounted
    expect(nodeFor('x')!.facets.spacing?.padding?.top).toEqual({ literal: '4px' });
    expect(document.contains(input)).toBe(true);
    expect(document.activeElement).toBe(input);
  });

  it('re-renders an image layer row after a model update even while its file input has focus', () => {
    const previewHost = document.querySelector('.host') as HTMLElement;
    brandingModel.value = { scene: 's', nodes: [
      { snapshotId: 'x', role: '', name: null, description: '',
        facets: { background: { layers: [{ kind: 'image', ref: '' }] } } },
    ] } as unknown as BrandingModel;
    openLeverEditor({ previewHost, snapshotId: 'x', onChange: () => {}, facets: nodeFor('x')!.facets });
    const fileInput = document.querySelector('[data-stb-bg-row="layer"] input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();
    fileInput.focus();
    // as after a native file dialog: focus sits on the file input when the write lands.
    // A file input carries no in-flight typed text, so it must NOT suppress the re-render.
    setNodeFacets('x', setLayer(nodeFor('x')!.facets, 0, { kind: 'image', ref: 'assets/new-logo.png' }));
    const label = document.querySelector('[data-stb-bg-row="layer"] .stb-facet-bg-subtitle') as HTMLElement;
    expect(label.textContent).toBe('image — assets/new-logo.png');
  });
});

// Popover growth is CSS-driven (no fixed width/height, resize:both, a viewport-margin
// max-height cap) — jsdom doesn't lay out or paint, so pixel sizing can't be asserted
// here. These tests assert the structural hooks: no inline size is ever hardcoded at
// mount time (nothing pins the box before a manual resize), the drag handle and the
// resizable class both survive, and the stylesheet itself carries the intended cap.
// Visual growth (adding a background group and watching the panel expand) is deferred
// to the user's live poke.
describe('lever-editor popover sizing', () => {
  beforeEach(() => { document.body.innerHTML = '<div class="host"></div>'; });
  afterEach(() => { brandingModel.value = null; });

  it('mounts with no inline width/height — sizing is left to CSS (content-driven, not pinned)', () => {
    const previewHost = document.querySelector('.host') as HTMLElement;
    openLeverEditor({
      previewHost, snapshotId: 'x', onChange: () => {},
      facets: { text: { fontSize: { literal: '18px' } } },
    });
    const panel = document.querySelector('.stb-lever-editor') as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.style.width).toBe('');
    expect(panel.style.height).toBe('');
  });

  it('keeps the drag handle mounted alongside the resizable panel class', () => {
    const previewHost = document.querySelector('.host') as HTMLElement;
    openLeverEditor({
      previewHost, snapshotId: 'x', onChange: () => {},
      facets: { text: { fontSize: { literal: '18px' } } },
    });
    expect(document.querySelector('.stb-lever-drag')).not.toBeNull();
    expect(document.querySelector('.stb-lever-editor')).not.toBeNull();
  });

  it('the stylesheet caps popover growth at a viewport margin and keeps manual resize', () => {
    const rule = stbCss.match(/\.stb-lever-editor,\s*\.stb-color-picker\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toContain('max-height: calc(100vh - 2rem)');
    expect(rule).toContain('resize: both');
    // No fixed width/height in the rule — sizing stays intrinsic to content until capped.
    expect(rule).not.toMatch(/(?<!max-|min-)\bheight:/);
    expect(rule).not.toMatch(/(?<!max-|min-)\bwidth:/);
  });
});

describe('lever-editor compare-mode dark column', () => {
  beforeEach(() => { document.body.innerHTML = '<div class="host"></div>'; });
  afterEach(() => { brandingModel.value = null; previewDark.value = false; compareMode.value = false; });

  it('adds stb-preview-dark when compare mode is on, even though previewDark is pinned false', () => {
    compareMode.value = true;
    previewDark.value = false;
    const previewHost = document.querySelector('.host') as HTMLElement;
    openLeverEditor({
      previewHost, snapshotId: 'x', onChange: () => {},
      facets: { text: { fontSize: { literal: '18px' } } },
    });
    const panel = document.querySelector('.stb-lever-editor') as HTMLElement;
    expect(panel.classList.contains('stb-preview-dark')).toBe(true);
  });

  it('has no stb-preview-dark outside compare mode when previewDark is false', () => {
    compareMode.value = false;
    previewDark.value = false;
    const previewHost = document.querySelector('.host') as HTMLElement;
    openLeverEditor({
      previewHost, snapshotId: 'x', onChange: () => {},
      facets: { text: { fontSize: { literal: '18px' } } },
    });
    const panel = document.querySelector('.stb-lever-editor') as HTMLElement;
    expect(panel.classList.contains('stb-preview-dark')).toBe(false);
  });
});

// --- panel position memory ---
// jsdom does no layout: getBoundingClientRect is mocked on the live panel to
// stand in for a user drag/resize; the drag handle's mousedown→mouseup pair is
// what marks the placement as user-chosen (an undragged rebuild keeps defaults).
describe('lever-editor position memory across teardown/rebuild', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div class="host"></div>';
    clearRememberedPanelRect();
    compareMode.value = false;
  });
  afterEach(() => { brandingModel.value = null; });

  const open = () => {
    const previewHost = document.querySelector('.host') as HTMLElement;
    openLeverEditor({ previewHost, snapshotId: 'x', onChange: () => {}, facets: {} });
    return document.querySelector('.stb-lever-editor') as HTMLElement;
  };
  const rect = (left: number, top: number, width: number, height: number) =>
    ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
  const dragPanel = (panel: HTMLElement) => {
    const handle = panel.querySelector('.stb-lever-drag') as HTMLElement;
    handle.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }));
    window.dispatchEvent(new MouseEvent('mouseup'));
  };

  it('reopens at the dragged position and resized size', () => {
    const p1 = open();
    p1.getBoundingClientRect = () => rect(120, 80, 300, 200);
    dragPanel(p1);
    const p2 = open(); // rebuild (selectElement path): closeOpen captures, reopen restores
    expect(p2.style.left).toBe('120px');
    expect(p2.style.top).toBe('80px');
    expect(p2.style.width).toBe('300px');   // size differed from mount-time size → resized
    expect(p2.style.height).toBe('200px');
  });

  it('clamps a remembered rect to the viewport on reuse (window may have shrunk)', () => {
    const p1 = open();
    p1.getBoundingClientRect = () => rect(5000, 4000, 300, 200);
    dragPanel(p1);
    const p2 = open();
    expect(p2.style.left).toBe(`${window.innerWidth - 300}px`);
    expect(p2.style.top).toBe(`${window.innerHeight - 200}px`);
  });

  it('an undragged, unresized rebuild keeps the default placement (no false memory)', () => {
    open();
    const p2 = open();
    // default gutter placement in jsdom (zero-rect host) resolves to the 8px floor
    expect(p2.style.left).toBe('8px');
    expect(p2.style.width).toBe('');
  });

  it('dragged position persists across an explicit Close (policy: no re-placing)', () => {
    const p1 = open();
    p1.getBoundingClientRect = () => rect(120, 80, 300, 200);
    dragPanel(p1);
    (p1.querySelector('.stb-lever-close') as HTMLButtonElement).click();
    const p2 = open();
    expect(p2.style.left).toBe('120px');
    expect(p2.style.top).toBe('80px');
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { contentValue, assetValue, openLeverEditor } from '@/ui/lever-editor';
import { brandingModel, nodeFor, setNodeFacets, setNodeFacetsDark } from '@/state/branding';
import { setSide, setLayer } from '@/state/facets-edit';
import type { BrandingModel } from '@/metadata/types';

describe('lever-editor value helpers', () => {
  it('contentValue / assetValue shape the union', () => {
    expect(contentValue('Hi')).toEqual({ kind: 'content', text: 'Hi' });
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
    const label = document.querySelector('[data-stb-bg-row="layer"] .stb-facet-leaf-label') as HTMLElement;
    expect(label.textContent).toBe('assets/new-logo.png');
  });
});

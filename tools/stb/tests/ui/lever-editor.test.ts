import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { contentValue, assetValue, openLeverEditor } from '@/ui/lever-editor';
import { brandingModel, setNodeFacetsDark } from '@/state/branding';
import type { BrandingModel } from '@/metadata/types';

describe('lever-editor value helpers', () => {
  it('contentValue / assetValue shape the union', () => {
    expect(contentValue('Hi')).toEqual({ kind: 'content', text: 'Hi' });
    expect(assetValue('logo.png')).toEqual({ kind: 'asset', ref: 'logo.png' });
  });
});

describe('lever-editor light/dark target', () => {
  beforeEach(() => { document.body.innerHTML = '<div class="host"></div>'; });
  afterEach(() => { brandingModel.value = null; });

  it('switches the tree to the dark bundle when dark is selected', () => {
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
    const fontSizeInput = () =>
      [...document.querySelectorAll('.stb-facet-leaf')]
        .find((l) => (l as HTMLElement).dataset.key === 'text.fontSize')!
        .querySelector('input[type="text"]') as HTMLInputElement;
    expect(fontSizeInput().value).toBe('14px');               // light first
    const darkRadio = document.querySelector('input[value="dark"]') as HTMLInputElement;
    darkRadio.checked = true;
    darkRadio.dispatchEvent(new Event('change'));
    expect(fontSizeInput().value).toBe('20px');               // re-rendered from dark bundle
  });

  it('re-renders the tree from the live model when facetsDark changes (no toggle)', () => {
    const previewHost = document.querySelector('.host') as HTMLElement;
    brandingModel.value = { scene: 's', nodes: [
      { snapshotId: 'x', role: '', name: null, description: '', facets: { text: { fontSize: { literal: '14px' } } } },
    ] } as BrandingModel;
    openLeverEditor({
      previewHost, snapshotId: 'x', onChange: () => {},
      facets: { text: { fontSize: { literal: '14px' } } },
      facetsDark: {},
      onFacetEdit: () => {}, onFacetEditDark: () => {},
    });
    // switch to dark target (dark bundle is empty → input blank)
    const darkRadio = document.querySelector('input[value="dark"]') as HTMLInputElement;
    darkRadio.checked = true; darkRadio.dispatchEvent(new Event('change'));
    const fontSizeInput = () =>
      [...document.querySelectorAll('.stb-facet-leaf')]
        .find((l) => (l as HTMLElement).dataset.key === 'text.fontSize')!
        .querySelector('input[type="text"]') as HTMLInputElement;
    expect(fontSizeInput().value).toBe('');               // dark empty before the edit
    // model edit arrives from outside the focused control
    setNodeFacetsDark('x', { text: { fontSize: { literal: '20px' } } });
    expect(fontSizeInput().value).toBe('20px');           // editor re-rendered from the live model
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { contentValue, assetValue, openLeverEditor } from '@/ui/lever-editor';

describe('lever-editor value helpers', () => {
  it('contentValue / assetValue shape the union', () => {
    expect(contentValue('Hi')).toEqual({ kind: 'content', text: 'Hi' });
    expect(assetValue('logo.png')).toEqual({ kind: 'asset', ref: 'logo.png' });
  });
});

describe('lever-editor light/dark target', () => {
  beforeEach(() => { document.body.innerHTML = '<div class="host"></div>'; });

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
});

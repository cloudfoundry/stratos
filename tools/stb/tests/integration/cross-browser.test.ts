import { describe, it, expect, beforeAll } from 'vitest';
import { loadBuiltInPreset } from '@/state/presets';
import { mountTokenSidebar } from '@/ui/token-sidebar';
import { rootValues } from '@/state/tokens';

describe('cross-browser smoke', () => {
  beforeAll(async () => { await loadBuiltInPreset('stratos-default'); });

  it('mounts token sidebar with stratos-default values', () => {
    document.body.innerHTML = '<div id="host"></div>';
    mountTokenSidebar(document.getElementById('host')!);
    const rows = document.querySelectorAll('.stb-token-row');
    expect(rows.length).toBeGreaterThan(0);
    // Brand-500 swatch should be tinted
    const brand500 = document.querySelector('.stb-swatch[data-token="--color-brand-500"]') as HTMLElement;
    expect(brand500).toBeTruthy();
    expect(brand500.style.backgroundColor).not.toBe('');
  });

  it('rootValues map populated', () => {
    expect(rootValues.value.get('--color-brand-500')).toBe('#2196f3');
  });
});

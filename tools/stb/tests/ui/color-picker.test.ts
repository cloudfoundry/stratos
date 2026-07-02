import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openColorPicker, closeOpenPicker } from '@/ui/color-picker';
import { compareMode } from '@/state/scene';
import * as popover from '@/ui/popover';

describe('color-picker compare-mode placement', () => {
  beforeEach(() => { document.body.innerHTML = '<div class="host"></div>'; });
  afterEach(() => { closeOpenPicker(); compareMode.value = false; vi.restoreAllMocks(); });

  it('positions via the above-panes path when compare mode is on', () => {
    const aboveSpy = vi.spyOn(popover, 'positionAbovePanes');
    const gutterSpy = vi.spyOn(popover, 'positionInPreviewGutter');
    compareMode.value = true;
    const previewHost = document.querySelector('.host') as HTMLElement;
    openColorPicker({ previewHost, initial: '#ff0000', format: 'hex', onChange: () => {} });
    expect(aboveSpy).toHaveBeenCalledWith(expect.any(HTMLElement), previewHost);
    expect(gutterSpy).not.toHaveBeenCalled();
  });

  it('positions via the gutter path outside compare mode', () => {
    const aboveSpy = vi.spyOn(popover, 'positionAbovePanes');
    const gutterSpy = vi.spyOn(popover, 'positionInPreviewGutter');
    compareMode.value = false;
    const previewHost = document.querySelector('.host') as HTMLElement;
    openColorPicker({ previewHost, initial: '#ff0000', format: 'hex', onChange: () => {} });
    expect(gutterSpy).toHaveBeenCalledWith(expect.any(HTMLElement), previewHost);
    expect(aboveSpy).not.toHaveBeenCalled();
  });
});

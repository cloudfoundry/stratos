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

describe('color-picker clear and transparent', () => {
  beforeEach(() => { document.body.innerHTML = '<div class="host"></div>'; });
  afterEach(() => { closeOpenPicker(); });

  const host = () => document.querySelector('.host') as HTMLElement;
  const active = () => document.getElementById('stb-color-picker-active');

  it('renders a Clear button only when onClear is provided; clicking clears and closes', () => {
    openColorPicker({ previewHost: host(), initial: '#ff0000', format: 'hex', onChange: () => {} });
    expect(active()!.querySelector('.stb-color-clear')).toBeNull();
    closeOpenPicker();

    const onClear = vi.fn();
    openColorPicker({ previewHost: host(), initial: '#ff0000', format: 'hex', onChange: () => {}, onClear });
    const btn = active()!.querySelector('.stb-color-clear') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    expect(onClear).toHaveBeenCalledOnce();
    expect(active()).toBeNull();
  });

  it("accepts the keyword 'transparent' in the text field", () => {
    const onChange = vi.fn();
    openColorPicker({ previewHost: host(), initial: '#ff0000', format: 'hex', onChange });
    const text = active()!.querySelector('.stb-color-text') as HTMLInputElement;
    text.value = ' Transparent ';
    text.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledWith('transparent');
  });
});

describe('color-picker outside-click handler lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div class="host"></div>';
  });
  afterEach(() => { closeOpenPicker(); vi.useRealTimers(); });

  const host = () => document.querySelector('.host') as HTMLElement;
  const open = () => openColorPicker({ previewHost: host(), initial: '#ff0000', format: 'hex', onChange: () => {} });
  const active = () => document.getElementById('stb-color-picker-active');

  it('a swatch click while a picker is open leaves the new picker open', () => {
    open();               // picker A (swatch click #1)
    vi.runAllTimers();    // A's outside-click handler registers
    // swatch click #2: the swatch listener opens B, then the same click bubbles to document
    open();               // picker B
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    vi.runAllTimers();
    expect(active()).not.toBeNull();
  });

  it('closing via the Close button leaves no handler that kills the next picker', () => {
    open();               // picker A
    vi.runAllTimers();
    (active()!.querySelector('.stb-close') as HTMLButtonElement).click();
    expect(active()).toBeNull();
    open();               // picker B
    vi.runAllTimers();
    // a click INSIDE B must not close it (A's stale handler would)
    active()!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(active()).not.toBeNull();
  });

  it('reopens after an outside click closed the previous picker', () => {
    open();
    vi.runAllTimers();
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true })); // outside → closes
    expect(active()).toBeNull();
    open();
    vi.runAllTimers();
    expect(active()).not.toBeNull();
    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));      // stale handler would kill it
    vi.runAllTimers();
    // the picker just opened by this cycle must still be closable/openable, not zombie-closed
    open();
    vi.runAllTimers();
    expect(active()).not.toBeNull();
  });
});

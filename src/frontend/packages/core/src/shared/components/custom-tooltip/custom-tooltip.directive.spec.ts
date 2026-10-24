import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { CustomTooltipDirective } from './custom-tooltip.directive';

@Component({
  imports: [CustomTooltipDirective],
  template: `<button [matTooltip]="text()">host</button>`
})
class TestHostComponent {
  readonly text = signal('placeholder');
}

describe('CustomTooltipDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let directive: CustomTooltipDirective;

  // Binds the tooltip text through the host template, as an app does.
  // Timers are fake, so run the change-detection timer before waiting.
  async function setText(text: string) {
    fixture.componentInstance.text.set(text);
    await vi.advanceTimersByTimeAsync(0);
    await fixture.whenStable();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [TestHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    await fixture.whenStable();
    vi.useFakeTimers();
    const el = fixture.debugElement.query(By.directive(CustomTooltipDirective));
    directive = el.injector.get(CustomTooltipDirective);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.querySelectorAll('.custom-tooltip').forEach(n => n.remove());
  });

  // Tooltips carry simple HTML markup (e.g. <b> for emphasis), so the
  // directive renders sanitized HTML rather than plain text — formatting is
  // preserved while XSS vectors are stripped.
  it('preserves safe HTML formatting such as <b>', async () => {
    await setText('roles for <b>alice</b>');
    directive.onMouseEnter(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);

    const tip = document.body.querySelector('.custom-tooltip');
    expect(tip).toBeTruthy();
    expect(tip?.querySelector('b')?.textContent).toBe('alice');
    expect(tip?.textContent).toBe('roles for alice');
  });

  // Chrome does not fire mouseleave when the host moves/changes under the
  // pointer (e.g. a menu opening), which left tooltips stuck open. While a
  // tooltip is visible, a document-level mousemove guard hides it as soon as
  // the pointer is outside the host.
  it('hides when the pointer moves outside the host even if mouseleave never fired', async () => {
    await setText('Recent activity');
    directive.onMouseEnter(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);
    expect(document.body.querySelector('.custom-tooltip')).toBeTruthy();

    // No mouseleave — pointer just shows up somewhere else
    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    expect(document.body.querySelector('.custom-tooltip')).toBeNull();
  });

  it('stays visible while the pointer moves within the host', async () => {
    await setText('Recent activity');
    directive.onMouseEnter(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);

    const host = fixture.debugElement.query(By.directive(CustomTooltipDirective)).nativeElement;
    host.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));

    expect(document.body.querySelector('.custom-tooltip')).toBeTruthy();
  });

  // Clicking the host usually opens a menu — the tooltip must not linger over it
  it('hides immediately on mousedown', async () => {
    await setText('User menu');
    directive.onMouseEnter(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);
    expect(document.body.querySelector('.custom-tooltip')).toBeTruthy();

    directive.onMouseDown();

    expect(document.body.querySelector('.custom-tooltip')).toBeNull();
  });

  // Tooltip text can carry untrusted values (e.g. CF usernames). The
  // sanitizer must drop scripts and event handlers while keeping the text.
  it('strips XSS vectors (scripts, event handlers) from tooltip text', async () => {
    await setText('<img src=x onerror="alert(1)"><script>alert(2)</script>alice');
    directive.onMouseEnter(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);

    const tip = document.body.querySelector('.custom-tooltip');
    expect(tip).toBeTruthy();
    expect(tip?.querySelector('script')).toBeNull();
    expect(tip?.innerHTML.toLowerCase()).not.toContain('onerror');
    expect(tip?.textContent).toContain('alice');
  });
});

@Component({
  imports: [CustomTooltipDirective],
  template: `
    <button aria-describedby="hint" [matTooltip]="text()" [matTooltipDisabled]="disabled()">host</button>
    <span id="hint">hint</span>
    <button class="other">other</button>
  `
})
class KeyboardHostComponent {
  text = signal('Delete space');
  disabled = signal(false);
}

// WCAG 2.2 SC 1.4.13 (Content on Hover or Focus): a tooltip must also show
// for keyboard focus, be dismissible with Escape, stay while the pointer is
// over it, and persist until hover/focus ends. Screen readers get it through
// role="tooltip" and the host's aria-describedby.
describe('CustomTooltipDirective keyboard and screen reader support', () => {
  let fixture: ComponentFixture<KeyboardHostComponent>;
  let host: HTMLButtonElement;
  let other: HTMLButtonElement;

  const tip = () => document.body.querySelector<HTMLElement>('.custom-tooltip');

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [KeyboardHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(KeyboardHostComponent);
    await fixture.whenStable();
    host = fixture.debugElement.query(By.directive(CustomTooltipDirective)).nativeElement;
    other = fixture.nativeElement.querySelector('.other');
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    document.querySelectorAll('.custom-tooltip').forEach(n => n.remove());
  });

  it('shows on keyboard focus after the show delay and hides on blur after the hide delay', () => {
    host.focus();
    vi.advanceTimersByTime(200);
    expect(tip()).toBeNull();
    vi.advanceTimersByTime(100);
    expect(tip()?.textContent).toBe('Delete space');

    other.focus();
    vi.advanceTimersByTime(50);
    expect(tip()).toBeTruthy();
    vi.advanceTimersByTime(100);
    expect(tip()).toBeNull();
  });

  // A mouse click focuses the button too, but that focus is not
  // :focus-visible — the click already dismissed the hover tooltip and
  // usually opens a menu, so it must not bring the tooltip back.
  it('does not show for focus that is not :focus-visible (mouse click)', () => {
    vi.spyOn(host, 'matches').mockImplementation(selector => selector !== ':focus-visible');
    host.focus();
    vi.advanceTimersByTime(300);
    expect(tip()).toBeNull();
  });

  it('stays while focused even when the pointer moves elsewhere', () => {
    host.focus();
    vi.advanceTimersByTime(300);
    host.dispatchEvent(new MouseEvent('mouseenter'));
    host.dispatchEvent(new MouseEvent('mouseleave'));
    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    vi.advanceTimersByTime(1000);
    expect(tip()).toBeTruthy();
  });

  it('Escape hides a focus tooltip without moving focus', () => {
    host.focus();
    vi.advanceTimersByTime(300);
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    host.dispatchEvent(escape);

    expect(tip()).toBeNull();
    expect(document.activeElement).toBe(host);
    // Consumed, so an enclosing dialog does not also close on this press
    expect(escape.defaultPrevented).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(tip()).toBeNull();
  });

  it('Escape hides a hover tooltip wherever focus is', () => {
    other.focus();
    host.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);
    expect(tip()).toBeTruthy();

    other.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(tip()).toBeNull();
    expect(document.activeElement).toBe(other);
  });

  // Dialogs, menus, selects and the side panel close on Escape: with no
  // tooltip on screen the press must reach them untouched.
  it('leaves Escape alone when no tooltip is shown', () => {
    const page = vi.fn();
    document.addEventListener('keydown', page);
    host.focus();
    vi.advanceTimersByTime(100);
    expect(tip()).toBeNull();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    host.dispatchEvent(escape);
    document.removeEventListener('keydown', page);

    expect(escape.defaultPrevented).toBe(false);
    expect(page).toHaveBeenCalledTimes(1);
  });

  it('ignores keys other than Escape', () => {
    host.focus();
    vi.advanceTimersByTime(300);
    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(tip()).toBeTruthy();
  });

  // The pointer crosses the gap between host and tooltip and rests on the
  // tooltip: neither the pending hide nor the document mousemove guard may
  // remove it on the way.
  it('stays while the pointer moves from the host onto the tooltip', () => {
    host.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);
    const shown = tip()!;
    expect(shown.style.pointerEvents).not.toBe('none');

    host.dispatchEvent(new MouseEvent('mouseleave'));
    document.body.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    shown.dispatchEvent(new MouseEvent('mouseenter'));
    shown.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    vi.advanceTimersByTime(1000);
    expect(tip()).toBe(shown);

    // Back onto the host: the same tooltip stays, it is not rebuilt
    shown.dispatchEvent(new MouseEvent('mouseleave'));
    host.dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(1000);
    expect(tip()).toBe(shown);

    host.dispatchEvent(new MouseEvent('mouseleave'));
    shown.dispatchEvent(new MouseEvent('mouseenter'));
    shown.dispatchEvent(new MouseEvent('mouseleave'));
    vi.advanceTimersByTime(100);
    expect(tip()).toBeNull();
  });

  it('gives the tooltip role="tooltip" and adds it to the host aria-describedby while shown', () => {
    host.focus();
    vi.advanceTimersByTime(300);
    const shown = tip()!;
    expect(shown.getAttribute('role')).toBe('tooltip');
    expect(shown.id).toMatch(/\S/);
    expect(document.querySelectorAll(`[id="${shown.id}"]`).length).toBe(1);
    expect(host.getAttribute('aria-describedby')).toBe(`hint ${shown.id}`);

    other.focus();
    vi.advanceTimersByTime(100);
    expect(host.getAttribute('aria-describedby')).toBe('hint');
  });

  it('removes aria-describedby it added when the host had none', () => {
    host.removeAttribute('aria-describedby');
    host.focus();
    vi.advanceTimersByTime(300);
    expect(host.getAttribute('aria-describedby')).toBe(tip()!.id);

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(host.hasAttribute('aria-describedby')).toBe(false);
  });

  it('hides when the tooltip is disabled while shown', () => {
    host.focus();
    vi.advanceTimersByTime(300);
    expect(tip()).toBeTruthy();

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();

    expect(tip()).toBeNull();
    expect(host.getAttribute('aria-describedby')).toBe('hint');
  });

  it('hides when the tooltip text is cleared while shown', () => {
    host.focus();
    vi.advanceTimersByTime(300);
    expect(tip()).toBeTruthy();

    fixture.componentInstance.text.set('');
    fixture.detectChanges();

    expect(tip()).toBeNull();
  });
});

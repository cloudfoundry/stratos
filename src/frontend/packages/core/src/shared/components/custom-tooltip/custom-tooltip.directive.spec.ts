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

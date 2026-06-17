import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';
import { CustomTooltipDirective } from './custom-tooltip.directive';

@Component({
  imports: [CustomTooltipDirective],
  template: `<button matTooltip="placeholder">host</button>`
})
class TestHostComponent { }

describe('CustomTooltipDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let directive: CustomTooltipDirective;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [TestHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
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
  it('preserves safe HTML formatting such as <b>', () => {
    directive.tooltipText = 'roles for <b>alice</b>';
    directive.onMouseEnter(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);

    const tip = document.body.querySelector('.custom-tooltip');
    expect(tip).toBeTruthy();
    expect(tip?.querySelector('b')?.textContent).toBe('alice');
    expect(tip?.textContent).toBe('roles for alice');
  });

  // Tooltip text can carry untrusted values (e.g. CF usernames). The
  // sanitizer must drop scripts and event handlers while keeping the text.
  it('strips XSS vectors (scripts, event handlers) from tooltip text', () => {
    directive.tooltipText = '<img src=x onerror="alert(1)"><script>alert(2)</script>alice';
    directive.onMouseEnter(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);

    const tip = document.body.querySelector('.custom-tooltip');
    expect(tip).toBeTruthy();
    expect(tip?.querySelector('script')).toBeNull();
    expect(tip?.innerHTML.toLowerCase()).not.toContain('onerror');
    expect(tip?.textContent).toContain('alice');
  });
});

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

  // Tooltip text can carry untrusted values (e.g. CF usernames). The directive
  // must render it as text, never parse it as HTML.
  it('renders tooltip text as plain text, not parsed HTML (XSS-safe)', () => {
    const payload = '<img src=x onerror="alert(1)">alice';
    directive.tooltipText = payload;
    directive.onMouseEnter(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(300);

    const tip = document.body.querySelector('.custom-tooltip');
    expect(tip).toBeTruthy();
    expect(tip?.textContent).toBe(payload);
    expect(tip?.querySelector('img')).toBeNull();
  });
});

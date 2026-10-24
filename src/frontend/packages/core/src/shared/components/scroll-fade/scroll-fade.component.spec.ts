import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ScrollFadeComponent } from './scroll-fade.component';

// happy-dom has no layout, so the scroll sizes are set by hand.
function sizes(el: HTMLElement, s: Record<string, number>) {
  for (const [k, v] of Object.entries(s)) {
    Object.defineProperty(el, k, { configurable: true, value: v });
  }
}

describe('ScrollFadeComponent', () => {
  it('shows a fade only on the edges that have more to scroll to', async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollFadeComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(ScrollFadeComponent);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const body = host.querySelector<HTMLElement>('[data-test="scroll-fade-body"]')!;
    const fades = () => [...host.querySelectorAll('[aria-hidden="true"]')].map(e => e.getAttribute('data-test'));

    expect(fades()).toEqual([]);

    sizes(body, { clientHeight: 100, scrollHeight: 300, scrollTop: 0, clientWidth: 200, scrollWidth: 500, scrollLeft: 0 });
    body.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(fades()).toEqual(['scroll-fade-bottom', 'scroll-fade-right']);

    sizes(body, { scrollTop: 200, scrollLeft: 300 });
    body.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(fades()).toEqual([]);
  });
});

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AppProgressBarComponent } from './app-progress-bar.component';

@Component({
  standalone: true,
  imports: [AppProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-progress-bar /><app-progress-bar mode="determinate" [value]="40" label="Time before sign-out" />`,
})
class HostComponent {}

// WCAG 4.1.2: a progress bar needs a name (axe-core aria-progressbar-name).
describe('ProgressBarComponent', () => {
  it('is named "Loading" unless the caller names it', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const bars = [...fixture.nativeElement.querySelectorAll('[role=progressbar]')] as HTMLElement[];
    expect(bars.map(b => b.getAttribute('aria-label'))).toEqual(['Loading', 'Time before sign-out']);
    expect(bars[1].getAttribute('aria-valuenow')).toBe('40');
  });
});

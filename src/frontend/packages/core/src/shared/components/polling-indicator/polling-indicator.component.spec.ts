import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { CoreModule } from '../../../core/core.module';
import { PollingIndicatorComponent } from './polling-indicator.component';


describe('PollingIndicatorComponent', () => {
  let component: PollingIndicatorComponent;
  let fixture: ComponentFixture<PollingIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        PollingIndicatorComponent,
        CoreModule,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PollingIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Refresh turns off while a poll runs. A disabled button that held focus
  // drops it to the page body (WCAG 2.4.3), so it is aria-disabled and
  // ignores the press instead.
  for (const fabButton of [false, true]) {
    it(`keeps Refresh focusable while it cannot poll (fabButton ${fabButton})`, async () => {
      fixture.componentRef.setInput('fabButton', fabButton);
      fixture.componentRef.setInput('manualPoll', false);
      const polls = vi.fn();
      component.poll.subscribe(polls);
      await fixture.whenStable();
      const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

      expect(button.disabled).toBe(false);
      expect(button.getAttribute('aria-disabled')).toBe('true');
      button.click();
      expect(polls).not.toHaveBeenCalled();

      fixture.componentRef.setInput('manualPoll', true);
      await fixture.whenStable();
      expect(button.hasAttribute('aria-disabled')).toBe(false);
      button.click();
      expect(polls).toHaveBeenCalledOnce();
    });
  }
});

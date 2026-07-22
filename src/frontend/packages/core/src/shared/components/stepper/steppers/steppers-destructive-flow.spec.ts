import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

import { TabNavService } from '../../../../tab-nav.service';
import { SignalStepHandle, StepComponent } from '../step/step.component';
import { SteppersComponent } from './steppers.component';

// Reproduces the manage-users / remove-user Shape-3 wizard: two
// signal-handle steps where the second is a destructive two-click
// confirm. Pins the full Next → confirm-entry → Apply-enabled lifecycle —
// the destructive-step busy delay must release the Apply button.
@Component({
  template: `
    <app-steppers [nextButtonProgress]="false">
      <app-step title="Select" [signalHandle]="selectHandle"></app-step>
      <app-step title="Confirm" [signalHandle]="confirmHandle"></app-step>
    </app-steppers>
  `,
  standalone: true,
  imports: [SteppersComponent, StepComponent],
})
class DestructiveWizardHostComponent {
  applied = signal(false);
  selectHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    submit: async () => { /* advance */ },
  };
  confirmHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    destructiveStep: signal(true).asReadonly(),
    submit: async () => {
      this.applied.set(true);
      return { ignoreSuccess: true };
    },
  };
}

describe('Steppers destructive two-click flow', () => {
  let fixture: ComponentFixture<DestructiveWizardHostComponent>;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [DestructiveWizardHostComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([]),
        TabNavService,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DestructiveWizardHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => vi.useRealTimers());

  const nextButton = (): HTMLButtonElement =>
    fixture.nativeElement.querySelector('#stepper_next');

  it('enables Apply on the destructive confirm step after the entry busy delay', async () => {
    expect(nextButton().disabled).toBe(false);

    nextButton().click();
    await vi.runAllTimersAsync();
    fixture.detectChanges();

    // Now on the confirm step: the destructive-entry busy delay has elapsed
    // (timers ran), so Apply must be clickable.
    expect(nextButton().disabled).toBe(false);

    nextButton().click();
    await vi.runAllTimersAsync();
    fixture.detectChanges();
    expect(fixture.componentInstance.applied()).toBe(true);
  });
});

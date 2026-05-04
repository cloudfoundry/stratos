import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../../core/core.module';
import { MDAppModule } from '../../../../core/md.module';
import { StepComponent } from '../step/step.component';
import { SteppersComponent } from './steppers.component';

describe('SteppersComponent', () => {
  let component: SteppersComponent;
  let fixture: ComponentFixture<SteppersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({

      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],

      imports: [
        MDAppModule,
        RouterTestingModule,
        CommonModule,
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
        SteppersComponent,
      ]

    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SteppersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // Regression: dev.56 shipped a template change that swapped @if-wrapped
  // steps for [hidden] bindings so the stepper's one-shot @ContentChildren
  // capture sees all steps at ngAfterContentInit. That exposed a second
  // zoneless-CD bug: onHidden → filterSteps reassigns this.steps but
  // without markForCheck the template kept rendering the step list from
  // the initial filter. Routes step would never appear even after routes
  // loaded. This test pins the filter path to mark for check.
  it('re-filters visible steps and marks for check when a step unhides', () => {
    const stepA = Object.assign(new StepComponent(), { title: 'A' });
    const stepB = Object.assign(new StepComponent(), { title: 'B' });
    const stepC = Object.assign(new StepComponent(), { title: 'C' });
    stepA.hidden = true;
    stepB.hidden = false;
    stepC.hidden = false;
    (component as any).allSteps = [stepA, stepB, stepC];
    (component as any).filterSteps();
    expect(component.steps).toEqual([stepB, stepC]);

    const cdr = (component as any).cdr as ChangeDetectorRef;
    const markForCheck = vi.spyOn(cdr, 'markForCheck');
    stepA.hidden = false;
    (component as any).filterSteps();
    expect(component.steps).toEqual([stepA, stepB, stepC]);
    expect(markForCheck).toHaveBeenCalled();
  });
});

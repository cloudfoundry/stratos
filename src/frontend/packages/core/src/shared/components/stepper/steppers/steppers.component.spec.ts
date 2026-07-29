import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Directive, Input, OnChanges, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../../core/core.module';
import { MDAppModule } from '../../../../core/md.module';
import { SignalStepHandle, StepComponent } from '../step/step.component';
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
  // zoneless-CD bug: hiddenChange → filterSteps reassigns this.steps but
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

  // Regression: step content is instantiated lazily (the ngTemplateOutlet
  // on currentIndex), so a synchronous pOnEnter inside setActive ran
  // before any @ViewChild referenced by a signal-handle onEnter body
  // existed — the enter callback was silently dropped and, e.g., the
  // bind-service wizard's Service Instance step rendered empty. Delivery
  // must happen after the activating render, with the routed enterData.
  it('delivers onEnter after the activating render, not synchronously', async () => {
    const stepA = Object.assign(new StepComponent(), { title: 'A' });
    const stepB = Object.assign(new StepComponent(), { title: 'B' });
    stepA.valid = true;
    const entered: unknown[] = [];
    stepB.signalHandle = {
      valid: (() => true) as any,
      onEnter: (data?: unknown) => { entered.push(data); },
    };
    (component as any).allSteps = [stepA, stepB];
    (component as any).filterSteps();
    (component as any).enterData = { plan: 'p1' };

    component.setActive(1);
    // Not delivered synchronously — the entering step's child does not
    // exist yet at this point in the real app.
    expect(entered).toEqual([]);

    await fixture.whenStable();
    expect(entered).toEqual([{ plan: 'p1' }]);
  });
});

// The suite above builds StepComponent instances by hand and assigns
// allSteps directly. That covers setActive's bookkeeping but never renders a
// stepper, so nothing there can observe how projected step content is
// actually instantiated — which is how an incorrect claim about lazy
// instantiation sat in setActive's comment unchallenged. These mount a real
// <app-steppers> with projected content instead.
const projectionLog: string[] = [];

@Directive({ selector: '[probeInput]', standalone: true })
class ProbeInputDirective implements OnChanges {
  @Input() probeInput = '';
  ngOnChanges(): void {
    projectionLog.push(`ngOnChanges:${this.probeInput}`);
  }
}

@Component({ selector: 'probe-first', template: 'first', standalone: true })
class ProbeFirstComponent {
  constructor() { projectionLog.push('ctor:first'); }
}

@Component({
  selector: 'probe-second',
  standalone: true,
  imports: [ProbeInputDirective],
  // Nested @if mirrors deploy-application-step2, where the directive whose
  // first-render ngOnChanges caused the trouble sits behind two of them.
  template: `@if (outer) { @if (inner) { <span [probeInput]="token"></span> } }`,
})
class ProbeSecondComponent {
  outer = true;
  inner = true;
  token = 'ctx';
  constructor() { projectionLog.push('ctor:second'); }
}

@Component({
  standalone: true,
  imports: [SteppersComponent, StepComponent, ProbeFirstComponent, ProbeSecondComponent],
  template: `
    <app-steppers>
      <app-step [title]="'One'" [signalHandle]="firstHandle"><probe-first></probe-first></app-step>
      <app-step [title]="'Two'" [signalHandle]="secondHandle"><probe-second></probe-second></app-step>
    </app-steppers>
  `,
})
class ProjectionHostComponent {
  entered: string[] = [];
  firstHandle: SignalStepHandle = { valid: signal(true) };
  secondHandle: SignalStepHandle = {
    valid: signal(true),
    onEnter: () => { this.entered.push('two'); },
  };
}

describe('SteppersComponent — projected step content', () => {
  let hostFixture: ComponentFixture<ProjectionHostComponent>;

  beforeEach(async () => {
    projectionLog.length = 0;
    TestBed.configureTestingModule({
      imports: [ProjectionHostComponent, RouterTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    await TestBed.compileComponents();
    hostFixture = TestBed.createComponent(ProjectionHostComponent);
    hostFixture.detectChanges();
    await hostFixture.whenStable();
  });

  // Ivy does not defer <ng-content> inside an <ng-template>: every step's
  // projected content is constructed with the declaring view, whichever step
  // is active. Anything reasoning about when a step's directives run — an
  // @Input's ngOnChanges firing, a service touched on first render — must
  // assume it happens up-front, not on activation. #5710.
  it('constructs and change-detects a NON-active step on first render', () => {
    expect(projectionLog).toContain('ctor:first');
    // Step Two is never activated in this test.
    expect(projectionLog).toContain('ctor:second');
    // Its template ran too: the nested @if resolved and bound the directive.
    expect(projectionLog).toContain('ngOnChanges:ctx');
  });

  // The companion to the hand-built delivery test above, but through a real
  // stepper: onEnter must not arrive until after the activating render.
  it('delivers onEnter to a projected step only after the activating render', async () => {
    const steppers = hostFixture.debugElement
      .query(By.directive(SteppersComponent))
      .componentInstance as SteppersComponent;

    expect(hostFixture.componentInstance.entered).toEqual([]);

    steppers.setActive(1);
    expect(hostFixture.componentInstance.entered).toEqual([]);

    await hostFixture.whenStable();
    expect(hostFixture.componentInstance.entered).toEqual(['two']);
  });
});

import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Directive, Input, OnChanges, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from "@test-framework/core-test.helper";

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CoreModule } from '../../../../core/core.module';
import { MDAppModule } from '../../../../core/md.module';
import { SignalStepHandle, StepComponent } from '../step/step.component';
import { SteppersComponent } from './steppers.component';
import { TailwindSnackBarService } from '../../../services/tailwind-snackbar.service';

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

  beforeEach(async () => {
    fixture = TestBed.createComponent(SteppersComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
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

// The first step's onEnter used to be delivered by a 5 ms setInterval that
// waited for step 0 to unblock. With no Cloud Foundry connected, the CF step
// of create-app / deploy / add-service-instance stays blocked, so the
// interval ran for the life of the page. The poll also targeted allSteps[0]
// even when that step was hidden, so the step actually shown never got its
// onEnter.
@Component({
  standalone: true,
  imports: [SteppersComponent, StepComponent],
  template: `
    <app-steppers>
      <app-step title="One" [hidden]="firstHidden()" [blocked]="firstLegacyBlocked()" [signalHandle]="firstHandle"></app-step>
      <app-step title="Two" [hidden]="secondHidden()" [signalHandle]="secondHandle"></app-step>
    </app-steppers>
  `,
})
class FirstStepHostComponent {
  entered: string[] = [];
  firstHidden = signal(false);
  secondHidden = signal(false);
  firstBlocked = signal(false);
  firstLegacyBlocked = signal(false);
  firstHandle: SignalStepHandle = {
    valid: signal(true),
    blocked: this.firstBlocked,
    onEnter: () => { this.entered.push('one'); },
  };
  secondHandle: SignalStepHandle = {
    valid: signal(true),
    onEnter: () => { this.entered.push('two'); },
  };
}

@Component({
  standalone: true,
  imports: [SteppersComponent],
  template: `<app-steppers></app-steppers>`,
})
class EmptyStepperHostComponent { }

describe('SteppersComponent — first step entry', () => {
  let hostFixture: ComponentFixture<FirstStepHostComponent>;
  let host: FirstStepHostComponent;

  // Long enough for any first-step poll to have ticked several times.
  const settle = async () => {
    await vi.advanceTimersByTimeAsync(50);
    await hostFixture.whenStable();
  };

  beforeEach(async () => {
    // Only intervals are faked: setTimeout and requestAnimationFrame stay
    // real so the zoneless scheduler and whenStable still settle.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    TestBed.configureTestingModule({
      imports: [FirstStepHostComponent, EmptyStepperHostComponent, RouterTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    await TestBed.compileComponents();
    hostFixture = TestBed.createComponent(FirstStepHostComponent);
    host = hostFixture.componentInstance;
  });

  afterEach(() => vi.useRealTimers());

  it('fires the first step onEnter exactly once on create', async () => {
    await settle();
    await settle();
    expect(host.entered).toEqual(['one']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('leaves no interval running while the first step stays blocked', async () => {
    host.firstBlocked.set(true);
    await settle();
    expect(host.entered).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('fires onEnter once when a blocked first step unblocks', async () => {
    host.firstBlocked.set(true);
    await settle();
    expect(host.entered).toEqual([]);

    host.firstBlocked.set(false);
    await settle();
    await settle();
    expect(host.entered).toEqual(['one']);
  });

  it('fires onEnter once when a legacy [blocked] first step unblocks', async () => {
    host.firstHandle = { valid: signal(true), onEnter: () => { host.entered.push('one'); } };
    host.firstLegacyBlocked.set(true);
    await settle();
    expect(host.entered).toEqual([]);

    host.firstLegacyBlocked.set(false);
    await settle();
    await settle();
    expect(host.entered).toEqual(['one']);
  });

  it('enters the first visible step when the first step is hidden', async () => {
    host.firstHidden.set(true);
    await settle();
    expect(host.entered).toEqual(['two']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('fires onEnter once when the first visible step appears later', async () => {
    host.firstHidden.set(true);
    host.secondHidden.set(true);
    await settle();
    expect(host.entered).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);

    // e.g. the step list resolves after an async load
    host.firstHidden.set(false);
    host.secondHidden.set(false);
    await settle();
    await settle();
    expect(host.entered).toEqual(['one']);
  });

  it('leaves no interval running for a stepper with no steps', async () => {
    const emptyFixture = TestBed.createComponent(EmptyStepperHostComponent);
    await vi.advanceTimersByTimeAsync(50);
    await emptyFixture.whenStable();
    expect(vi.getTimerCount()).toBe(0);
  });
});

// A step can be hidden through its signal handle instead of the legacy
// [hidden] input. Only the input emits hiddenChange, so the stepper must
// also follow the handle's hidden signal or its step list goes stale.
@Component({
  standalone: true,
  imports: [SteppersComponent, StepComponent],
  template: `
    <app-steppers>
      <app-step title="One" [signalHandle]="firstHandle"></app-step>
      <app-step title="Two" [signalHandle]="secondHandle"></app-step>
    </app-steppers>
  `,
})
class SignalHiddenHostComponent {
  entered: string[] = [];
  firstHidden = signal(false);
  secondHidden = signal(false);
  firstHandle: SignalStepHandle = {
    valid: signal(true),
    hidden: this.firstHidden,
    onEnter: () => { this.entered.push('one'); },
  };
  secondHandle: SignalStepHandle = {
    valid: signal(true),
    hidden: this.secondHidden,
    onEnter: () => { this.entered.push('two'); },
  };
}

describe('SteppersComponent — signal-handle hidden', () => {
  let hostFixture: ComponentFixture<SignalHiddenHostComponent>;
  let host: SignalHiddenHostComponent;
  const steppers = () => hostFixture.debugElement
    .query(By.directive(SteppersComponent)).componentInstance as SteppersComponent;
  const titles = () => steppers().steps.map(step => step.title);

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [SignalHiddenHostComponent, RouterTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    await TestBed.compileComponents();
    hostFixture = TestBed.createComponent(SignalHiddenHostComponent);
    host = hostFixture.componentInstance;
  });

  it('re-filters the step list when a handle hidden signal flips', async () => {
    host.firstHidden.set(true);
    await hostFixture.whenStable();
    expect(titles()).toEqual(['Two']);

    host.firstHidden.set(false);
    await hostFixture.whenStable();
    expect(titles()).toEqual(['One', 'Two']);
    expect(hostFixture.nativeElement.textContent).toContain('One');

    host.secondHidden.set(true);
    await hostFixture.whenStable();
    expect(titles()).toEqual(['One']);
  });

  it('enters the first step once it is shown through its handle', async () => {
    host.firstHidden.set(true);
    host.secondHidden.set(true);
    await hostFixture.whenStable();
    expect(titles()).toEqual([]);
    expect(host.entered).toEqual([]);

    host.firstHidden.set(false);
    host.secondHidden.set(false);
    await hostFixture.whenStable();
    await hostFixture.whenStable();
    expect(titles()).toEqual(['One', 'Two']);
    expect(host.entered).toEqual(['one']);
  });
});

// Showing or hiding a step before the current one shifts the visible
// list. The current index must move with it, so the stepper stays on the
// step the user is on and that step is the one marked active.
describe('SteppersComponent — current step across re-filters', () => {
  let hostFixture: ComponentFixture<FirstStepHostComponent>;
  let host: FirstStepHostComponent;
  const steppers = () => hostFixture.debugElement
    .query(By.directive(SteppersComponent)).componentInstance as SteppersComponent;
  const current = () => steppers().steps[steppers().currentIndex()];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [FirstStepHostComponent, RouterTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    await TestBed.compileComponents();
    hostFixture = TestBed.createComponent(FirstStepHostComponent);
    host = hostFixture.componentInstance;
  });

  it('stays on the entered step when a hidden step before it is shown', async () => {
    host.firstHidden.set(true);
    await hostFixture.whenStable();
    await hostFixture.whenStable();
    expect(host.entered).toEqual(['two']);
    expect(current().title).toBe('Two');

    host.firstHidden.set(false);
    await hostFixture.whenStable();
    expect(steppers().steps.map(step => step.title)).toEqual(['One', 'Two']);
    expect(current().title).toBe('Two');
    expect(current().active).toBe(true);
    expect(steppers().steps[0].active).toBe(false);
    // Showing a step is not a transition: no extra onEnter.
    expect(host.entered).toEqual(['two']);
  });

  it('stays on the current step when a step before it is hidden', async () => {
    await hostFixture.whenStable();
    await hostFixture.whenStable();
    steppers().setActive(1);
    await hostFixture.whenStable();
    expect(current().title).toBe('Two');

    host.firstHidden.set(true);
    await hostFixture.whenStable();
    expect(steppers().steps.map(step => step.title)).toEqual(['Two']);
    expect(current().title).toBe('Two');
    expect(current().active).toBe(true);
  });

  it('enters the step shown in place of a current step that is hidden', async () => {
    await hostFixture.whenStable();
    await hostFixture.whenStable();
    steppers().setActive(1);
    await hostFixture.whenStable();
    expect(host.entered).toEqual(['one', 'two']);

    host.secondHidden.set(true);
    await hostFixture.whenStable();
    await hostFixture.whenStable();
    expect(steppers().steps.map(step => step.title)).toEqual(['One']);
    expect(current().title).toBe('One');
    expect(current().active).toBe(true);
    expect(host.entered).toEqual(['one', 'two', 'one']);
  });
});

// When every step is hidden at once (here, two handle signals flipping in
// one tick), the stepper shows nothing and there is no step for the index
// to follow. It must remember the step the user was on, so that when steps
// come back the index and the active marker agree again.
describe('SteppersComponent — all steps hidden, then shown', () => {
  let hostFixture: ComponentFixture<SignalHiddenHostComponent>;
  let host: SignalHiddenHostComponent;
  const steppers = () => hostFixture.debugElement
    .query(By.directive(SteppersComponent)).componentInstance as SteppersComponent;
  const current = () => steppers().steps[steppers().currentIndex()];
  const settle = async () => {
    await hostFixture.whenStable();
    await hostFixture.whenStable();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [SignalHiddenHostComponent, RouterTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    await TestBed.compileComponents();
    hostFixture = TestBed.createComponent(SignalHiddenHostComponent);
    host = hostFixture.componentInstance;
    await settle();
    // Move to the second step, then hide every step in one re-filter.
    steppers().setActive(1);
    await settle();
    expect(host.entered).toEqual(['one', 'two']);
    host.firstHidden.set(true);
    host.secondHidden.set(true);
    await settle();
    expect(steppers().steps).toEqual([]);
  });

  it('returns to the step the user was on when it reappears, without a second onEnter', async () => {
    host.secondHidden.set(false);
    await settle();
    expect(steppers().steps.map(step => step.title)).toEqual(['Two']);
    expect(current().title).toBe('Two');
    expect(current().active).toBe(true);
    expect(host.entered).toEqual(['one', 'two']);
  });

  it('returns to the step the user was on when all steps reappear', async () => {
    host.firstHidden.set(false);
    host.secondHidden.set(false);
    await settle();
    expect(current().title).toBe('Two');
    expect(current().active).toBe(true);
    expect(steppers().steps[0].active).toBe(false);
    expect(host.entered).toEqual(['one', 'two']);
  });

  it('enters the first visible step once when the step the user was on stays hidden', async () => {
    host.firstHidden.set(false);
    await settle();
    expect(steppers().steps.map(step => step.title)).toEqual(['One']);
    expect(current().title).toBe('One');
    expect(current().active).toBe(true);
    expect(steppers().allSteps[1].active).toBe(false);
    expect(host.entered).toEqual(['one', 'two', 'one']);
  });
});

// A step whose submit fails with an HTML error page from a proxy: the
// snackbar shows the page's heading and message as styled pieces.
@Component({
  standalone: true,
  imports: [SteppersComponent, StepComponent],
  template: `
    <app-steppers>
      <app-step title="One" [signalHandle]="handle"></app-step>
      <app-step title="Two"></app-step>
    </app-steppers>
  `,
})
class FailingStepHostComponent {
  handle: SignalStepHandle = {
    valid: signal(true),
    submit: () => Promise.reject(new HttpErrorResponse({
      error: '<html><body><h1>504 Gateway Time-out</h1>\nThe server didn\'t respond in time.\n</body></html>\n',
      status: 504,
      statusText: 'Gateway Timeout',
    })),
  };
}

describe('SteppersComponent — failed step', () => {
  it('shows an HTML error page as its heading and message', async () => {
    const snackBar = { error: vi.fn(() => ({ dismiss: vi.fn() })), dismiss: vi.fn() };
    TestBed.configureTestingModule({
      imports: [FailingStepHostComponent, RouterTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TailwindSnackBarService, useValue: snackBar },
      ],
    });
    await TestBed.compileComponents();
    const hostFixture = TestBed.createComponent(FailingStepHostComponent);
    await hostFixture.whenStable();
    const steppers = hostFixture.debugElement.query(By.directive(SteppersComponent)).componentInstance as SteppersComponent;

    steppers.goNext();
    await vi.waitFor(() => expect(snackBar.error).toHaveBeenCalled());

    expect(snackBar.error).toHaveBeenCalledWith(
      [
        { text: '504 Gateway Time-out', style: 'heading' },
        { text: '\nThe server didn\'t respond in time.', style: 'text' },
      ],
      'Dismiss',
      { panelClass: 'stepper-snack-bar' },
    );
  });
});

// The stepper clears its own error before the next try and when it goes
// away. Other messages open beside it, as tabs, are not its to close.
describe('SteppersComponent — its own error message', () => {
  const setUp = async (snackBar?: unknown) => {
    TestBed.configureTestingModule({
      imports: [FailingStepHostComponent, RouterTestingModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...(snackBar ? [{ provide: TailwindSnackBarService, useValue: snackBar }] : []),
      ],
    });
    await TestBed.compileComponents();
    const hostFixture = TestBed.createComponent(FailingStepHostComponent);
    await hostFixture.whenStable();
    const steppers = hostFixture.debugElement.query(By.directive(SteppersComponent)).componentInstance as SteppersComponent;
    return { hostFixture, steppers };
  };

  afterEach(() => document.querySelectorAll('.snackbar-box').forEach(box => box.remove()));

  it('closes only its own error before the next try', async () => {
    const ref = { dismiss: vi.fn() };
    const snackBar = { error: vi.fn(() => ref), dismiss: vi.fn() };
    const { steppers } = await setUp(snackBar);
    steppers.goNext();
    await vi.waitFor(() => expect(snackBar.error).toHaveBeenCalledTimes(1));
    steppers.goNext();
    expect(ref.dismiss).toHaveBeenCalledTimes(1);
    expect(snackBar.dismiss).not.toHaveBeenCalled();
  });

  it('closes only its own error when it is destroyed', async () => {
    const ref = { dismiss: vi.fn() };
    const snackBar = { error: vi.fn(() => ref), dismiss: vi.fn() };
    const { hostFixture, steppers } = await setUp(snackBar);
    steppers.goNext();
    await vi.waitFor(() => expect(snackBar.error).toHaveBeenCalledTimes(1));
    hostFixture.destroy();
    expect(ref.dismiss).toHaveBeenCalledTimes(1);
    expect(snackBar.dismiss).not.toHaveBeenCalled();
  });

  it('leaves another open message up when it retries', async () => {
    const { steppers } = await setUp();
    const service = TestBed.inject(TailwindSnackBarService);
    const open = () => Array.from(document.querySelectorAll('.snackbar-box:not([inert]) .snackbar-message'))
      .map(m => m.textContent);
    steppers.goNext();
    await vi.waitFor(() => expect(open()).toHaveLength(1));
    service.show('Other message', 'Dismiss');
    steppers.goNext();
    await vi.waitFor(() => expect(open()).toHaveLength(2));
    expect(open()[0]).toBe('Other message');
  });
});

// Cancel leaves the stepper: the step's leave hook runs (a signal handle's
// onLeave, as for a legacy onLeave input).
@Component({
  standalone: true,
  imports: [SteppersComponent, StepComponent],
  template: `
    <app-steppers cancel="/somewhere">
      <app-step title="One" [signalHandle]="handle"></app-step>
      <app-step title="Two" [signalHandle]="handle"></app-step>
    </app-steppers>
  `,
})
class CancelHostComponent {
  left: (boolean | undefined)[] = [];
  handle: SignalStepHandle = {
    valid: signal(true),
    onLeave: (isNext) => { this.left.push(isNext); },
  };
}

describe('SteppersComponent — Cancel', () => {
  let hostFixture: ComponentFixture<CancelHostComponent>;
  let host: CancelHostComponent;
  const cancelButton = () => hostFixture.nativeElement.querySelector('#stepper_cancel') as HTMLButtonElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CancelHostComponent, RouterTestingModule.withRoutes([{ path: 'somewhere', children: [] }])],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    await TestBed.compileComponents();
    hostFixture = TestBed.createComponent(CancelHostComponent);
    host = hostFixture.componentInstance;
  });

  it('runs the step\'s leave hook', async () => {
    await hostFixture.whenStable();
    cancelButton().click();
    expect(host.left).toEqual([false]);
  });
});

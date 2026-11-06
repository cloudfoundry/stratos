import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  untracked,
  viewChild,
  afterRenderEffect,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { Observable, firstValueFrom } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

import { ApplicationService } from '@stratosui/cloud-foundry';
import {
  CustomIconComponent,
  PageHeaderComponent,
  SignalStepHandle,
  StepComponent,
  SteppersComponent,
} from '@stratosui/core';
import { EditAutoscalerPolicyStep1Component } from './edit-autoscaler-policy-step1/edit-autoscaler-policy-step1.component';
import { EditAutoscalerPolicyStep2Component } from './edit-autoscaler-policy-step2/edit-autoscaler-policy-step2.component';
import { EditAutoscalerPolicyStep3Component } from './edit-autoscaler-policy-step3/edit-autoscaler-policy-step3.component';
import { EditAutoscalerPolicyStep4Component } from './edit-autoscaler-policy-step4/edit-autoscaler-policy-step4.component';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';

@Component({
  selector: 'app-edit-autoscaler-policy',
  templateUrl: './edit-autoscaler-policy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher },
    EditAutoscalerPolicyService
  ],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    EditAutoscalerPolicyStep1Component,
    EditAutoscalerPolicyStep2Component,
    EditAutoscalerPolicyStep3Component,
    EditAutoscalerPolicyStep4Component
  ]
})
export class EditAutoscalerPolicyComponent implements OnInit {
  applicationService = inject(ApplicationService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);


  parentUrl: string;
  applicationName$!: Observable<string | null>;
  isCreate = false;

  // FWT-959 Part 2 (Partition C): SignalStepHandle wiring for the 4-step
  // edit-autoscaler-policy flow. Cross-step state (the policy being edited)
  // continues to live in EditAutoscalerPolicyService — children read/write
  // it via setState/getState as before. The handles only need per-step
  // validity + the "currently editing a row" gate (editIndex !== -1) which
  // the children now expose as editIndex$ BehaviorSubjects (steps 2/3/4)
  // and a valid$ stream (step 1).
  //
  // The steppers component renders only the active step's content template
  // at any given time, so child components for non-active steps are not
  // instantiated. An effect on each view query wires the bridge
  // subscription when the freshly-stamped child appears, and its cleanup
  // tears it down when the query becomes undefined on step exit. Avoids the
  // setTimeout(0) defer needed if the bridge is wired from
  // signal-handle.onEnter (which fires synchronously inside setActive(),
  // before the *ngTemplateOutlet swap).
  private readonly step1 = viewChild<EditAutoscalerPolicyStep1Component>('step1');
  private readonly step2 = viewChild<EditAutoscalerPolicyStep2Component>('step2');
  private readonly step3 = viewChild<EditAutoscalerPolicyStep3Component>('step3');
  private readonly step4 = viewChild<EditAutoscalerPolicyStep4Component>('step4');

  private step1Valid = signal<boolean>(false);
  private step2EditIndex = signal<number>(-1);
  private step3EditIndex = signal<number>(-1);
  private step4EditIndex = signal<number>(-1);

  // The bridges run after render: a step's child creates its streams in
  // its own init hooks, which run after this component's effects.
  private readonly step1Bridge = afterRenderEffect(onCleanup => {
    const step = this.step1();
    untracked(() => {
      if (!step) {
        this.step1Valid.set(false);
        return;
      }
      const sub = step.valid$.subscribe(val => {
        this.step1Valid.set(!!val);
        this.cdr.markForCheck();
      });
      onCleanup(() => sub.unsubscribe());
    });
  });

  private readonly step2Bridge = afterRenderEffect(onCleanup => {
    const step = this.step2();
    untracked(() => {
      this.step2EditIndex.set(-1);
      if (!step) {
        return;
      }
      const sub = step.editIndex$.subscribe(val => {
        this.step2EditIndex.set(val);
        this.cdr.markForCheck();
      });
      onCleanup(() => sub.unsubscribe());
    });
  });

  private readonly step3Bridge = afterRenderEffect(onCleanup => {
    const step = this.step3();
    untracked(() => {
      this.step3EditIndex.set(-1);
      if (!step) {
        return;
      }
      const sub = step.editIndex$.subscribe(val => {
        this.step3EditIndex.set(val);
        this.cdr.markForCheck();
      });
      onCleanup(() => sub.unsubscribe());
    });
  });

  private readonly step4Bridge = afterRenderEffect(onCleanup => {
    const step = this.step4();
    untracked(() => {
      this.step4EditIndex.set(-1);
      if (!step) {
        return;
      }
      const sub = step.editIndex$.subscribe(val => {
        this.step4EditIndex.set(val);
        this.cdr.markForCheck();
      });
      onCleanup(() => sub.unsubscribe());
    });
  });

  step1Handle: SignalStepHandle = {
    valid: this.step1Valid.asReadonly(),
    submit: async () => {
      // step1.onNext sets state into EditAutoscalerPolicyService and
      // returns of({ success: true }) synchronously.
      const result = await firstValueFrom(this.step1()!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save instance limits');
      }
    },
  };

  step2Handle: SignalStepHandle = {
    valid: computed(() => this.step2EditIndex() === -1),
    disablePrevious: computed(() => this.step2EditIndex() !== -1),
    submit: async () => {
      // step2 inherits the base directive's onNext — setState + advance.
      const result = await firstValueFrom(this.step2()!.onNext(1, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save scaling rules');
      }
    },
  };

  step3Handle: SignalStepHandle = {
    valid: computed(() => this.step3EditIndex() === -1),
    disablePrevious: computed(() => this.step3EditIndex() !== -1),
    submit: async () => {
      const result = await firstValueFrom(this.step3()!.onNext(2, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save recurring schedules');
      }
    },
  };

  step4Handle: SignalStepHandle = {
    valid: computed(() => this.step4EditIndex() === -1),
    disablePrevious: computed(() => this.step4EditIndex() !== -1),
    submit: async () => {
      // step4.updatePolicy dispatches the create/update action and waits
      // for the entity-monitor to flip from busy → not-busy, then maps to
      // { success, redirect, message }. Legacy `redirect: true` navigated
      // back to parentUrl via the steppers redirect plumbing — make that
      // explicit here.
      const result = await firstValueFrom(this.step4()!.updatePolicy(3, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save policy');
      }
      if (result.redirect) {
        await this.router.navigateByUrl(this.parentUrl);
      }
    },
  };

  constructor() {
    this.parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/autoscale`;
  }

  ngOnInit() {
    this.applicationName$ = this.applicationService.app$.pipe(
      map(({ entity }) => entity ? entity.entity.name : null),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    this.isCreate = this.route.snapshot.queryParams.create;
    this.cdr.markForCheck();
  }

}

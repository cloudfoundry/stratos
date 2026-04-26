import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@stratosui/core';
import { Observable, Subscription, firstValueFrom } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

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
  styleUrls: ['./edit-autoscaler-policy.component.scss'],
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
export class EditAutoscalerPolicyComponent implements OnInit, OnDestroy {
  applicationService = inject(ApplicationService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);


  parentUrl: string;
  applicationName$!: Observable<string>;
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
  // at any given time, so children for non-active steps are not
  // instantiated. We therefore wire the bridge subscription inside each
  // handle's onEnter and tear it down inside onLeave — the @ViewChild
  // reference is guaranteed to point to the freshly-created child instance
  // at onEnter time, and the subscription is dropped before the child is
  // destroyed on navigation.
  @ViewChild('step1', { static: false }) step1?: EditAutoscalerPolicyStep1Component;
  @ViewChild('step2', { static: false }) step2?: EditAutoscalerPolicyStep2Component;
  @ViewChild('step3', { static: false }) step3?: EditAutoscalerPolicyStep3Component;
  @ViewChild('step4', { static: false }) step4?: EditAutoscalerPolicyStep4Component;

  private step1Valid = signal<boolean>(false);
  private step2EditIndex = signal<number>(-1);
  private step3EditIndex = signal<number>(-1);
  private step4EditIndex = signal<number>(-1);
  private step1Sub?: Subscription;
  private step2Sub?: Subscription;
  private step3Sub?: Subscription;
  private step4Sub?: Subscription;

  step1Handle: SignalStepHandle = {
    valid: this.step1Valid.asReadonly(),
    onEnter: () => {
      this.step1Sub?.unsubscribe();
      // Macrotask defers the ViewChild lookup until after the next CD
      // pass has stamped the step body, so this.step1 is the freshly
      // instantiated child rather than `undefined`. The steppers component
      // calls onEnter synchronously inside setActive() before the
      // *ngTemplateOutlet swap re-renders.
      setTimeout(() => {
        if (!this.step1) { return; }
        this.step1Sub = this.step1.valid$.subscribe(v => {
          this.step1Valid.set(!!v);
          this.cdr.markForCheck();
        });
      }, 0);
    },
    onLeave: () => {
      this.step1Sub?.unsubscribe();
      this.step1Sub = undefined;
    },
    submit: async () => {
      // step1.onNext sets state into EditAutoscalerPolicyService and
      // returns of({ success: true }) synchronously.
      const result = await firstValueFrom(this.step1!.onNext(0, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save instance limits');
      }
    },
  };

  step2Handle: SignalStepHandle = {
    valid: computed(() => this.step2EditIndex() === -1),
    disablePrevious: computed(() => this.step2EditIndex() !== -1),
    onEnter: () => {
      this.step2Sub?.unsubscribe();
      this.step2EditIndex.set(-1);
      setTimeout(() => {
        if (!this.step2) { return; }
        this.step2Sub = this.step2.editIndex$.subscribe(v => {
          this.step2EditIndex.set(v);
          this.cdr.markForCheck();
        });
      }, 0);
    },
    onLeave: () => {
      this.step2Sub?.unsubscribe();
      this.step2Sub = undefined;
    },
    submit: async () => {
      // step2 inherits the base directive's onNext — setState + advance.
      const result = await firstValueFrom(this.step2!.onNext(1, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save scaling rules');
      }
    },
  };

  step3Handle: SignalStepHandle = {
    valid: computed(() => this.step3EditIndex() === -1),
    disablePrevious: computed(() => this.step3EditIndex() !== -1),
    onEnter: () => {
      this.step3Sub?.unsubscribe();
      this.step3EditIndex.set(-1);
      setTimeout(() => {
        if (!this.step3) { return; }
        this.step3Sub = this.step3.editIndex$.subscribe(v => {
          this.step3EditIndex.set(v);
          this.cdr.markForCheck();
        });
      }, 0);
    },
    onLeave: () => {
      this.step3Sub?.unsubscribe();
      this.step3Sub = undefined;
    },
    submit: async () => {
      const result = await firstValueFrom(this.step3!.onNext(2, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save recurring schedules');
      }
    },
  };

  step4Handle: SignalStepHandle = {
    valid: computed(() => this.step4EditIndex() === -1),
    disablePrevious: computed(() => this.step4EditIndex() !== -1),
    onEnter: () => {
      this.step4Sub?.unsubscribe();
      this.step4EditIndex.set(-1);
      setTimeout(() => {
        if (!this.step4) { return; }
        this.step4Sub = this.step4.editIndex$.subscribe(v => {
          this.step4EditIndex.set(v);
          this.cdr.markForCheck();
        });
      }, 0);
    },
    onLeave: () => {
      this.step4Sub?.unsubscribe();
      this.step4Sub = undefined;
    },
    submit: async () => {
      // step4.updatePolicy dispatches the create/update action and waits
      // for the entity-monitor to flip from busy → not-busy, then maps to
      // { success, redirect, message }. Legacy `redirect: true` navigated
      // back to parentUrl via the steppers redirect plumbing — make that
      // explicit here.
      const result = await firstValueFrom(this.step4!.updatePolicy(3, null as any));
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
      publishReplay(1),
      refCount()
    );
    this.isCreate = this.route.snapshot.queryParams.create;
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.step1Sub?.unsubscribe();
    this.step2Sub?.unsubscribe();
    this.step3Sub?.unsubscribe();
    this.step4Sub?.unsubscribe();
  }

}

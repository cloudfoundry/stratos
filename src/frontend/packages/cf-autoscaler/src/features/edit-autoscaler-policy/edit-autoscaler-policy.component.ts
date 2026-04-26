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
  // at any given time, so child components for non-active steps are not
  // instantiated. We use ViewChild setters to wire bridge subscriptions
  // when the freshly-stamped child appears, and tear them down when the
  // ref becomes undefined on step exit. Avoids the setTimeout(0) defer
  // needed if the bridge is wired from signal-handle.onEnter (which fires
  // synchronously inside setActive(), before the *ngTemplateOutlet swap).
  private _step1?: EditAutoscalerPolicyStep1Component;
  private _step2?: EditAutoscalerPolicyStep2Component;
  private _step3?: EditAutoscalerPolicyStep3Component;
  private _step4?: EditAutoscalerPolicyStep4Component;

  private step1Valid = signal<boolean>(false);
  private step2EditIndex = signal<number>(-1);
  private step3EditIndex = signal<number>(-1);
  private step4EditIndex = signal<number>(-1);
  private step1Sub?: Subscription;
  private step2Sub?: Subscription;
  private step3Sub?: Subscription;
  private step4Sub?: Subscription;

  @ViewChild('step1', { static: false })
  set step1Ref(v: EditAutoscalerPolicyStep1Component | undefined) {
    this._step1 = v;
    this.step1Sub?.unsubscribe();
    this.step1Sub = undefined;
    if (v) {
      this.step1Sub = v.valid$.subscribe(val => {
        this.step1Valid.set(!!val);
        this.cdr.markForCheck();
      });
    } else {
      this.step1Valid.set(false);
    }
  }

  @ViewChild('step2', { static: false })
  set step2Ref(v: EditAutoscalerPolicyStep2Component | undefined) {
    this._step2 = v;
    this.step2Sub?.unsubscribe();
    this.step2Sub = undefined;
    if (v) {
      this.step2EditIndex.set(-1);
      this.step2Sub = v.editIndex$.subscribe(val => {
        this.step2EditIndex.set(val);
        this.cdr.markForCheck();
      });
    } else {
      this.step2EditIndex.set(-1);
    }
  }

  @ViewChild('step3', { static: false })
  set step3Ref(v: EditAutoscalerPolicyStep3Component | undefined) {
    this._step3 = v;
    this.step3Sub?.unsubscribe();
    this.step3Sub = undefined;
    if (v) {
      this.step3EditIndex.set(-1);
      this.step3Sub = v.editIndex$.subscribe(val => {
        this.step3EditIndex.set(val);
        this.cdr.markForCheck();
      });
    } else {
      this.step3EditIndex.set(-1);
    }
  }

  @ViewChild('step4', { static: false })
  set step4Ref(v: EditAutoscalerPolicyStep4Component | undefined) {
    this._step4 = v;
    this.step4Sub?.unsubscribe();
    this.step4Sub = undefined;
    if (v) {
      this.step4EditIndex.set(-1);
      this.step4Sub = v.editIndex$.subscribe(val => {
        this.step4EditIndex.set(val);
        this.cdr.markForCheck();
      });
    } else {
      this.step4EditIndex.set(-1);
    }
  }

  step1Handle: SignalStepHandle = {
    valid: this.step1Valid.asReadonly(),
    submit: async () => {
      // step1.onNext sets state into EditAutoscalerPolicyService and
      // returns of({ success: true }) synchronously.
      const result = await firstValueFrom(this._step1!.onNext(0, null as any));
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
      const result = await firstValueFrom(this._step2!.onNext(1, null as any));
      if (!result.success) {
        throw new Error(result.message || 'Failed to save scaling rules');
      }
    },
  };

  step3Handle: SignalStepHandle = {
    valid: computed(() => this.step3EditIndex() === -1),
    disablePrevious: computed(() => this.step3EditIndex() !== -1),
    submit: async () => {
      const result = await firstValueFrom(this._step3!.onNext(2, null as any));
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
      const result = await firstValueFrom(this._step4!.updatePolicy(3, null as any));
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

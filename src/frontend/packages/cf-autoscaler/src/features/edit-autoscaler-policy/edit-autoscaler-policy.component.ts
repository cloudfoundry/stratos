import {
  ChangeDetectionStrategy,
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

import { ApplicationService } from '@stratosui/cloud-foundry';
import { AppDetailDataService } from '../../../../cloud-foundry/src/features/applications/app-detail-data.service';
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
  readonly detail = inject(AppDetailDataService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);


  parentUrl: string;
  isCreate = false;

  // FWT-959 Part 2 (Partition C): SignalStepHandle wiring for the 4-step
  // edit-autoscaler-policy flow. Cross-step state (the policy being edited)
  // continues to live in EditAutoscalerPolicyService — children read/write
  // it via setState/getState as before. The handles only need per-step
  // validity + the "currently editing a row" gate (editIndex !== -1) which
  // the children expose as editIndex signals (steps 2/3/4) and a valid$
  // stream (step 1).
  //
  // The steppers component renders only the active step's content template
  // at any given time, so child components for non-active steps are not
  // instantiated. Each view query is undefined while its step is inactive,
  // and the handles below treat that as "not editing".
  private readonly step1 = viewChild<EditAutoscalerPolicyStep1Component>('step1');
  private readonly step2 = viewChild<EditAutoscalerPolicyStep2Component>('step2');
  private readonly step3 = viewChild<EditAutoscalerPolicyStep3Component>('step3');
  private readonly step4 = viewChild<EditAutoscalerPolicyStep4Component>('step4');

  private step1Valid = signal<boolean>(false);

  // Runs after render: step 1 creates its stream in its own init hook,
  // which runs after this component's effects.
  private readonly step1Bridge = afterRenderEffect(onCleanup => {
    const step = this.step1();
    untracked(() => {
      if (!step) {
        this.step1Valid.set(false);
        return;
      }
      const sub = step.valid$.subscribe(val => {
        this.step1Valid.set(!!val);
      });
      onCleanup(() => sub.unsubscribe());
    });
  });

  // -1 while the step is not shown.
  private readonly step2EditIndex = computed(() => this.step2()?.editIndex() ?? -1);
  private readonly step3EditIndex = computed(() => this.step3()?.editIndex() ?? -1);
  private readonly step4EditIndex = computed(() => this.step4()?.editIndex() ?? -1);

  step1Handle: SignalStepHandle = {
    valid: this.step1Valid.asReadonly(),
    submit: async () => {
      // step1.onNext sets state into EditAutoscalerPolicyService.
      const result = await this.step1()!.onNext();
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
      const result = await this.step2()!.onNext();
      if (!result.success) {
        throw new Error(result.message || 'Failed to save scaling rules');
      }
    },
  };

  step3Handle: SignalStepHandle = {
    valid: computed(() => this.step3EditIndex() === -1),
    disablePrevious: computed(() => this.step3EditIndex() !== -1),
    submit: async () => {
      const result = await this.step3()!.onNext();
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
      const result = await this.step4()!.updatePolicy();
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
    this.isCreate = this.route.snapshot.queryParams.create;
  }

}

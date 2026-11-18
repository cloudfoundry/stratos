import { Directive, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StepOnNextResult } from '@stratosui/core';
import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';

@Directive()
export abstract class EditAutoscalerPolicyDirective {
  protected isCreate = false;

  protected service = inject(EditAutoscalerPolicyService);
  private route = inject(ActivatedRoute);

  /** The shared policy; undefined until it has loaded. */
  readonly appAutoscalerPolicy = this.service.policy;

  constructor() {
    this.isCreate = this.route.snapshot.queryParams.create;
  }

  /** The policy the step edits in place; only read once it has loaded. */
  get currentPolicy(): AppAutoscalerPolicyLocal {
    return this.appAutoscalerPolicy()!;
  }

  async onNext(): Promise<StepOnNextResult> {
    this.service.setState(this.currentPolicy);
    return { success: true };
  }
}

import { Directive, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StepOnNextResult } from '@stratosui/core';
import { AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';

@Directive()
export abstract class EditAutoscalerPolicyDirective implements OnInit {
  public currentPolicy!: AppAutoscalerPolicyLocal;
  public appAutoscalerPolicy$!: Observable<AppAutoscalerPolicyLocal>;
  protected isCreate = false;

  protected service = inject(EditAutoscalerPolicyService);
  private route = inject(ActivatedRoute);

  constructor() {
    this.isCreate = this.route.snapshot.queryParams.create;
  }

  ngOnInit() {
    this.appAutoscalerPolicy$ = this.service.getState().pipe(
      map(state => {
        this.currentPolicy = state;
        return this.currentPolicy;
      })
    );
  }

  async onNext(): Promise<StepOnNextResult> {
    this.service.setState(this.currentPolicy);
    return { success: true };
  }
}

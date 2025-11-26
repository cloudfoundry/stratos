import { Directive, type OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { type Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import type { StepOnNextFunction } from '@stratosui/core';
import type { AppAutoscalerPolicy, AppAutoscalerPolicyLocal } from '../../store/app-autoscaler.types';
import type { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';

@Directive()
export abstract class EditAutoscalerPolicyDirective implements OnInit {
  public currentPolicy!: AppAutoscalerPolicyLocal;
  public appAutoscalerPolicy$!: Observable<AppAutoscalerPolicy>;
  protected isCreate = false;

  constructor(
    protected service: EditAutoscalerPolicyService,
    route: ActivatedRoute
  ) {
    this.isCreate = route.snapshot.queryParams.create;
  }

  ngOnInit() {
    this.appAutoscalerPolicy$ = this.service.getState().pipe(
      map(state => {
        this.currentPolicy = state;
        return this.currentPolicy;
      })
    );
  }

  onNext: StepOnNextFunction = () => {
    this.service.setState(this.currentPolicy);
    return of({ success: true });
  };
}

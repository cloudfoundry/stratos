import { OnInit } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { AppAutoscalerPolicy } from '../app-autoscaler.types';
import { EditAutoscalerPolicyService } from './edit-autoscaler-policy-service';


export abstract class EditAutoscalerPolicy implements OnInit {
  public currentPolicy: AppAutoscalerPolicy;
  protected appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  constructor(protected service: EditAutoscalerPolicyService) { }

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
  }
}

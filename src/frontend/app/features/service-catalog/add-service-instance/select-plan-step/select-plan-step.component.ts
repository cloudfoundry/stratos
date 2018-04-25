import { Component, OnDestroy, OnInit, AfterContentInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, share, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IServicePlan, IServicePlanExtra } from '../../../../core/cf-api-svc.types';
import { AppState } from '../../../../store/app-state';
import { APIResource } from '../../../../store/types/api.types';
import { ServicesService } from '../../services.service';
import { SetServicePlan } from '../../../../store/actions/create-service-instance.actions';

interface ServicePlan {
  id: string;
  name: string;
  entity: APIResource<IServicePlan>;
  extra: IServicePlanExtra;
}
@Component({
  selector: 'app-select-plan-step',
  templateUrl: './select-plan-step.component.html',
  styleUrls: ['./select-plan-step.component.scss']
})
export class SelectPlanStepComponent implements OnInit, OnDestroy, AfterContentInit {
  validate: Observable<boolean>;
  selectedPlan: string;
  subscription: Subscription;
  stepperForm: FormGroup;
  servicePlans$: Observable<ServicePlan[]>;

  constructor(private store: Store<AppState>, private servicesService: ServicesService) {
    this.servicePlans$ = servicesService.servicePlans$.pipe(
      map(o => o.filter(s => s.entity.bindable)),
      map(o => o.map(p => ({
        id: p.metadata.guid,
        name: p.entity.name,
        entity: p,
        extra: p.entity.extra ? JSON.parse(p.entity.extra) : null
      }))),
      share(),
      first()
    );

    this.stepperForm = new FormGroup({
      servicePlans: new FormControl('', Validators.required)
    });

    this.subscription = this.servicePlans$.pipe(
      tap(o => {
        this.selectedPlan = o[0].id;
      }),
      first()
    ).subscribe();
  }

  ngOnInit() {
  }

  getDisplayName(selectedPlan: ServicePlan) {
    let name = selectedPlan.name;
    if (selectedPlan.extra && selectedPlan.extra.displayName) {
      name = selectedPlan.extra.displayName;
    }
    return name;
  }
  hasAdditionalInfo(selectedPlan: ServicePlan) {
    return selectedPlan.extra && selectedPlan.extra.bullets;
  }

  ngAfterContentInit() {
    console.log(this.stepperForm.valid);
    this.validate = this.stepperForm.statusChanges
      .map(() => {
        console.log(this.stepperForm.valid);
        return this.stepperForm.valid;
      });
  }
  onNext = () => {
    this.store.dispatch(new SetServicePlan(this.selectedPlan));
    return Observable.of({ success: true });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

  }

  getSelectedPlan = (): Observable<ServicePlan> => this.servicePlans$.pipe(
    map(o => o.filter(p => p.id === this.selectedPlan)[0]),
    filter(p => !!p)
  )

}

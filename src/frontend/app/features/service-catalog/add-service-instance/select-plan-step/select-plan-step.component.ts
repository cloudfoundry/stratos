import { AfterContentInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, share, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IServicePlan, IServicePlanExtra } from '../../../../core/cf-api-svc.types';
import { SetServicePlan } from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { APIResource } from '../../../../store/types/api.types';
import { ServicesService } from '../../services.service';

interface ServicePlan {
  id: string;
  name: string;
  entity: APIResource<IServicePlan>;
  extra: IServicePlanExtra;
}
@Component({
  selector: 'app-select-plan-step',
  templateUrl: './select-plan-step.component.html',
  styleUrls: ['./select-plan-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectPlanStepComponent implements OnInit, OnDestroy, AfterContentInit {
  changeSubscription: Subscription;
  validate = new BehaviorSubject<boolean>(false);
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
        this.stepperForm.controls.servicePlans.setValue(o[0].id);
        this.validate.next(this.stepperForm.valid);

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

  onEnter = () => {
    this.changeSubscription = this.stepperForm.statusChanges
      .map(() => {
        this.validate.next(this.stepperForm.valid);
      }).subscribe();
  }

  ngAfterContentInit() {

  }

  onNext = () => {
    this.store.dispatch(new SetServicePlan(this.stepperForm.controls.servicePlans.value));
    return Observable.of({ success: true });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.changeSubscription) {
      this.changeSubscription.unsubscribe();
    }

  }

  getSelectedPlan = (): Observable<ServicePlan> => this.servicePlans$.pipe(
    map(o => o.filter(p => p.id === this.stepperForm.controls.servicePlans.value)[0]),
    filter(p => !!p)
  )

}

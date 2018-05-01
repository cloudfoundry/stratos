import { AfterContentInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, share, tap, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IServicePlan, IServicePlanExtra, IServicePlanVisibility } from '../../../../core/cf-api-svc.types';
import { SetServicePlan } from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { APIResource } from '../../../../store/types/api.types';
import { ServicesService } from '../../services.service';
import { CardStatus } from '../../../../shared/components/application-state/application-state.service';

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
export class SelectPlanStepComponent implements OnDestroy {

  servicePlanVisibilitySub: Subscription;
  allVisibilities: APIResource<IServicePlanVisibility>[];
  changeSubscription: Subscription;
  validate = new BehaviorSubject<boolean>(false);
  subscription: Subscription;
  stepperForm: FormGroup;
  servicePlans$: Observable<ServicePlan[]>;

  constructor(private store: Store<AppState>, private servicesService: ServicesService) {
    this.servicePlans$ = servicesService.servicePlans$.pipe(
      filter(p => !!p && p.length > 0),
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
      servicePlans: new FormControl('', [Validators.required, this.hasVisibilityValidator()]),
    });
    this.subscription = this.servicePlans$.pipe(
      tap(o => {
        this.stepperForm.controls.servicePlans.setValue(o[0].id);
        this.validate.next(this.stepperForm.valid);

      }),
      first()
    ).subscribe();

    this.servicePlanVisibilitySub = this.servicesService.servicePlanVisibilities$.pipe(
      tap(vis => {
        this.allVisibilities = vis;
      })
    ).subscribe();
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

    if (this.servicePlanVisibilitySub) {

      this.servicePlanVisibilitySub.unsubscribe();
    }
  }
  hasVisibility = (servicePlanId: string = null) => {
    return this.allVisibilities ? this.allVisibilities.filter(v => v.entity.service_plan_guid === servicePlanId).length > 0 : false;
  }

  hasVisibilityValidator = (): ValidatorFn => {
    return (formField: AbstractControl): { [key: string]: any } =>
      !this.hasVisibility(formField.value) ? { 'nameTaken': { value: formField.value } } : null;
  }


  getSelectedPlan = (): Observable<ServicePlan> => this.servicePlans$.pipe(
    map(o => o.filter(p => p.id === this.stepperForm.controls.servicePlans.value)[0]),
    filter(p => !!p)
  )

  getPlanAccessibility = (servicePlan: APIResource<IServicePlan>): Observable<CardStatus> => {

    if (servicePlan.entity.public) {
      return Observable.of(CardStatus.OK);
    }

    return this.servicesService.servicePlanVisibilities$.pipe(
      filter(p => !!p),
      map(servicePlanVisibilities => servicePlanVisibilities.filter(s => s.entity.service_plan_guid === servicePlan.metadata.guid)),
      map(filteredPlans => {
        if (filteredPlans.length === 0) {
          // No service visibility defined for this service
          return CardStatus.ERROR;
        } else {
          return CardStatus.WARNING;
        }
      }),
      first()
    );
  }

  getAccessibilityMessage = (servicePlan: APIResource<IServicePlan>): Observable<string> => {

    return this.getPlanAccessibility(servicePlan).pipe(
      map(o => {
        if (o === CardStatus.WARNING) {
          return 'Service Plan has limited visibility';
        } else if (o === CardStatus.ERROR) {
          return 'Service Plan has no visibility';
        }
      })
    );
  }

  planHasNoVisibility = (): Observable<boolean> => {
    return this.getSelectedPlan().pipe(
      switchMap(o => this.getPlanAccessibility(o.entity)),
      map(s => s === CardStatus.ERROR)
    );
  }
}

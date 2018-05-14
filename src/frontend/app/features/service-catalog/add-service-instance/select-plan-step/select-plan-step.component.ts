import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, share, tap, switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IServicePlan, IServicePlanExtra } from '../../../../core/cf-api-svc.types';
import { CardStatus } from '../../../../shared/components/application-state/application-state.service';
import { SetServicePlan } from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { APIResource, EntityInfo } from '../../../../store/types/api.types';
import { ServicePlanAccessibility, ServicesService } from '../../services.service';
import { selectCreateServiceGuid } from '../../../../store/selectors/create-service-instance.selectors';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';

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
  providers: [
    TitleCasePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectPlanStepComponent implements OnInit, OnDestroy {


  servicePlans: ServicePlan[];

  servicePlanVisibilitySub: Subscription;
  changeSubscription: Subscription;
  validate = new BehaviorSubject<boolean>(false);
  subscription: Subscription;
  stepperForm: FormGroup;
  servicePlans$: Observable<ServicePlan[]>;
  initialising$ = new BehaviorSubject(true);

  constructor(private store: Store<AppState>,
    private cSIHelperService: CreateServiceInstanceHelperService,
  ) {

    this.stepperForm = new FormGroup({
      servicePlans: new FormControl('', Validators.required),
    });
  }

  mapToServicePlan = (visiblePlans: APIResource<IServicePlan>[]): ServicePlan[] => visiblePlans.map(p => ({
    id: p.metadata.guid,
    name: p.entity.name,
    entity: p,
    extra: p.entity.extra ? JSON.parse(p.entity.extra) : null
  }))

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

  ngOnInit(): void {
    this.servicePlans$ = this.cSIHelperService.initialised$.pipe(

      switchMap(p => this.cSIHelperService.getVisibleServicePlans().pipe(
        filter(o => !!o && o.length > 0),
        map(o => this.mapToServicePlan(o)),
        share(),
        first()
      )));

    this.subscription = this.servicePlans$.pipe(
      filter(p => !!p && p.length > 0),
      tap(o => {
        console.log('Updating...');
        this.stepperForm.controls.servicePlans.setValue(o[0].id);
        this.servicePlans = o;
        this.validate.next(this.stepperForm.valid);
      }),
    ).subscribe();
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

  getSelectedPlan = (): Observable<ServicePlan> => this.servicePlans$.pipe(
    tap(o => console.log(o)),
    tap(o => console.log(this.stepperForm.controls.servicePlans.value)),
    map(o => o.filter(p => p.id === this.stepperForm.controls.servicePlans.value)[0]),
    tap(o => console.log('selected plan: ' + JSON.stringify(o))),
    filter(p => !!p)
  )

  getPlanAccessibility = (servicePlan: APIResource<IServicePlan>): Observable<CardStatus> => {
    return this.cSIHelperService.getServicePlanAccessibility(servicePlan).pipe(
      map((servicePlanAccessibility: ServicePlanAccessibility) => {
        if (servicePlanAccessibility.isPublic) {
          return CardStatus.OK;
        } else if (servicePlanAccessibility.spaceScoped || servicePlanAccessibility.hasVisibilities) {
          return CardStatus.WARNING;
        } else {
          return CardStatus.ERROR;
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

  isYesOrNo = val => val ? 'yes' : 'no';
  isPublic = (selPlan: EntityInfo<APIResource<IServicePlan>>) => this.isYesOrNo(selPlan.entity.entity.public);
  isFree = (selPlan: EntityInfo<APIResource<IServicePlan>>) => this.isYesOrNo(selPlan.entity.entity.free);

}

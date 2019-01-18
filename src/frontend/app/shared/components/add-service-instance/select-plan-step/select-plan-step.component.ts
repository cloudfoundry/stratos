import { registerLocaleData, TitleCasePipe } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentFactoryResolver,
  OnDestroy,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest as observableCombineLatest, Observable, Subscription } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  first,
  map,
  publishReplay,
  refCount,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs/operators';

import { IServicePlan } from '../../../../core/cf-api-svc.types';
import { safeUnsubscribe } from '../../../../core/utils.service';
import {
  canShowServicePlanCosts,
  getServicePlanAccessibilityCardStatus,
  getServicePlanName,
  populateServicePlanExtraTyped,
} from '../../../../features/service-catalog/services-helper';
import {
  SetCreateServiceInstanceCFDetails,
  SetCreateServiceInstanceServicePlan,
} from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiModeService } from '../csi-mode.service';
import { NoServicePlansComponent } from '../no-service-plans/no-service-plans.component';
import { CardStatus } from '../../../shared.types';

@Component({
  selector: 'app-select-plan-step',
  templateUrl: './select-plan-step.component.html',
  styleUrls: ['./select-plan-step.component.scss'],
  providers: [
    TitleCasePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectPlanStepComponent implements OnDestroy {
  selectedPlan$: Observable<APIResource<IServicePlan>>;
  selectedPlanAccessibility$ = new BehaviorSubject<CardStatus>(null);
  cSIHelperService: CreateServiceInstanceHelper;
  @ViewChild('noplans', { read: ViewContainerRef })
  noPlansDiv: ViewContainerRef;

  validate = new BehaviorSubject<boolean>(false);
  subscription: Subscription;
  stepperForm: FormGroup;
  servicePlans$: Observable<APIResource<IServicePlan>[]>;

  constructor(
    private store: Store<AppState>,
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    activatedRoute: ActivatedRoute,
    private componentFactoryResolver: ComponentFactoryResolver,
    private modeService: CsiModeService

  ) {
    registerLocaleData(localeFr);

    this.stepperForm = new FormGroup({
      servicePlans: new FormControl('', Validators.required),
    });

    if (modeService.isMarketplaceMode()) {
      this.store.dispatch(new SetCreateServiceInstanceCFDetails(activatedRoute.snapshot.params.endpointId));
    }

    this.servicePlans$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p.orgGuid && !!p.spaceGuid && !!p.serviceGuid),
      distinctUntilChanged((x, y) => {
        return (x.cfGuid === y.cfGuid && x.spaceGuid === y.spaceGuid && x.orgGuid === y.orgGuid && x.serviceGuid === y.serviceGuid);
      }),
      switchMap(state => {
        this.cSIHelperService = this.cSIHelperServiceFactory.create(state.cfGuid, state.serviceGuid);
        return this.cSIHelperService.getServicePlans();
      }),
      tap(o => {
        if (o.length === 0) {
          this.stepperForm.controls.servicePlans.disable();
          this.clearNoPlans();
          this.createNoPlansComponent();
          setTimeout(() => this.validate.next(false));
        }
        if (o.length > 0) {
          this.stepperForm.controls.servicePlans.enable();
          this.clearNoPlans();
        }
      }),
      map(visiblePlans => visiblePlans.map(populateServicePlanExtraTyped)),
      publishReplay(1),
      refCount(),
    );

    this.selectedPlan$ = observableCombineLatest(
      this.stepperForm.statusChanges.pipe(startWith(true)),
      this.servicePlans$).pipe(
        filter(([valid, servicePlans]) => !!servicePlans && servicePlans.length > 0),
        map(([valid, servicePlans]) => {
          return servicePlans.filter(s => s.metadata.guid === this.stepperForm.controls.servicePlans.value)[0];
        }),
        filter(selectedServicePlan => !!selectedServicePlan),
        tap(selectedServicePlan => {
          getServicePlanAccessibilityCardStatus(
            selectedServicePlan,
            this.cSIHelperService.getServicePlanVisibilities(),
            this.cSIHelperService.serviceBroker$).pipe(
              first()
            ).subscribe(cardStatus => this.selectedPlanAccessibility$.next(cardStatus));
        })
      );

  }

  getDisplayName = (selectedPlan: APIResource<IServicePlan>) => getServicePlanName(selectedPlan.entity);

  onEnter = () => {
    this.subscription = this.servicePlans$.pipe(
      filter(p => !!p && p.length > 0),
      withLatestFrom(this.store.select(selectCreateServiceInstance)),
      tap(([servicePlans, createServiceInstanceState]) => {
        if (this.modeService.isEditServiceInstanceMode()) {
          this.stepperForm.controls.servicePlans.setValue(createServiceInstanceState.servicePlanGuid);
        } else {
          this.stepperForm.controls.servicePlans.setValue(servicePlans[0].entity.guid);
        }
        this.stepperForm.updateValueAndValidity();
        this.validate.next(this.stepperForm.valid);
      }),
    ).subscribe();
  }

  onNext = (): Observable<StepOnNextResult> => {
    this.store.dispatch(new SetCreateServiceInstanceServicePlan(this.stepperForm.controls.servicePlans.value));
    return this.selectedPlan$.pipe(
      map((selectedServicePlan: APIResource<IServicePlan>) => ({
        success: true,
        data: selectedServicePlan
      }))
    );
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.subscription);
  }


  canShowCosts(selectedPlan: APIResource<IServicePlan>): boolean {
    return canShowServicePlanCosts(selectedPlan);
  }

  private createNoPlansComponent() {
    const component = this.componentFactoryResolver.resolveComponentFactory(
      NoServicePlansComponent
    );
    return this.noPlansDiv.createComponent(component);
  }
  private clearNoPlans() {
    return this.noPlansDiv.clear();
  }

}

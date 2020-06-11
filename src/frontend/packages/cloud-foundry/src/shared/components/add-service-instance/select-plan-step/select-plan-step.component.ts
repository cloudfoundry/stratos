import { TitleCasePipe } from '@angular/common';
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

import {
  SetCreateServiceInstanceServicePlan,
} from '../../../../../../cloud-foundry/src/actions/create-service-instance.actions';
import { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import {
  canShowServicePlanCosts,
  getServicePlanAccessibilityCardStatus,
  getServicePlanName,
  populateServicePlanExtraTyped,
} from '../../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import {
  selectCreateServiceInstance,
} from '../../../../../../cloud-foundry/src/store/selectors/create-service-instance.selectors';
import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { StepOnNextResult } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { StratosStatus } from '../../../../../../core/src/shared/shared.types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { IServicePlan } from '../../../../cf-api-svc.types';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiModeService } from '../csi-mode.service';
import { NoServicePlansComponent } from '../no-service-plans/no-service-plans.component';

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
  selectedPlanAccessibility$ = new BehaviorSubject<StratosStatus>(null);
  cSIHelperService: CreateServiceInstanceHelper;
  @ViewChild('noplans', { read: ViewContainerRef, static: true })
  noPlansDiv: ViewContainerRef;

  validate = new BehaviorSubject<boolean>(false);
  subscription: Subscription;
  stepperForm: FormGroup;
  servicePlans$: Observable<APIResource<IServicePlan>[]>;
  displayNames: { [guid: string]: string } = {};

  constructor(
    private store: Store<CFAppState>,
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    activatedRoute: ActivatedRoute,
    private componentFactoryResolver: ComponentFactoryResolver,
    private modeService: CsiModeService

  ) {
    this.stepperForm = new FormGroup({
      servicePlans: new FormControl('', Validators.required),
    });

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
      map(plans => plans.sort((a, b) => this.getDisplayName(a).localeCompare(this.getDisplayName(b)))),
      publishReplay(1),
      refCount(),
    );

    this.selectedPlan$ = observableCombineLatest(
      this.stepperForm.statusChanges.pipe(startWith(true)),
      this.servicePlans$).pipe(
        filter(([, servicePlans]) => !!servicePlans && servicePlans.length > 0),
        map(([, servicePlans]) => {
          return servicePlans.filter(s => s.metadata.guid === this.stepperForm.controls.servicePlans.value)[0];
        }),
        filter(selectedServicePlan => !!selectedServicePlan),
        tap(selectedServicePlan => {
          getServicePlanAccessibilityCardStatus(
            selectedServicePlan,
            this.cSIHelperService.servicePlanVisibilities$,
            this.cSIHelperService.serviceBroker$).pipe(
              first()
            ).subscribe(cardStatus => this.selectedPlanAccessibility$.next(cardStatus));
        })
      );

  }

  getDisplayName = (selectedPlan: APIResource<IServicePlan>) => {
    if (!this.displayNames[selectedPlan.metadata.guid]) {
      this.displayNames[selectedPlan.metadata.guid] = getServicePlanName(selectedPlan.entity);
    }
    return this.displayNames[selectedPlan.metadata.guid];
  }

  onEnter = () => {
    this.subscription = this.servicePlans$.pipe(
      filter(p => !!p && p.length > 0),
      withLatestFrom(this.store.select(selectCreateServiceInstance)),
      tap(([servicePlans, createServiceInstanceState]) => {
        if (this.modeService.isEditServiceInstanceMode()) {
          this.stepperForm.controls.servicePlans.setValue(createServiceInstanceState.servicePlanGuid);
        } else {
          this.stepperForm.controls.servicePlans.setValue(servicePlans[0].metadata.guid);
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

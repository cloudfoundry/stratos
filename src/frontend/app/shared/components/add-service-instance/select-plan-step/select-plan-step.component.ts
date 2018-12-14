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
import {
  BehaviorSubject,
  combineLatest as observableCombineLatest,
  Observable,
  of as observableOf,
  Subscription,
} from 'rxjs';
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

import { IServicePlan, IServicePlanCost, IServicePlanExtra } from '../../../../core/cf-api-svc.types';
import { ServicePlanAccessibility } from '../../../../features/service-catalog/services.service';
import {
  SetCreateServiceInstanceCFDetails,
  SetCreateServiceInstanceServicePlan,
} from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource, EntityInfo } from '../../../../store/types/api.types';
import { CardStatus } from '../../application-state/application-state.service';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelper } from '../create-service-instance-helper.service';
import { CsiModeService } from '../csi-mode.service';
import { NoServicePlansComponent } from '../no-service-plans/no-service-plans.component';
import { safeUnsubscribe } from '../../../../core/utils.service';


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
    TitleCasePipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectPlanStepComponent implements OnDestroy {
  selectedPlan$: Observable<ServicePlan>;
  cSIHelperService: CreateServiceInstanceHelper;
  @ViewChild('noplans', { read: ViewContainerRef })
  noPlansDiv: ViewContainerRef;

  servicePlans: ServicePlan[];

  validate = new BehaviorSubject<boolean>(false);
  subscription: Subscription;
  stepperForm: FormGroup;
  servicePlans$: Observable<ServicePlan[]>;

  constructor(
    private store: Store<AppState>,
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private activatedRoute: ActivatedRoute,
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
      map(o => this.mapToServicePlan(o)),
      publishReplay(1),
      refCount(),
    );

    this.selectedPlan$ = observableCombineLatest(
      this.stepperForm.statusChanges.pipe(startWith(true)),
      this.servicePlans$).pipe(
        filter(([p, q]) => !!q && q.length > 0),
        map(([valid, servicePlans]) =>
          servicePlans.filter(s => s.entity.metadata.guid === this.stepperForm.controls.servicePlans.value)[0])
      );
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
    this.subscription = this.servicePlans$.pipe(
      filter(p => !!p && p.length > 0),
      withLatestFrom(this.store.select(selectCreateServiceInstance)),
      tap(([servicePlans, createServiceInstanceState]) => {
        if (this.modeService.isEditServiceInstanceMode()) {
          this.stepperForm.controls.servicePlans.setValue(createServiceInstanceState.servicePlanGuid);
        } else {
          this.stepperForm.controls.servicePlans.setValue(servicePlans[0].id);
        }
        this.stepperForm.updateValueAndValidity();
        this.servicePlans = servicePlans;
        this.validate.next(this.stepperForm.valid);
      }),
    ).subscribe();
  }

  onNext = (): Observable<StepOnNextResult> => {
    this.store.dispatch(new SetCreateServiceInstanceServicePlan(this.stepperForm.controls.servicePlans.value));
    return observableOf({ success: true });
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.subscription);
  }

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

  /*
   * Show service plan costs if the object is in the open service broker format, otherwise ignore them
   */
  canShowCosts = (servicePlanExtra: IServicePlanExtra): boolean =>
    !!servicePlanExtra.costs && !!servicePlanExtra.costs[0] && !!servicePlanExtra.costs[0].amount

  /*
   * Pick the first country listed in the amount object. It's unclear whether there could be a different number of these depending on
   * which region the CF is being served from (IBM seem to charge different amounts per country)
   */
  private getCountryCode = (cost: IServicePlanCost): string => {
    return Object.keys(cost.amount)[0];
  }

  /*
   * Find the charge for the chosen country
   */
  getCostValue = (cost: IServicePlanCost) => cost.amount[this.getCountryCode(cost)];

  /*
   * Determine the currency for the chosen country
   */
  getCostCurrency = (cost: IServicePlanCost) => this.getCountryCode(cost).toUpperCase();

  /*
   * Artificially supply a locale for the chosen country.
   *
   * This will be updated once with do i18n
   */
  getCurrencyLocale = (cost: IServicePlanCost) => this.getCostCurrency(cost) === 'EUR' ? 'fr' : 'en-US';

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

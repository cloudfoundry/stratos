import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, ViewChild, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, publishReplay, refCount, switchMap, tap, combineLatest } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IServicePlan, IServicePlanExtra } from '../../../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CardStatus } from '../../../../shared/components/application-state/application-state.service';
import { SetServicePlan, SetCreateServiceInstanceCFDetails } from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import {
  selectCreateServiceInstanceCfGuid,
  selectCreateServiceInstanceServiceGuid,
  selectCreateServiceInstanceOrgGuid,
  selectCreateServiceInstanceSpaceGuid,
} from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource, EntityInfo } from '../../../../store/types/api.types';
import { safeUnsubscribe, isMarketplaceMode } from '../../services-helper';
import { ServicePlanAccessibility } from '../../services.service';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';
import { NoServicePlansComponent } from '../no-service-plans/no-service-plans.component';

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
  cSIHelperService: CreateServiceInstanceHelperService;
  selectedService$: Observable<ServicePlan>;
  @ViewChild('noplans', { read: ViewContainerRef })
  noPlansDiv: ViewContainerRef;

  servicePlans: ServicePlan[];

  servicePlanVisibilitySub: Subscription;
  changeSubscription: Subscription;
  validate = new BehaviorSubject<boolean>(false);
  subscription: Subscription;
  stepperForm: FormGroup;
  servicePlans$: Observable<ServicePlan[]>;

  constructor(
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private activatedRoute: ActivatedRoute,
    private csiGuidsService: CsiGuidsService,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {

    this.stepperForm = new FormGroup({
      servicePlans: new FormControl('', Validators.required),
    });

    if (isMarketplaceMode(activatedRoute)) {
      this.store.dispatch(new SetCreateServiceInstanceCFDetails(activatedRoute.snapshot.params.cfId));
    }
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
    this.cSIHelperService = this.cSIHelperServiceFactory.create(this.csiGuidsService.cfGuid, this.csiGuidsService.serviceGuid);

    this.servicePlans$ = this.store.select(selectCreateServiceInstanceOrgGuid).pipe(
      combineLatest(this.store.select(selectCreateServiceInstanceSpaceGuid)),
      switchMap(([orgGuid, spaceGuid]) => this.cSIHelperService.getVisibleServicePlansForSpaceAndOrg(orgGuid, spaceGuid)),
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

    this.selectedService$ = this.servicePlans$.pipe(
      filter(o => !!this.stepperForm.controls.servicePlans.value),
      map(o => o.filter(p => p.id === this.stepperForm.controls.servicePlans.value)[0]),
      filter(p => !!p),
    );

    this.subscription = this.servicePlans$.pipe(
      filter(p => !!p && p.length > 0),
      tap(o => {
        this.stepperForm.controls.servicePlans.setValue(o[0].id);
        this.servicePlans = o;
        setTimeout(() => this.validate.next(this.stepperForm.valid));

      }),
    ).subscribe();

  }

  onNext = () => {
    this.store.dispatch(new SetServicePlan(this.stepperForm.controls.servicePlans.value));
    return Observable.of({ success: true });
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.subscription);
    safeUnsubscribe(this.changeSubscription);
    safeUnsubscribe(this.servicePlanVisibilitySub);
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

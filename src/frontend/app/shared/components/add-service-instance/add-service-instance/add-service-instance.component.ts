import { TitleCasePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, first, map, switchMap, take, tap } from 'rxjs/operators';

import { IApp, ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { getIdFromRoute } from '../../../../features/cloud-foundry/cf.helpers';
import { servicesServiceFactoryProvider } from '../../../../features/service-catalog/service-catalog.helpers';
import { isMarketplaceMode } from '../../../../features/service-catalog/services-helper';
import { GetApplication } from '../../../../store/actions/application.actions';
import {
  ResetCreateServiceInstanceState,
  SetCreateServiceInstanceCFDetails,
  SetCreateServiceInstanceServiceGuid,
} from '../../../../store/actions/create-service-instance.actions';
import { GetAllAppsInSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';

@Component({
  selector: 'app-add-service-instance',
  templateUrl: './add-service-instance.component.html',
  styleUrls: ['./add-service-instance.component.scss'],
  providers: [
    servicesServiceFactoryProvider,
    CreateServiceInstanceHelperServiceFactory,
    TitleCasePipe,
    CsiGuidsService
  ]
})
export class AddServiceInstanceComponent implements OnDestroy {

  skipApps$: Observable<boolean>;
  cancelUrl: string;
  marketPlaceMode: boolean;
  cSIHelperService: CreateServiceInstanceHelperService;
  displaySelectServiceStep: boolean;
  displaySelectCfStep: boolean;
  title$: Observable<string>;
  serviceInstancesUrl: string;
  servicesWallCreateInstance = false;
  stepperText = 'Select a Cloud Foundry instance, organization and space for the service instance.';
  bindAppStepperText = 'Bind App (Optional)';
  appId: string;
  constructor(
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private csiGuidsService: CsiGuidsService,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {

    const { serviceId, cfId, appId } = this.getIdsFromRoute();

    // Check if wizard has been initiated from the Services Marketplace
    this.checkAndConfigureServiceForMarketplaceMode();

    // Check if the CF Select step needs to be displayed
    this.displaySelectCfStep = this.setupSelectCFStep(cfId, appId);

    // Check if the select service step needs to be displayed
    this.displaySelectServiceStep = this.setupSelectServiceStep(serviceId, appId);

    if (!!cfId && !!appId) {
      // Setup wizard for App services mode
      this.setupForAppServiceMode(appId, cfId);
    }
    if (!cfId && !appId && !serviceId) {
      // Setup wizard for default mode
      this.servicesWallCreateInstance = true;
      this.serviceInstancesUrl = `/services`;
      this.title$ = Observable.of(`Create Service Instance`);
    }

    this.skipApps$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p && !!p.spaceGuid && !!p.cfGuid),
      switchMap(createServiceInstance => {
        const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, createServiceInstance.spaceGuid);
        return getPaginationObservables<APIResource<IApp>>({
          store: this.store,
          action: new GetAllAppsInSpace(createServiceInstance.cfGuid, createServiceInstance.spaceGuid, paginationKey),
          paginationMonitor: this.paginationMonitorFactory.create(
            paginationKey,
            entityFactory(applicationSchemaKey)
          )
        }, true).entities$;
      }),
      map(apps => apps.length === 0)
    );
  }


  setupSelectCFStep = (cfId: string, appId: string) => !(!!cfId && !!appId);

  setupSelectServiceStep = (serviceId: string, appId: string) => !serviceId;

  onNext = (): Observable<StepOnNextResult> => {
    this.store.dispatch(new SetCreateServiceInstanceCFDetails(
      this.cfOrgSpaceService.cf.select.getValue(),
      this.cfOrgSpaceService.org.select.getValue(),
      this.cfOrgSpaceService.space.select.getValue()
    ));
    return Observable.of({ success: true });
  }

  private getIdsFromRoute() {
    const serviceId = getIdFromRoute(this.activatedRoute, 'serviceId');
    const cfId = getIdFromRoute(this.activatedRoute, 'cfId');
    const appId = getIdFromRoute(this.activatedRoute, 'id');
    return { serviceId, cfId, appId };
  }

  private setupForAppServiceMode(appId: string, cfId: string) {
    this.appId = appId;
    this.serviceInstancesUrl = `/applications/${cfId}/${appId}/services`;
    this.bindAppStepperText = 'Binding Params (Optional)';
    const entityService = this.entityServiceFactory.create<APIResource<IApp>>(
      applicationSchemaKey,
      entityFactory(applicationSchemaKey),
      appId,
      new GetApplication(appId, cfId, [createEntityRelationKey(applicationSchemaKey, spaceSchemaKey)]),
      true);
    entityService.waitForEntity$.pipe(filter(p => !!p), tap(app => {
      const spaceEntity = app.entity.entity.space as APIResource<ISpace>;
      this.store.dispatch(new SetCreateServiceInstanceCFDetails(cfId, spaceEntity.entity.organization_guid, app.entity.entity.space_guid));
      this.title$ = Observable.of(`Create and/or Bind Service Instance to '${app.entity.entity.name}'`);
    }), take(1)).subscribe();
  }

  private checkAndConfigureServiceForMarketplaceMode() {
    if (isMarketplaceMode(this.activatedRoute)) {
      this.initialiseForMarketplaceMode();
    }
  }

  ngOnDestroy(): void {
    this.store.dispatch(new ResetCreateServiceInstanceState());
  }

  private initialiseForMarketplaceMode() {
    const { cfId, serviceId } = this.activatedRoute.snapshot.params;
    this.csiGuidsService.cfGuid = cfId;
    this.csiGuidsService.serviceGuid = serviceId;
    this.cSIHelperService = this.cSIHelperServiceFactory.create(cfId, serviceId);
    this.store.dispatch(new SetCreateServiceInstanceCFDetails(cfId));
    this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceId));
    const serviceGuid = serviceId;
    this.serviceInstancesUrl = `/marketplace/${cfId}/${serviceGuid}/instances`;
    this.title$ = this.cSIHelperService.getServiceName().pipe(map(label => `Create Instance: ${label}`));
    this.marketPlaceMode = true;
    this.cfOrgSpaceService.cf.list$.pipe(
      filter(p => !!p),
      first()
    ).subscribe(e => this.cfOrgSpaceService.cf.select.next(cfId));
  }
}

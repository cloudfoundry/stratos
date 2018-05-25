import { TitleCasePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, tap, take, filter } from 'rxjs/operators';

import { IApp, ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import {
  SetCreateServiceInstanceCFDetails,
  SetCreateServiceInstanceServiceGuid,
  ResetCreateServiceInstanceState,
} from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../../store/types/api.types';
import { getIdFromRoute } from '../../../cloud-foundry/cf.helpers';
import { servicesServiceFactoryProvider } from '../../service-catalog.helpers';
import { isMarketplaceMode } from '../../services-helper';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';
import { GetApplication } from '../../../../store/actions/application.actions';

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
    private entityServiceFactory: EntityServiceFactory
  ) {

    const { serviceId, cfId, id } = this.getIdsFromRoute();

    // Check if wizard has been initiated from the Services Marketplace
    this.checkAndConfigureServiceForMarketplaceMode();

    // Check if the CF Select step needs to be displayed
    this.displaySelectCfStep = this.setupSelectCFStep(serviceId, cfId, id);

    // Check if the select service step needs to be displayed
    this.displaySelectServiceStep = this.setupSelectServiceStep();

    if (!!cfId && !!id) {
      // Setup wizard for App services mode
      this.setupForAppServiceMode(id, cfId);
    }
    if (!cfId && !id && !serviceId) {
      // Setup wizard for default mode
      this.servicesWallCreateInstance = true;
      this.title$ = Observable.of(`Create Service Instance`);
    }
  }


  setupSelectCFStep = (serviceId: string, cfId: string, id: string) => {
    // Dont show Select CF Step in App Services Mode
    if (!!cfId && !!id) {
      return false;
    } else {
      return true;
    }
  }
  setupSelectServiceStep = () => {
    // Don't show this in marketplace Mode
    const serviceId = getIdFromRoute(this.activatedRoute, 'serviceId');
    const cfId = getIdFromRoute(this.activatedRoute, 'cfId');
    if (!!serviceId && !!cfId) {
      return false;
    } else {
      return true;
    }
  }

  onNext = () => {
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
    const id = getIdFromRoute(this.activatedRoute, 'id');
    return { serviceId, cfId, id };
  }

  private setupForAppServiceMode(id: string, cfId: string) {
    this.appId = id;
    this.bindAppStepperText = 'Binding Params (Optional)';
    const entityService = this.entityServiceFactory.create<APIResource<IApp>>(
      applicationSchemaKey,
      entityFactory(applicationSchemaKey),
      id,
      new GetApplication(id, cfId, [createEntityRelationKey(applicationSchemaKey, spaceSchemaKey)]),
      true);
    entityService.waitForEntity$.pipe(filter(p => !!p), tap(app => {
      const spaceEntity = app.entity.entity.space as APIResource<ISpace>;
      this.store.dispatch(new SetCreateServiceInstanceCFDetails(cfId, spaceEntity.entity.organization_guid, app.entity.entity.space_guid));
      this.title$ = Observable.of(`Create Or Bind Service Instance to '${app.entity.entity.name}'`);
    }), take(1)).subscribe();
  }

  private checkAndConfigureServiceForMarketplaceMode() {
    if (isMarketplaceMode(this.activatedRoute)) {
      const { cfId, serviceId } = this.activatedRoute.snapshot.params;
      this.csiGuidsService.cfGuid = cfId;
      this.csiGuidsService.serviceGuid = serviceId;
      this.cSIHelperService = this.cSIHelperServiceFactory.create(cfId, serviceId);
      this.store.dispatch(new SetCreateServiceInstanceCFDetails(cfId));
      this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceId));
      this.initialiseForMarketplaceMode(serviceId, cfId);
      this.marketPlaceMode = true;
      this.cfOrgSpaceService.cf.list$.pipe(
        filter(p => !!p),
        map(endpoints => endpoints.filter(e => e.guid === cfId)),
        map(e => e[0]),
        tap(e => this.cfOrgSpaceService.cf.select.next(e.guid)),
        take(1)
      ).subscribe();
    }
  }

  ngOnDestroy(): void {
    this.store.dispatch(new ResetCreateServiceInstanceState());
  }

  private initialiseForMarketplaceMode(serviceId: string, cfId: string) {
    const serviceGuid = serviceId;
    this.serviceInstancesUrl = `/service-catalog/${cfId}/${serviceGuid}/instances`;
    this.title$ = this.cSIHelperService.getServiceName().pipe(map(label => `Create Instance: ${label}`));
  }
}

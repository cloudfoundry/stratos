import { TitleCasePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { filter, map, take, tap } from 'rxjs/operators';

import { IApp, ISpace } from '../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { GetApplication } from '../../../../store/actions/application.actions';
import {
  ResetCreateServiceInstanceState,
  SetCreateServiceInstanceCFDetails,
} from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationKey } from '../../../../store/helpers/entity-relations.types';
import { APIResource } from '../../../../store/types/api.types';
import { getIdFromRoute } from '../../../cloud-foundry/cf.helpers';
import { servicesServiceFactoryProvider } from '../../service-catalog.helpers';
import { CreateServiceInstanceHelperService, Mode } from '../create-service-instance-helper.service';

@Component({
  selector: 'app-add-service-instance',
  templateUrl: './add-service-instance.component.html',
  styleUrls: ['./add-service-instance.component.scss'],
  providers: [
    servicesServiceFactoryProvider,
    CreateServiceInstanceHelperService,
    TitleCasePipe
  ]
})
export class AddServiceInstanceComponent implements OnDestroy {

  displaySelectServiceStep: boolean;
  displaySelectCfStep: boolean;
  title$: Observable<string>;
  serviceInstancesUrl: string;
  servicesWallCreateInstance = false;
  stepperText = 'Select a Cloud Foundry instance, organization and space for the service instance.';
  bindAppStepperText = 'Bind App (Optional)';
  appId: string;
  constructor(
    private cSIHelperService: CreateServiceInstanceHelperService,
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private entityServiceFactory: EntityServiceFactory
  ) {

    const { serviceId, cfId, id } = this.getIdsFromRoute();

    // Check if wizard has been initiated from the Services Marketplace
    this.checkAndConfigureServiceForMarketplaceMode(serviceId, cfId);

    // Check if the CF Select step needs to be displayed
    this.displaySelectCfStep = this.setupSelectCFStep(serviceId, cfId, id);

    // Check if the select service step needs to be displayed
    this.displaySelectServiceStep = this.setupSelectServiceStep();

    if (!!cfId && !!id) {
      // Setup wizard for App services mode
      this.setupForAppServiceMode(id, cfId);
    } else {
      // Setup wizard for default mode
      this.servicesWallCreateInstance = true;
      this.title$ = Observable.of(`Create Service Instance`);
    }
  }

  setupSelectCFStep = (serviceId: string, cfId: string, id: string) => {
    // Show Select CF Step only when in the Services Wall mode
    if (!serviceId && !cfId && !id) {
      return true;
    } else {
      return false;
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

  private checkAndConfigureServiceForMarketplaceMode(serviceId: string, cfId: string) {
    if (!!serviceId && !!cfId) {
      this.cSIHelperService.initService(cfId, serviceId, Mode.MARKETPLACE);

      this.cSIHelperService.isInitialised().pipe(
        take(1),
        tap(o => {
          const serviceGuid = serviceId;
          this.serviceInstancesUrl = `/service-catalog/${cfId}/${serviceGuid}/instances`;
          this.title$ = this.cSIHelperService.getServiceName().pipe(
            map(label => `Create Instance: ${label}`)
          );
        })
      ).subscribe();
    }
  }
  ngOnDestroy(): void {
    this.store.dispatch(new ResetCreateServiceInstanceState());
  }
}

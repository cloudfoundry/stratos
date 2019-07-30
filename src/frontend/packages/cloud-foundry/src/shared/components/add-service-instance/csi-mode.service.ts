import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs/operators';

import { CreateServiceBinding } from '../../../../../cloud-foundry/src/actions/service-bindings.actions';
import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { serviceBindingEntityType } from '../../../../../cloud-foundry/src/cf-entity-factory';
import { getIdFromRoute } from '../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { SpaceScopedService } from '../../../../../cloud-foundry/src/features/service-catalog/services.service';
import { selectCfRequestInfo } from '../../../../../cloud-foundry/src/store/selectors/api.selectors';

export enum CreateServiceInstanceMode {
  MARKETPLACE_MODE = 'marketPlaceMode',
  APP_SERVICES_MODE = 'appServicesMode',
  SERVICES_WALL_MODE = 'servicesWallMode',
  EDIT_SERVICE_INSTANCE_MODE = 'editServiceInstanceMode'
}

export const enum CreateServiceFormMode {
  CreateServiceInstance = 'create-service-instance',
  BindServiceInstance = 'bind-service-instance',
}

export const CANCEL_SPACE_ID_PARAM = 'space-guid';
export const CANCEL_ORG_ID_PARAM = 'org-guid';
export const CANCEL_USER_PROVIDED = 'up';

interface ViewDetail {
  showSelectCf: boolean;
  showSelectService: boolean;
  showSelectServicePlan: boolean;
  showBindApp: boolean;
  showSpecifyDetails: boolean;
}

const defaultViewDetail = {
  showSelectCf: true,
  showSelectService: true,
  showSelectServicePlan: true,
  showBindApp: true,
  showSpecifyDetails: true
};

@Injectable()
export class CsiModeService {

  private mode: string;
  public viewDetail: ViewDetail;
  public cancelUrl: string;
  // This property is only used when launching the Create Service Instance Wizard from the Marketplace
  spaceScopedDetails: SpaceScopedService = { isSpaceScoped: false };

  constructor(
    private activatedRoute: ActivatedRoute,
    private store: Store<CFAppState>
  ) {
    const serviceId = getIdFromRoute(activatedRoute, 'serviceId');
    const serviceInstanceId = getIdFromRoute(activatedRoute, 'serviceInstanceId');
    this.cancelUrl = `/services`;
    const spaceGuid = activatedRoute.snapshot.queryParams[CANCEL_SPACE_ID_PARAM];
    const orgGuid = activatedRoute.snapshot.queryParams[CANCEL_ORG_ID_PARAM];
    const isUserProvided = activatedRoute.snapshot.queryParams[CANCEL_USER_PROVIDED];
    const cfId = getIdFromRoute(activatedRoute, 'endpointId');
    const id = getIdFromRoute(activatedRoute, 'id');

    if (!!serviceId && !!cfId) {
      this.mode = CreateServiceInstanceMode.MARKETPLACE_MODE;
      this.cancelUrl = `/marketplace/${cfId}/${serviceId}/instances`;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectService: false,
      };
      this.spaceScopedDetails = {
        isSpaceScoped: activatedRoute.snapshot.queryParams.isSpaceScoped === 'true' ? true : false,
        spaceGuid: activatedRoute.snapshot.queryParams.spaceGuid,
        orgGuid: activatedRoute.snapshot.queryParams.orgGuid,
      };
    }

    if (!!serviceInstanceId && !!cfId) {
      this.mode = CreateServiceInstanceMode.EDIT_SERVICE_INSTANCE_MODE;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectCf: false,
        showSelectService: false,
        showBindApp: false
      };
      const appId = this.activatedRoute.snapshot.queryParams.appId;
      if (appId) {
        this.cancelUrl = `/applications/${cfId}/${appId}/services`;
      }

    }

    if (!!id && !!cfId) {
      this.mode = CreateServiceInstanceMode.APP_SERVICES_MODE;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectCf: false,
      };
      this.cancelUrl = `/applications/${cfId}/${id}/services`;
    }

    if (!cfId) {
      this.mode = CreateServiceInstanceMode.SERVICES_WALL_MODE;
      this.viewDetail = defaultViewDetail;
    }

    if (spaceGuid && orgGuid) {
      this.cancelUrl =
        // tslint:disable-next-line:max-line-length
        `/cloud-foundry/${cfId}/organizations/${orgGuid}/spaces/${spaceGuid}/${isUserProvided ? 'user-service-instances' : 'service-instances'}`;
    }

  }

  getViewDetail = () => this.viewDetail;

  isMarketplaceMode = () => this.mode === CreateServiceInstanceMode.MARKETPLACE_MODE;
  isAppServicesMode = () => this.mode === CreateServiceInstanceMode.APP_SERVICES_MODE;
  isServicesWallMode = () => this.mode === CreateServiceInstanceMode.SERVICES_WALL_MODE;
  isEditServiceInstanceMode = () => this.mode === CreateServiceInstanceMode.EDIT_SERVICE_INSTANCE_MODE;


  public createApplicationServiceBinding(serviceInstanceGuid: string, cfGuid: string, appGuid: string, params: object) {

    const guid = `${cfGuid}-${appGuid}-${serviceInstanceGuid}`;

    this.store.dispatch(new CreateServiceBinding(
      cfGuid,
      guid,
      appGuid,
      serviceInstanceGuid,
      params
    ));

    return this.store.select(selectCfRequestInfo(serviceBindingEntityType, guid)).pipe(
      filter(s => {
        return s && !s.creating;
      }),
      map(req => {
        if (req.error) {
          return { success: false, message: `Failed to create service instance binding: ${req.message}` };
        }
        return { success: true };
      })
    );
  }

}

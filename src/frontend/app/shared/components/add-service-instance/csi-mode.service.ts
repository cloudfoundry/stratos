import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';
import { SpaceScopedService } from '../../../features/service-catalog/services.service';

export enum CreateServiceInstanceMode {
  MARKETPLACE_MODE = 'marketPlaceMode',
  APP_SERVICES_MODE = 'appServicesMode',
  SERVICES_WALL_MODE = 'servicesWallMode',
  EDIT_SERVICE_INSTANCE_MODE = 'editServiceInstanceMode'
}

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
    private activatedRoute: ActivatedRoute
  ) {
    const serviceId = getIdFromRoute(activatedRoute, 'serviceId');
    const serviceInstanceId = getIdFromRoute(activatedRoute, 'serviceInstanceId');
    const cfId = getIdFromRoute(activatedRoute, 'cfId');
    const id = getIdFromRoute(activatedRoute, 'id');

    if (!!serviceId && !!cfId) {
      this.mode = CreateServiceInstanceMode.MARKETPLACE_MODE;
      this.cancelUrl = `/marketplace/${cfId}/${serviceId}/instances`;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectService: false,
      };
      this.spaceScopedDetails = {
        isSpaceScoped: activatedRoute.snapshot.queryParams['isSpaceScoped'] === 'true' ? true : false,
        spaceGuid: activatedRoute.snapshot.queryParams['spaceGuid'],
        orgGuid: activatedRoute.snapshot.queryParams['orgGuid'],
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
      let returnUrl = `/services`;
      const appId = this.activatedRoute.snapshot.queryParams.appId;
      if (appId) {
        returnUrl = `/applications/${cfId}/${appId}/services`;
      }
      this.cancelUrl = returnUrl;
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
      this.cancelUrl = `/services`;
    }


  }

  getViewDetail = () => this.viewDetail;

  isMarketplaceMode = () => this.mode === CreateServiceInstanceMode.MARKETPLACE_MODE;
  isAppServicesMode = () => this.mode === CreateServiceInstanceMode.APP_SERVICES_MODE;
  isServicesWallMode = () => this.mode === CreateServiceInstanceMode.SERVICES_WALL_MODE;
  isEditServiceInstanceMode = () => this.mode === CreateServiceInstanceMode.EDIT_SERVICE_INSTANCE_MODE;

}

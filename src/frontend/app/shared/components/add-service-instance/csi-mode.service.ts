import { Injectable } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../../../features/cloud-foundry/cf.helpers';

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

  constructor(
    private activatedRoute: ActivatedRoute
  ) {
    const serviceId = getIdFromRoute(activatedRoute, 'serviceId');
    const serviceInstanceId = getIdFromRoute(activatedRoute, 'serviceInstanceId');
    const cfId = getIdFromRoute(activatedRoute, 'cfId');
    const id = getIdFromRoute(activatedRoute, 'id');

    if (!!serviceId && !!cfId) {
      this.mode = CreateServiceInstanceMode.MARKETPLACE_MODE;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectService: false,
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
    }

    if (!!id && !!cfId) {
      this.mode = CreateServiceInstanceMode.APP_SERVICES_MODE;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectCf: false,
      };
    }

    if (!cfId) {
      this.mode = CreateServiceInstanceMode.SERVICES_WALL_MODE;
      this.viewDetail = defaultViewDetail;
    }


  }

  getViewDetail = () => this.viewDetail;

  isMarketplaceMode = () => this.mode === CreateServiceInstanceMode.MARKETPLACE_MODE;
  isAppServicesMode = () => this.mode === CreateServiceInstanceMode.APP_SERVICES_MODE;
  isServicesWallMode = () => this.mode === CreateServiceInstanceMode.SERVICES_WALL_MODE;
  isEditServiceInstanceMode = () => this.mode === CreateServiceInstanceMode.EDIT_SERVICE_INSTANCE_MODE;

}

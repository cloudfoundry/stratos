import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, pairwise } from 'rxjs/operators';

import { SpaceScopedService } from '../../../../../cloud-foundry/src/features/service-catalog/services.service';
import { getIdFromRoute } from '../../../../../core/src/core/utils.service';
import { RequestInfoState } from '../../../../../store/src/reducers/api-request-reducer/types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';

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

/**
 * Where should the user be taken on cancel (and success). If not supplied will fall back on previous location and then deduced from
 * params
 */
export const CSI_CANCEL_URL = 'cancel'

/**
 * Used when `CSI_CANCEL_URL` is not supplied
 */
export const CANCEL_SPACE_ID_PARAM = 'space-guid';
/**
 * Used when `CSI_CANCEL_URL` is not supplied
 */
export const CANCEL_ORG_ID_PARAM = 'org-guid';
/**
 * Used when `CSI_CANCEL_URL` is not supplied
 */
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
  /**
   * Where should the user be taken on cancel (and success). Taken from url param, previous location or deduced
   */
  public cancelUrl: string;
  // This property is only used when launching the Create Service Instance Wizard from the Marketplace
  spaceScopedDetails: SpaceScopedService = { isSpaceScoped: false };

  constructor(
    private activatedRoute: ActivatedRoute,
    router: Router
  ) {
    const serviceId = getIdFromRoute(activatedRoute, 'serviceId');
    const serviceInstanceId = getIdFromRoute(activatedRoute, 'serviceInstanceId');
    this.cancelUrl = `/services`;
    const spaceGuid = activatedRoute.snapshot.queryParams[CANCEL_SPACE_ID_PARAM];
    const orgGuid = activatedRoute.snapshot.queryParams[CANCEL_ORG_ID_PARAM];
    const isUserProvided = activatedRoute.snapshot.queryParams[CANCEL_USER_PROVIDED];
    const cfId = getIdFromRoute(activatedRoute, 'endpointId');
    // App id when in create instance from app page mode
    const id = getIdFromRoute(activatedRoute, 'id');

    // Needs tidying up, see #4051

    // Started stepper from the marketplace-->service page
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

    // Started stepper with a service instance... so in edit mode
    if (!!serviceInstanceId && !!cfId) {
      this.mode = CreateServiceInstanceMode.EDIT_SERVICE_INSTANCE_MODE;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectCf: false,
        showSelectService: false,
        showBindApp: false
      };
      // App id when in edit service instance mode
      const appId = this.activatedRoute.snapshot.queryParams.appId;
      if (appId) {
        this.cancelUrl = `/applications/${cfId}/${appId}/services`;
      }

    }

    // Started stepper in stepper tile selector in app mode
    if (!!id && !!cfId) {
      this.mode = CreateServiceInstanceMode.APP_SERVICES_MODE;
      this.viewDetail = {
        ...defaultViewDetail,
        showSelectCf: false,
      };
      this.cancelUrl = `/applications/${cfId}/${id}/services`;
    }

    // Started stepper from the root service instance list
    if (!cfId) {
      this.mode = CreateServiceInstanceMode.SERVICES_WALL_MODE;
      this.viewDetail = defaultViewDetail;
    }

    // Started stepper from a space's service instance list
    if (spaceGuid && orgGuid) {
      this.cancelUrl =
        // tslint:disable-next-line:max-line-length
        `/cloud-foundry/${cfId}/organizations/${orgGuid}/spaces/${spaceGuid}/${isUserProvided ? 'user-service-instances' : 'service-instances'}`;
    }

    this.updateCancelUrl(this.activatedRoute, router);
  }

  getViewDetail = () => this.viewDetail;

  isMarketplaceMode = () => this.mode === CreateServiceInstanceMode.MARKETPLACE_MODE;
  isAppServicesMode = () => this.mode === CreateServiceInstanceMode.APP_SERVICES_MODE;
  isServicesWallMode = () => this.mode === CreateServiceInstanceMode.SERVICES_WALL_MODE;
  isEditServiceInstanceMode = () => this.mode === CreateServiceInstanceMode.EDIT_SERVICE_INSTANCE_MODE;


  public createApplicationServiceBinding(serviceInstanceGuid: string, cfGuid: string, appGuid: string, params: object) {

    const guid = `${cfGuid}-${appGuid}-${serviceInstanceGuid}`;
    return cfEntityCatalog.serviceBinding.api.create<RequestInfoState>(
      guid,
      cfGuid,
      { applicationGuid: appGuid, serviceInstanceGuid, params }
    ).pipe(
      pairwise(),
      filter(([oldS, newS]) => oldS.creating && !newS.creating),
      map(([, newS]) => newS),
      map(req => {
        if (req.error) {
          return { success: false, message: `Failed to create service instance binding: ${req.message}` };
        }
        return { success: true };
      })
    );
  }

  private updateCancelUrl(
    activatedRoute: ActivatedRoute,
    router: Router
  ) {
    // cancelUrl determines where we go on cancel AND success
    const cancelUrl = activatedRoute.snapshot.queryParamMap.get(CSI_CANCEL_URL);
    if (cancelUrl) {
      // Override cancelUrl with what's been passed in (probably came from the service selection pre-step)
      this.cancelUrl = cancelUrl;
    } else {
      // There's some holes with the way cancelUrl in ctor is calculated
      // - marketplace/service/instances list --> cancel goes to space service instance list
      // - marketplace/service create instance --> cancel goes to marketplace/service/instance regardless of starting tab
      // - .. others??
      // For simplicity always go back to the previous location
      // - good catch all
      // - doesn't work that well for marketplace/service create instance --> success (should go to marketplace/service/instance)
      // - if user has refreshed on stepper (previous url was login) use the old cancelUrl best-guess value
      const currentNavigation = router.getCurrentNavigation();
      if (currentNavigation &&
        currentNavigation.previousNavigation &&
        currentNavigation.previousNavigation.finalUrl &&
        currentNavigation.previousNavigation.finalUrl.toString() !== '/login'
      ) {
        this.cancelUrl = currentNavigation.previousNavigation.finalUrl.toString();
      }
    }
  }

}

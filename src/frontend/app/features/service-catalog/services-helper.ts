import { Subscription } from 'rxjs/Subscription';

import { IService, IServiceBroker, IServicePlan, IServicePlanVisibility } from '../../core/cf-api-svc.types';
import { APIResource } from '../../store/types/api.types';
import { CreateServiceInstanceState } from '../../store/types/create-service-instance.types';
import { Observable } from 'rxjs/Observable';
import { RequestInfoState } from '../../store/reducers/api-request-reducer/types';
import { ActivatedRoute } from '@angular/router';
import { getIdFromRoute } from '../cloud-foundry/cf.helpers';

export const fetchVisiblePlans =
  (svcPlans: APIResource<IServicePlan>[],
    svcPlanVis: APIResource<IServicePlanVisibility>[],
    svcBroker: APIResource<IServiceBroker>,
    spaceGuid: string = null
  ): APIResource<IServicePlan>[] => {
    const visiblePlans: APIResource<IServicePlan>[] = [];
    svcPlans.forEach(p => {
      if (p.entity.public) {
        visiblePlans.push(p);
      } else if (svcPlanVis.filter(svcVis => svcVis.entity.service_plan_guid === p.metadata.guid).length > 0) {
        // plan is visibilities
        visiblePlans.push(p);
      } else if (svcBroker.entity.space_guid) {

        if (!spaceGuid || (svcBroker.entity.space_guid !== spaceGuid)) {
          // Plan is space-scoped
          visiblePlans.push(p);
        }
      }
    });
    return visiblePlans;
  };


export const getSvcAvailability = (servicePlan: APIResource<IServicePlan>,
  serviceBroker: APIResource<IServiceBroker>,
  allServicePlanVisibilities: APIResource<IServicePlanVisibility>[]) => {
  const svcAvailability = {
    isPublic: false, spaceScoped: false, hasVisibilities: false, guid: servicePlan.metadata.guid, spaceGuid: null
  };
  if (serviceBroker.entity.space_guid) {
    svcAvailability.spaceScoped = true;
    svcAvailability.spaceGuid = serviceBroker.entity.space_guid;
  } else {
    const servicePlanVisibilities = allServicePlanVisibilities.filter(
      s => s.entity.service_plan_guid === servicePlan.metadata.guid
    );
    if (servicePlanVisibilities.length > 0) {
      svcAvailability.hasVisibilities = true;
    }
  }
  return svcAvailability;
};

export const safeUnsubscribe = (s: Subscription) => { if (s) { s.unsubscribe(); } };

export const getServiceJsonParams = (params: any): {} => {
  let prms = params;
  try {
    prms = JSON.parse(params) || null;
  } catch (e) {
    prms = null;
  }
  return prms;
};


export const isMarketplaceMode = (activatedRoute: ActivatedRoute) => {
  const serviceId = getIdFromRoute(activatedRoute, 'serviceId');
  const cfId = getIdFromRoute(activatedRoute, 'cfId');
  return !!serviceId && !!cfId;
};

export const isAppServicesMode = (activatedRoute: ActivatedRoute) => {
  const id = getIdFromRoute(activatedRoute, 'id');
  const cfId = getIdFromRoute(activatedRoute, 'cfId');
  return !!id && !!cfId;
};
export const isServicesWallMode = (activatedRoute: ActivatedRoute) => {
  return !isAppServicesMode(activatedRoute) && !isMarketplaceMode(activatedRoute);
};


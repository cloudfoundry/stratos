import { Subscription } from 'rxjs/Subscription';

import { IService, IServiceBroker, IServicePlan, IServicePlanVisibility } from '../../core/cf-api-svc.types';
import { APIResource } from '../../store/types/api.types';

export const fetchVisiblePlans =
  (svcPlans: APIResource<IServicePlan>[],
    svcPlanVis: APIResource<IServicePlanVisibility>[],
    svcBroker: APIResource<IServiceBroker>,
    svc: APIResource<IService>): APIResource<IServicePlan>[] => {
    const visiblePlans: APIResource<IServicePlan>[] = [];
    svcPlans.forEach(p => {
      if (p.entity.public) {
        visiblePlans.push(p);
      } else if (svcPlanVis.filter(svcVis => svcVis.entity.service_plan_guid === p.metadata.guid).length > 0) {
        // plan is visibilities
        visiblePlans.push(p);
      } else if (svcBroker.entity.space_guid) {
        // Plan is space-scoped
        visiblePlans.push(p);
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

import { Observable } from 'rxjs';

import { spaceEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import { StratosStatus } from '../../../../../core/src/shared/shared.types';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IApp, ISpace } from '../../../cf-api.types';
import { getStartedAppInstanceCount } from '../../../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { OrgSpaceQuotaHelper } from './cloud-foundry-org-space-quota';

export class SpaceQuotaHelper extends OrgSpaceQuotaHelper<ISpace> {
  constructor(
    cfEndpointService: CloudFoundryEndpointService,
    emf: EntityMonitorFactory,
    spaceGuid: string) {
    super(
      cfEndpointService,
      emf,
      spaceGuid,
      spaceEntityType,
    );
  }

  protected quotaPropertyName: 'quota_definition' | 'space_quota_definition' = 'space_quota_definition';
  protected fetchAppsFn = (space: APIResource<ISpace>): Observable<APIResource<IApp>[]> =>
    this.cfEndpointService.getAppsInSpaceViaAllApps(space)
  protected getOrgOrSpaceCardStatus = (space: APIResource<ISpace>, apps: APIResource<IApp>[]): StratosStatus => {
    const spaceQuota = space.entity.space_quota_definition;
    // Ensure we check each on in turn
    return this.handleQuotaStatus(space.entity.routes && space.entity.routes.length, spaceQuota.entity.total_routes) ||
      this.handleQuotaStatus(space.entity.service_instances && space.entity.service_instances.length, spaceQuota.entity.total_services) ||
      this.handleQuotaStatus(getStartedAppInstanceCount(apps), spaceQuota.entity.app_instance_limit) ||
      this.handleQuotaStatus(this.cfEndpointService.getMetricFromApps(apps, 'memory'), spaceQuota.entity.memory_limit) ?
      StratosStatus.WARNING :
      StratosStatus.NONE;
  }
}

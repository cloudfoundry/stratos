import { Observable } from 'rxjs';

import { IApp, ISpace } from '../../../core/cf-api.types';
import { getStartedAppInstanceCount } from '../../../core/cf.helpers';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { CardStatus } from '../../../shared/shared.types';
import { spaceSchemaKey } from '../../../store/helpers/entity-factory';
import { APIResource } from '../../../store/types/api.types';
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
      spaceSchemaKey,
    );
  }

  protected quotaPropertyName: 'quota_definition' | 'space_quota_definition' = 'space_quota_definition';
  protected fetchAppsFn = (space: APIResource<ISpace>): Observable<APIResource<IApp>[]> =>
    this.cfEndpointService.getAppsInSpaceViaAllApps(space)
  protected getOrgOrSpaceCardStatus = (space: APIResource<ISpace>, apps: APIResource<IApp>[]): CardStatus => {
    const spaceQuota = space.entity.space_quota_definition;
    // Ensure we check each on in turn
    return this.handleQuotaStatus(space.entity.routes.length, spaceQuota.entity.total_routes) ||
      this.handleQuotaStatus(space.entity.service_instances.length, spaceQuota.entity.total_services) ||
      this.handleQuotaStatus(getStartedAppInstanceCount(apps), spaceQuota.entity.app_instance_limit) ||
      this.handleQuotaStatus(this.cfEndpointService.getMetricFromApps(apps, 'memory'), spaceQuota.entity.memory_limit) ?
      CardStatus.WARNING :
      CardStatus.NONE;
  }
}

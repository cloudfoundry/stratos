import { Observable } from 'rxjs';

import { organizationEntityType } from '../../../../../cloud-foundry/src/cf-entity-types';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { APIResource } from '../../../../../store/src/types/api.types';
import { StratosStatus } from '../../../../../store/src/types/shared.types';
import { IApp, IOrganization } from '../../../cf-api.types';
import { getEntityFlattenedList, getStartedAppInstanceCount } from '../../../cf.helpers';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { OrgSpaceQuotaHelper } from './cloud-foundry-org-space-quota';

export class OrgQuotaHelper extends OrgSpaceQuotaHelper<IOrganization> {
  constructor(
    cfEndpointService: CloudFoundryEndpointService,
    emf: EntityMonitorFactory,
    orgGuid: string) {
    super(
      cfEndpointService,
      emf,
      orgGuid,
      organizationEntityType,
    );
  }

  protected quotaPropertyName: 'quota_definition' | 'space_quota_definition' = 'quota_definition';
  protected fetchAppsFn = (orgOrSpace: APIResource<IOrganization>): Observable<APIResource<IApp>[]> =>
    this.cfEndpointService.getAppsInOrgViaAllApps(orgOrSpace)
  protected getOrgOrSpaceCardStatus = (org: APIResource<IOrganization>, apps: APIResource<IApp>[]): StratosStatus => {
    const orgQuota = org.entity.quota_definition;
    // Ensure we check each on in turn
    return this.handleQuotaStatus(getEntityFlattenedList('routes', org.entity.spaces).length, orgQuota.entity.total_routes) ||
      this.handleQuotaStatus(getEntityFlattenedList('service_instances', org.entity.spaces).length, orgQuota.entity.total_services) ||
      this.handleQuotaStatus(org.entity.private_domains.length, orgQuota.entity.total_private_domains) ||
      this.handleQuotaStatus(getStartedAppInstanceCount(apps), orgQuota.entity.app_instance_limit) ||
      this.handleQuotaStatus(this.cfEndpointService.getMetricFromApps(apps, 'memory'), orgQuota.entity.memory_limit) ?
      StratosStatus.WARNING :
      StratosStatus.NONE;
  }
}

import type { Observable } from 'rxjs';

import type { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import type { APIResource } from '../../../../../store/src/types/api.types';
import { StratosStatus } from '../../../../../store/src/types/shared.types';
import type { IApp, IOrganization, ISpace } from '../../../cf-api.types';
import { organizationEntityType } from '../../../cf-entity-types';
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
    const spaces = org.entity.spaces as APIResource<ISpace>[] | undefined;
    const privateDomains = org.entity.private_domains as unknown[] | undefined;
    // Ensure we check each on in turn
    return this.handleQuotaStatus(getEntityFlattenedList('routes', (spaces || []) as unknown as APIResource<Record<string, unknown>>[]).length, orgQuota.entity.total_routes) ||
      this.handleQuotaStatus(getEntityFlattenedList('service_instances', (spaces || []) as unknown as APIResource<Record<string, unknown>>[]).length, orgQuota.entity.total_services) ||
      this.handleQuotaStatus(privateDomains?.length || 0, orgQuota.entity.total_private_domains) ||
      this.handleQuotaStatus(getStartedAppInstanceCount(apps), orgQuota.entity.app_instance_limit) ||
      this.handleQuotaStatus(this.cfEndpointService.getMetricFromApps(apps, 'memory'), orgQuota.entity.memory_limit) ?
      StratosStatus.WARNING :
      StratosStatus.NONE;
  }
}

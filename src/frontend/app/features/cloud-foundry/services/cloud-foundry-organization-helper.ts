import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, startWith, switchMap } from 'rxjs/operators';

import { IApp, IOrganization } from '../../../core/cf-api.types';
import { getEntityFlattenedList, getStartedAppInstanceCount } from '../../../core/cf.helpers';
import { truthyIncludingZero } from '../../../core/utils.service';
import { CardStatus, determineCardStatus } from '../../../shared/components/cards/card-status/card-status.component';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { entityFactory, organizationSchemaKey } from '../../../store/helpers/entity-factory';
import { APIResource } from '../../../store/types/api.types';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';

function handleStatus(value: number, limit: number): CardStatus {
  const status = determineCardStatus(value, limit);
  return status === CardStatus.WARNING || status === CardStatus.ERROR ? CardStatus.WARNING : null;
}

function createOrgStateObs(
  cfEndpointService: CloudFoundryEndpointService,
  org$: Observable<APIResource<IOrganization>>,
  apps$: Observable<APIResource<IApp>[]>,
): Observable<CardStatus> {
  return combineLatest(
    org$,
    apps$
  ).pipe(
    first(),
    map(([org, apps]) => {
      const orgQuota = org.entity.quota_definition;
      // Ensure we check each on in turn
      return handleStatus(getEntityFlattenedList('routes', org.entity.spaces).length, orgQuota.entity.total_routes) ||
        handleStatus(getEntityFlattenedList('service_instances', org.entity.spaces).length, orgQuota.entity.total_services) ||
        handleStatus(org.entity.private_domains.length, orgQuota.entity.total_private_domains) ||
        handleStatus(getStartedAppInstanceCount(apps), orgQuota.entity.app_instance_limit) ||
        handleStatus(cfEndpointService.getMetricFromApps(apps, 'memory'), orgQuota.entity.memory_limit) ?
        CardStatus.WARNING :
        CardStatus.NONE;
    })
  );
}

function hasQuotas(org$: Observable<APIResource<IOrganization>>): Observable<boolean> {
  return org$.pipe(
    map(org =>
      !!org.entity.quota_definition && (
        truthyIncludingZero(org.entity.quota_definition.entity.total_routes) ||
        truthyIncludingZero(org.entity.quota_definition.entity.total_services) ||
        truthyIncludingZero(org.entity.quota_definition.entity.total_private_domains) ||
        truthyIncludingZero(org.entity.quota_definition.entity.app_instance_limit) ||
        truthyIncludingZero(org.entity.quota_definition.entity.memory_limit))
    )
  );
}

function createAllAppsInOrgObs(
  org$: Observable<APIResource<IOrganization>>,
  cfEndpointService: CloudFoundryEndpointService): Observable<APIResource<IApp>[]> {
  return org$.pipe(
    switchMap(org => cfEndpointService.getAppsInOrgViaAllApps(org))
  );
}

export function createOrganizationStateObs(
  orgGuid: string,
  cfEndpointService: CloudFoundryEndpointService,
  emf: EntityMonitorFactory): Observable<CardStatus> {
  // It can be expensive to iterate over apps to determine usage, so cut out early if there's no quotas or we can't determine all apps
  const org$ = emf.create<APIResource<IOrganization>>(
    orgGuid,
    organizationSchemaKey,
    entityFactory(organizationSchemaKey),
    false).entity$.pipe(filter(org => !!org));
  return combineLatest(
    hasQuotas(org$),
    cfEndpointService.hasAllApps$
  ).pipe(
    switchMap(([validQuotas, hasApps]) =>
      validQuotas && hasApps ?
        createOrgStateObs(cfEndpointService, org$, createAllAppsInOrgObs(org$, cfEndpointService)) :
        observableOf(CardStatus.NONE))
  );
}

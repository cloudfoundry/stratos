import { combineLatest, type Observable, of as observableOf } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { truthyIncludingZeroString } from '@stratosui/core';

// Helper function for truthyIncludingZero that accepts numbers
const truthyIncludingZero = (value: number | null | undefined): boolean => {
  return value === 0 || !!value;
};

// determineCardStatus is not exported from @stratosui/core, keeping relative import
import { determineCardStatus } from '../../../../../core/src/shared/components/cards/card-status/card-status.component';
import type { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import type { APIResource } from '../../../../../store/src/types/api.types';
import { StratosStatus } from '../../../../../store/src/types/shared.types';
import type { IApp, IOrganization, ISpace, IQuotaDefinition } from '../../../cf-api.types';
import { CFEntityConfig } from '../../../cf-types';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';


export abstract class OrgSpaceQuotaHelper<T = IOrganization | ISpace> {

  constructor(
    protected cfEndpointService: CloudFoundryEndpointService,
    emf: EntityMonitorFactory,
    orgOrSpaceGuid: string,
    orgOrSpaceEntityType: string,
  ) {
    this.orgOrSpace$ = emf.create<APIResource<T>>(
      orgOrSpaceGuid,
      new CFEntityConfig(orgOrSpaceEntityType),
      false
    ).entity$.pipe(filter(orgOrSpace => !!orgOrSpace));
  }

  protected orgOrSpace$: Observable<APIResource<T>>;

  protected abstract quotaPropertyName: 'quota_definition' | 'space_quota_definition';
  protected abstract fetchAppsFn: (orgOrSpace: APIResource<T>) => Observable<APIResource<IApp>[]>;
  protected abstract getOrgOrSpaceCardStatus: (orgOrSpace: APIResource<T>, apps: APIResource<IApp>[]) => StratosStatus;

  public createStateObs(): Observable<StratosStatus> {
    return combineLatest(
      this.hasQuotas(),
      this.cfEndpointService.appsPagObs.hasEntities$
    ).pipe(
      switchMap(([validQuotas, hasApps]) =>
        // It can be expensive to iterate over apps to determine usage, so cut out early if there's no quotas or we can't determine all apps
        validQuotas && hasApps ?
          this.internalCreateStateObs() :
          observableOf(StratosStatus.NONE))
    );
  }

  private internalCreateStateObs(): Observable<StratosStatus> {
    return combineLatest(
      this.orgOrSpace$,
      this.createAllAppsObs()
    ).pipe(
      first(),
      map(([orgOrSpace, apps]) => this.getOrgOrSpaceCardStatus(orgOrSpace, apps))
    );
  }

  protected handleQuotaStatus(value: number, limit: number): StratosStatus {
    const status = determineCardStatus(value, limit);
    return status === StratosStatus.WARNING || status === StratosStatus.ERROR ? StratosStatus.WARNING : null;
  }

  private hasQuotas(): Observable<boolean> {
    return this.orgOrSpace$.pipe(
      map(resource => {
        const entity = resource.entity as Record<string, unknown>;
        const quota = entity[this.quotaPropertyName] as { entity: IQuotaDefinition } | undefined;
        return !!quota && (
          truthyIncludingZero(quota.entity.total_routes) ||
          truthyIncludingZero(quota.entity.total_services) ||
          truthyIncludingZero(quota.entity.total_private_domains) ||
          truthyIncludingZero(quota.entity.app_instance_limit) ||
          truthyIncludingZero(quota.entity.memory_limit))
      })
    );
  }

  private createAllAppsObs(): Observable<APIResource<IApp>[]> {
    return this.orgOrSpace$.pipe(
      switchMap(this.fetchAppsFn)
    );
  }
}

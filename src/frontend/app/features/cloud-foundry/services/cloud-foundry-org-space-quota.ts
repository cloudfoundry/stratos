import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { IApp, IOrganization, ISpace } from '../../../core/cf-api.types';
import { truthyIncludingZero } from '../../../core/utils.service';
import { determineCardStatus } from '../../../shared/components/cards/card-status/card-status.component';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { CardStatus } from '../../../shared/shared.types';
import { entityFactory } from '../../../store/helpers/entity-factory';
import { APIResource } from '../../../store/types/api.types';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';


export abstract class OrgSpaceQuotaHelper<T = IOrganization | ISpace> {

  constructor(
    protected cfEndpointService: CloudFoundryEndpointService,
    emf: EntityMonitorFactory,
    orgOrSpaceGuid: string,
    orgOrSpaceSchemaKey: string,
  ) {
    this.orgOrSpace$ = emf.create<APIResource<T>>(
      orgOrSpaceGuid,
      orgOrSpaceSchemaKey,
      entityFactory(orgOrSpaceSchemaKey),
      false).entity$.pipe(filter(orgOrSpace => !!orgOrSpace));
  }

  protected orgOrSpace$: Observable<APIResource<T>>;

  protected abstract quotaPropertyName: 'quota_definition' | 'space_quota_definition';
  protected abstract fetchAppsFn: (orgOrSpace: APIResource<T>) => Observable<APIResource<IApp>[]>;
  protected abstract getOrgOrSpaceCardStatus: (orgOrSpace: APIResource<T>, apps: APIResource<IApp>[]) => CardStatus;

  public createStateObs(): Observable<CardStatus> {
    return combineLatest(
      this.hasQuotas(),
      this.cfEndpointService.hasAllApps$
    ).pipe(
      switchMap(([validQuotas, hasApps]) =>
        // It can be expensive to iterate over apps to determine usage, so cut out early if there's no quotas or we can't determine all apps
        validQuotas && hasApps ?
          this.internalCreateStateObs() :
          observableOf(CardStatus.NONE))
    );
  }

  private internalCreateStateObs(): Observable<CardStatus> {
    return combineLatest(
      this.orgOrSpace$,
      this.createAllAppsObs()
    ).pipe(
      first(),
      map(([orgOrSpace, apps]) => this.getOrgOrSpaceCardStatus(orgOrSpace, apps))
    );
  }

  protected handleQuotaStatus(value: number, limit: number): CardStatus {
    const status = determineCardStatus(value, limit);
    return status === CardStatus.WARNING || status === CardStatus.ERROR ? CardStatus.WARNING : null;
  }

  private hasQuotas(): Observable<boolean> {
    return this.orgOrSpace$.pipe(
      map(resource =>
        !!resource.entity[this.quotaPropertyName] && (
          truthyIncludingZero(resource.entity[this.quotaPropertyName].entity.total_routes) ||
          truthyIncludingZero(resource.entity[this.quotaPropertyName].entity.total_services) ||
          truthyIncludingZero(resource.entity[this.quotaPropertyName].entity.total_private_domains) ||
          truthyIncludingZero(resource.entity[this.quotaPropertyName].entity.app_instance_limit) ||
          truthyIncludingZero(resource.entity[this.quotaPropertyName].entity.memory_limit))
      )
    );
  }

  private createAllAppsObs(): Observable<APIResource<IApp>[]> {
    return this.orgOrSpace$.pipe(
      switchMap(this.fetchAppsFn)
    );
  }
}

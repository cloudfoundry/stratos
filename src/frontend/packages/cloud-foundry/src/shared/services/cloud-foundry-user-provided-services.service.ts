import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { take, filter, map, catchError, tap } from 'rxjs/operators';

import {
  ClearPaginationOfType,
  EntityCatalogEntityConfig,
  PaginationMonitorFactory,
  APIResource
} from '@stratosui/store';
import {
  getUserProvidedServiceInstanceRelations,
  IUserProvidedServiceInstanceData } from '../../actions/user-provided-service.actions';
import { IUserProvidedServiceInstance } from '../../cf-api-svc.types';
import { CFAppState } from '../../cf-app-state';
import { cfEntityCatalog } from '../../cf-entity-catalog';
import { organizationEntityType, spaceEntityType } from '../../cf-entity-types';
import { createEntityRelationPaginationKey } from '../../entity-relations/entity-relations.types';
import { fetchTotalResults } from '../../features/cf/cf.helpers';
import { QParam, QParamJoiners } from '../q-param';

export interface UpsCreateResult {
  success: boolean;
  guid?: string;
  message?: string;
}

export interface UpsUpdateResult {
  success: boolean;
  message?: string;
}


@Injectable({
  providedIn: 'root'
})
export class CloudFoundryUserProvidedServicesService {
  private store = inject<Store<CFAppState>>(Store);
  private paginationMonitorFactory = inject(PaginationMonitorFactory);
  private http = inject(HttpClient);


  public getUserProvidedServices(cfGuid: string, spaceGuid?: string, relations = getUserProvidedServiceInstanceRelations)
    : Observable<APIResource<IUserProvidedServiceInstance>[]> {

    const pagObs = cfEntityCatalog.userProvidedService.store.getAllInSpace.getPaginationService(
      cfGuid, spaceGuid, null, relations, true
    );
    return combineLatest([
      pagObs.entities$, // Ensure entities is subbed to the fetch kicks off
      pagObs.fetchingEntities$
    ]).pipe(
      filter(([, fetching]) => !fetching),
      map(([entities]) => entities)
    );
  }

  public fetchUserProvidedServiceInstancesCount(cfGuid: string, orgGuid?: string, spaceGuid?: string)
    : Observable<number> {
    const parentSchemaKey = spaceGuid ? spaceEntityType : orgGuid ? organizationEntityType : 'cf';
    const uniqueKey = spaceGuid || orgGuid || cfGuid;

    const action = cfEntityCatalog.userProvidedService.actions.getMultiple(
      createEntityRelationPaginationKey(parentSchemaKey, uniqueKey),
      cfGuid,
      { includeRelations: [], populateMissing: false }
    );
    action.initialParams.q = [];
    if (orgGuid) {
      action.initialParams.q.push(new QParam('organization_guid', orgGuid, QParamJoiners.in).toString());
    }
    if (spaceGuid) {
      action.initialParams.q.push(new QParam('space_guid', spaceGuid, QParamJoiners.in).toString());
    }
    return fetchTotalResults(action, this.store, this.paginationMonitorFactory);
  }

  public getUserProvidedService(cfGuid: string, upsGuid: string): Observable<APIResource<IUserProvidedServiceInstance>> {
    return cfEntityCatalog.userProvidedService.store.getEntityService(upsGuid, cfGuid, {}).waitForEntity$.pipe(
      map(e => e.entity)
    );
  }

  public createUserProvidedService(
    cfGuid: string,
    _guid: string,
    data: IUserProvidedServiceInstanceData
  ): Observable<UpsCreateResult> {
    return this.http.post<{ guid: string }>(
      `/pp/v1/cf/user_provided_service_instances/${cfGuid}`,
      this.toV3RequestBody(data),
    ).pipe(
      tap(() => this.clearServiceInstancePagination()),
      map(res => ({ success: true, guid: res.guid } as UpsCreateResult)),
      catchError((err: HttpErrorResponse) => of<UpsCreateResult>({
        success: false,
        message: this.extractErrorMessage(err),
      })),
    );
  }

  updateUserProvidedService(
    cfGuid: string,
    guid: string,
    data: Partial<IUserProvidedServiceInstanceData>,
  ): Observable<UpsUpdateResult> {
    return this.http.patch<{ guid: string }>(
      `/pp/v1/cf/user_provided_service_instances/${cfGuid}/${guid}`,
      this.toV3RequestBody(data),
    ).pipe(
      map(() => ({ success: true } as UpsUpdateResult)),
      catchError((err: HttpErrorResponse) => of<UpsUpdateResult>({
        success: false,
        message: this.extractErrorMessage(err),
      })),
    );
  }

  private toV3RequestBody(data: Partial<IUserProvidedServiceInstanceData>): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    if (data.name !== undefined) {
      body.name = data.name;
    }
    if (data.spaceGuid !== undefined) {
      body.spaceGuid = data.spaceGuid;
    }
    if (data.tags !== undefined) {
      body.tags = data.tags;
    }
    if (data.credentials !== undefined) {
      body.credentials = data.credentials;
    }
    if (data.syslog_drain_url !== undefined) {
      body.syslogDrainUrl = data.syslog_drain_url;
    }
    if (data.route_service_url !== undefined) {
      body.routeServiceUrl = data.route_service_url;
    }
    return body;
  }

  private clearServiceInstancePagination(): void {
    // Service-instance list mixes managed + UPS rows; flush so the new
    // row shows up on the next subscription. The legacy entity-catalog
    // wiring is the source of truth for this dispatch — guard it so the
    // method survives test environments that don't bootstrap the catalog.
    const cfg = cfEntityCatalog.serviceInstance?.actions?.getMultiple('', '', {});
    if (cfg) {
      this.store.dispatch(new ClearPaginationOfType(cfg as EntityCatalogEntityConfig));
    }
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.message === 'string') {
      return body.message;
    }
    return err.message || `HTTP ${err.status}`;
  }
}

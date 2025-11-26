import { Store } from '@ngrx/store';
import { type Observable, of } from 'rxjs';

import { type IListConfig, ListDataSource, type RowState } from '@stratosui/core';
import type { AppState } from '../../../../../store/src/public-api';
import type { PaginationEntityState } from '../../../../../store/src/types/pagination.types';
import { helmEntityCatalog } from '../../../helm/helm-entity-catalog';
import type { MonocularVersion } from './../../../helm/store/helm.types';


const typeFilterKey = 'versionType';


export class HelmReleaseVersionsDataSource extends ListDataSource<MonocularVersion> {

  private currentVersion: string;

  constructor(
    store: Store<AppState>,
    listConfig: IListConfig<MonocularVersion>,
    repoName: string,
    chartName: string,
    version: string,
    monocularEndpoint: string,
  ) {
    const action = helmEntityCatalog.chartVersions.actions.getMultiple(null, null, {
      repoName,
      chartName,
      monocularEndpoint
    });
    super({
      store,
      action,
      schema: action.entity[0],
      getRowUniqueId: (object: MonocularVersion) => action.entity[0].getId(object),
      paginationKey: action.paginationKey,
      isLocal: true,
      transformEntities: [
        (entities: MonocularVersion[], paginationState: PaginationEntityState) => this.endpointTypeFilter(entities, paginationState)
      ],
      listConfig,
    });

    this.currentVersion = version;
    this.getRowState = (row: MonocularVersion): Observable<RowState> => of({ highlighted: row.attributes.version === this.currentVersion });
  }


  public endpointTypeFilter(entities: MonocularVersion[], paginationState: PaginationEntityState): MonocularVersion[] {
    if (
      !paginationState.clientPagination ||
      !paginationState.clientPagination.filter ||
      !paginationState.clientPagination.filter.items[typeFilterKey]) {
      return entities;
    }

    // Filter out development versions if configured
    const showAll = paginationState.clientPagination.filter.items[typeFilterKey] === 'all';
    return showAll ? entities : entities.filter(e => e.attributes.version.indexOf('-') === -1);
  }
}


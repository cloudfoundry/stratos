import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';

import {
  DataFunction,
  ListDataSource,
} from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { RowState } from '../../../../../../core/src/shared/components/list/data-sources-controllers/list-data-source-types';
import { IListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { PaginationEntityState } from '../../../../../../store/src/types/pagination.types';
import { helmEntityCatalog } from '../../../helm/helm-entity-catalog';
import { helmEntityFactory, monocularChartVersionsEntityType } from '../../../helm/helm-entity-factory';
import { MonocularVersion } from './../../../helm/store/helm.types';


const typeFilterKey = 'versionType';


export class HelmReleaseVersionsDataSource extends ListDataSource<MonocularVersion> {

  private currentVersion: string;

  constructor(
    store: Store<any>,
    listConfig: IListConfig<MonocularVersion>,
    repoName: string,
    chartName: string,
    version: string,
  ) {
    super({
      store,
      action: helmEntityCatalog.chartVersions.actions.getMultiple(repoName, chartName),
      schema: helmEntityFactory(monocularChartVersionsEntityType),
      getRowUniqueId: (object: MonocularVersion) => object.id,
      paginationKey: helmEntityCatalog.chartVersions.actions.getMultiple(repoName, chartName).paginationKey,
      isLocal: true,
      transformEntities: [
        (entities: MonocularVersion[], paginationState: PaginationEntityState) => this.endpointTypeFilter(entities, paginationState)
      ],
      listConfig,
    });

    this.currentVersion = version;
    this.getRowState = (row: any): Observable<RowState> => of({ highlighted: row.attributes.version === this.currentVersion });
  }


  public endpointTypeFilter: DataFunction<MonocularVersion> = (entities: MonocularVersion[], paginationState: PaginationEntityState) => {
    if (
      !paginationState.clientPagination ||
      !paginationState.clientPagination.filter ||
      !paginationState.clientPagination.filter.items[typeFilterKey]) {
      return entities;
    }

    // Filter out development versions if configured
    const showAll = paginationState.clientPagination.filter.items[typeFilterKey] === 'all';
    return showAll ?  entities : entities.filter(e => e.attributes.version.indexOf('-') === -1);
  }
}


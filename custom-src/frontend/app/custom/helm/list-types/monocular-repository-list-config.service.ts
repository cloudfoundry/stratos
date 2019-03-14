import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { IListConfig, ListViewTypes } from '../../../shared/components/list/list.component.types';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import { AppState } from '../../../../../store/src/app-state';
import { EndpointModel, endpointStoreNames } from '../../../../../store/src/types/endpoint.types';
import { EndpointCardComponent } from '../../../shared/components/list/list-types/cf-endpoints/cf-endpoint-card/endpoint-card.component';
import { selectUpdateInfo } from '../../../../../store/src/selectors/api.selectors';
import { pairwise } from 'rxjs/operators';
import { getFullEndpointApiUrl } from '../../../features/endpoints/endpoint-helpers';
import { MonocularRepositoryDataSource } from './monocular-repository-list-source';
import { ActivatedRoute } from '@angular/router';
import { HelmRepositoryCountComponent } from './helm-repository-count/helm-repository-count.component';

@Injectable()
export class MonocularRepositoryListConfig implements IListConfig<EndpointModel> {
  isLocal = true;
  dataSource: MonocularRepositoryDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  cardComponent = EndpointCardComponent;
  text = {
    title: '',
    filter: 'Filter Repositories',
    noEntries: 'There are no repositories'
  };
  enableTextFilter = true;
  tableFixedRowHeight = true;
  columns = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => `${row.name}`
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'address',
      headerCell: () => 'Address',
      cellDefinition: {
        getValue: getFullEndpointApiUrl
      },
      sort: {
        type: 'sort',
        orderKey: 'address',
        field: 'api_endpoint.Host'
      },
      cellFlex: '8'
    },
    {
      columnId: 'chartCount',
      headerCell: () => 'Charts',
      cellComponent: HelmRepositoryCountComponent,
      cellFlex: '1'
    },
  ] as ITableColumn<EndpointModel>[];

  private handleAction(item, effectKey, handleChange) {
    const disSub = this.store.select(selectUpdateInfo(
      endpointStoreNames.type,
      item.guid,
      effectKey,
    )).pipe(
      pairwise())
      .subscribe(([oldVal, newVal]) => {
        if (!newVal.error && (oldVal.busy && !newVal.busy)) {
          handleChange([oldVal, newVal]);
          disSub.unsubscribe();
        }
      });
  }

  constructor(
    private store: Store<AppState>,
    public activatedRoute: ActivatedRoute,
  ) {
    const highlighted = activatedRoute.snapshot.params.guid;
    this.dataSource = new MonocularRepositoryDataSource(this.store, this, 'helm', highlighted);
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}

import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { IListConfig, ListViewTypes } from '../../../shared/components/list/list.component.types';
import { ITableColumn } from '../../../shared/components/list/list-table/table.types';
import { AppState } from '../../../../../store/src/app-state';
import { endpointStoreNames } from '../../../../../store/src/types/endpoint.types';
import { selectUpdateInfo } from '../../../../../store/src/selectors/api.selectors';
import { pairwise } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { HelmReleasesDataSource } from './monocular-releases-list-source';
import { HelmRelease } from '../store/helm.types';
import { DatePipe } from '@angular/common';
import { HelmReleaseLinkComponent } from './helm-release-link/helm-release-link.component';
import { TableCellEndpointNameComponent } from '../../../shared/components/list/list-types/endpoint/table-cell-endpoint-name/table-cell-endpoint-name.component';

@Injectable()
export class HelmReleasesListConfig implements IListConfig<HelmRelease> {
  isLocal = true;
  dataSource: HelmReleasesDataSource;
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: '',
    filter: 'Filter Releases',
    noEntries: 'There are no releases'
  };
  enableTextFilter = true;
  tableFixedRowHeight = true;
  columns = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellComponent: HelmReleaseLinkComponent,
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      },
      cellFlex: '2'
    },
    {
      columnId: 'cluster',
      headerCell: () => 'Cluster',
      cellComponent: TableCellEndpointNameComponent,
      cellFlex: '2'
    },
    {
      columnId: 'namespace',
      headerCell: () => 'Namespace',
      cellDefinition: {
        getValue: (row) => `${row.namespace}`
      },
      sort: {
        type: 'sort',
        orderKey: 'namespace',
        field: 'namespace'
      },
      cellFlex: '2'
    },
    {
      columnId: 'status',
      headerCell: () => 'Status',
      cellDefinition: {
        getValue: (row) => `${row.status}`
      },
      sort: {
        type: 'sort',
        orderKey: 'status',
        field: 'status'
      },
      cellFlex: '2'
    },
    {
      columnId: 'version',
      headerCell: () => 'Version',
      cellDefinition: {
        getValue: (row) => `${row.version}`
      },
      sort: {
        type: 'sort',
        orderKey: 'version',
        field: 'version'
      },
      cellFlex: '1'
    },
    {
      columnId: 'last_Deployed',
      headerCell: () => 'Last Deployed',
      cellDefinition: {
        getValue: (row) => `${this.datePipe.transform(row.lastDeployed, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'lastDeployed',
        field: 'lastDeployed'
      },
      cellFlex: '2'
    },
  ] as ITableColumn<HelmRelease>[];

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
    private datePipe: DatePipe,
  ) {
    this.dataSource = new HelmReleasesDataSource(this.store, this);
  }

  public getColumns = () => this.columns;
  public getGlobalActions = () => [];
  public getMultiActions = () => [];
  public getSingleActions = () => [];
  public getMultiFiltersConfigs = () => [];
  public getDataSource = () => this.dataSource;
}

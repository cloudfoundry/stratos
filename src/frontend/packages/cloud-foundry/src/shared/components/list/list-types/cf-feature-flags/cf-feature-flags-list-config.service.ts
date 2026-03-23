import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { ITableColumn, IListFilter, ListViewTypes } from '@stratosui/core';
import { ListView } from '@stratosui/store';
import { CFAppState, IFeatureFlag, ActiveRouteCfOrgSpace } from '@stratosui/cloud-foundry';

import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfFeatureFlagsDataSource } from './cf-feature-flags-data-source';
import {
  TableCellFeatureFlagDescriptionComponent,
} from './table-cell-feature-flag-description/table-cell-feature-flag-description.component';
import { TableCellFeatureFlagStateComponent } from './table-cell-feature-flag-state/table-cell-feature-flag-state.component';

@Injectable({
  providedIn: 'root'
})
export class CfFeatureFlagsListConfigService extends BaseCfListConfig<IFeatureFlag> {
  private store = inject(Store<CFAppState>);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);

  constructor() {
    super();
    this.dataSource = new CfFeatureFlagsDataSource(this.store, this.activeRouteCfOrgSpace.cfGuid!, this as any);
  }

  dataSource: CfFeatureFlagsDataSource;
  defaultView = 'table' as ListView;
  pageSizeOptions = [25, 50, 100];
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    title: null as string | null,
    filter: 'Filter by Name',
    noEntries: 'There are no feature flags'
  };

  columns: Array<ITableColumn<IFeatureFlag>> = [
    {
      columnId: CfFeatureFlagsDataSource.nameColumnId,
      headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row: IFeatureFlag) => `${row.name}`
      },
      class: 'table-column-select',
      cellFlex: '2',
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      }
    },
    {
      columnId: CfFeatureFlagsDataSource.descriptionColumnId,
      headerCell: () => 'Description',
      cellComponent: TableCellFeatureFlagDescriptionComponent,
      class: 'table-column-select',
      cellFlex: '4'
    },
    {
      columnId: 'state',
      headerCell: () => 'State',
      cellComponent: TableCellFeatureFlagStateComponent,
      sort: {
        type: 'sort',
        orderKey: 'state',
        field: 'entity.enabled'
      },
      cellFlex: '1'
    }
  ];

  filters: IListFilter[] = [
    {
      default: true,
      key: CfFeatureFlagsDataSource.nameColumnId,
      label: 'Name',
      placeholder: 'Filter by Name'
    },
    {
      key: CfFeatureFlagsDataSource.descriptionColumnId,
      label: 'Description',
      placeholder: 'Filter by Description'
    }
  ];

  getFilters = () => this.filters;
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}

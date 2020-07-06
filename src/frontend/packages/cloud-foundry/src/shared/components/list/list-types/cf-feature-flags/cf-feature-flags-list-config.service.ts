import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { IListFilter, ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { IFeatureFlag } from '../../../../../cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfFeatureFlagsDataSource } from './cf-feature-flags-data-source';
import {
  TableCellFeatureFlagDescriptionComponent,
} from './table-cell-feature-flag-description/table-cell-feature-flag-description.component';
import { TableCellFeatureFlagStateComponent } from './table-cell-feature-flag-state/table-cell-feature-flag-state.component';

@Injectable()
export class CfFeatureFlagsListConfigService extends BaseCfListConfig<IFeatureFlag> {

  constructor(private store: Store<CFAppState>, activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfFeatureFlagsDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }

  dataSource: CfFeatureFlagsDataSource;
  defaultView = 'table' as ListView;
  pageSizeOptions = [25, 50, 100];
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by name',
    noEntries: 'There are no feature flags'
  };

  columns: Array<ITableColumn<IFeatureFlag>> = [
    {
      columnId: CfFeatureFlagsDataSource.nameColumnId,
      headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => `${row.name}`
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

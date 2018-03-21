import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IFeatureFlag } from '../../../../../core/cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ITableColumn } from '../../list-table/table.types';
import { ListViewTypes } from '../../list.component.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfFeatureFlagsDataSource, FeatureFlagDescriptions } from './cf-feature-flags-data-source';
import { TableCellFeatureFlagStateComponent } from './table-cell-feature-flag-state/table-cell-feature-flag-state.component';

@Injectable()
export class CfFeatureFlagsListConfigService extends BaseCfListConfig<APIResource<IFeatureFlag>> {
  dataSource: CfFeatureFlagsDataSource;
  defaultView = 'table' as ListView;
  pageSizeOptions = [10, 25, 50];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: null,
    noEntries: 'There are no feature flags'
  };

  columns: Array<ITableColumn<APIResource<IFeatureFlag>>> = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => `${row.entity.name}`
      },
      class: 'table-column-select',
      cellFlex: '2'
    },
    {
      columnId: 'description',
      headerCell: () => 'Description',
      cellDefinition: {
        getValue: (row) => FeatureFlagDescriptions[row.entity.name]
      },
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
  constructor(private store: Store<AppState>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfFeatureFlagsDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}

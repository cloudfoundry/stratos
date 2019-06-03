import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IFeatureFlag } from '../../../../../core/cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { ITableColumn } from '../../list-table/table.types';
import { ListViewTypes } from '../../list.component.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfFeatureFlagsDataSource, FeatureFlagDescriptions } from './cf-feature-flags-data-source';
import { TableCellFeatureFlagStateComponent } from './table-cell-feature-flag-state/table-cell-feature-flag-state.component';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { CFAppState } from '../../../../../../../store/src/app-state';

@Injectable()
export class CfFeatureFlagsListConfigService extends BaseCfListConfig<APIResource<IFeatureFlag>> {
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

  columns: Array<ITableColumn<APIResource<IFeatureFlag>>> = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => `${row.entity.name}`
      },
      class: 'table-column-select',
      cellFlex: '2',
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'entity.name'
      }
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
  constructor(private store: Store<CFAppState>, private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace) {
    super();
    this.dataSource = new CfFeatureFlagsDataSource(this.store, activeRouteCfOrgSpace.cfGuid, this);
  }
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
}

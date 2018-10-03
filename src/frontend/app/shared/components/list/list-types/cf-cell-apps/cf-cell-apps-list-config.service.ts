import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { ActiveRouteCfCell } from '../../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { TableCellAsyncComponent, TableCellAsyncConfig } from '../../list-table/table-cell-async/table-cell-async.component';
import { ListViewTypes } from '../../list.component.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCellApp, CfCellAppsDataSource } from './cf-cell-apps-source';

@Injectable()
export class CfCellAppsListConfigService extends BaseCfListConfig<CfCellApp> {

  dataSource: CfCellAppsDataSource;
  defaultView = 'table' as ListView;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  text = {
    title: null,
    noEntries: 'There are no applications'
  };

  constructor(store: Store<AppState>, activeRouteCfCell: ActiveRouteCfCell, entityServiceFactory: EntityServiceFactory) {
    super();
    this.dataSource = new CfCellAppsDataSource(store, activeRouteCfCell.cfGuid, activeRouteCfCell.cellId, this, entityServiceFactory);
  }

  getColumns = () => [
    {
      columnId: 'app', headerCell: () => 'Application',
      cellComponent: TableCellAsyncComponent,
      cellFlex: '1',
      cellConfig: {
        pathToObs: 'appEntityService',
        pathToValue: 'entity.name'
      } as TableCellAsyncConfig,
    },
    {
      columnId: 'space', headerCell: () => 'Space',
      cellComponent: TableCellAsyncComponent,
      cellFlex: '1',
      cellConfig: {
        pathToObs: 'appEntityService',
        pathToValue: 'entity.space.entity.name'
      } as TableCellAsyncConfig,
    },
    {
      columnId: 'org', headerCell: () => 'Organization',
      cellComponent: TableCellAsyncComponent,
      cellFlex: '1',
      cellConfig: {
        pathToObs: 'appEntityService',
        pathToValue: 'entity.space.entity.organization.entity.name'
      } as TableCellAsyncConfig,
    },
  ]
  getDataSource = () => this.dataSource;
}

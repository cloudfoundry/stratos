import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ApplicationService } from '../../../../../features/applications/application.service';
import { AppVariablesDelete } from '../../../../../store/actions/app-variables.actions';
import { AppState } from '../../../../../store/app-state';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, IMultiListAction, ListViewTypes } from '../../list.component.types';
import { TableCellEditComponent } from '../../list-table/table-cell-edit/table-cell-edit.component';
import { CaaspNodesDataSource, CaaspNodeInfo } from './caasp-nodes-data-source';
import { ActivatedRoute } from '@angular/router';

@Injectable()
export class CaaspNodesListConfigService implements IListConfig<CaaspNodeInfo> {
  nodesDataSource: CaaspNodesDataSource;

  columns: Array<ITableColumn<CaaspNodeInfo>> = [
    {
      columnId: 'name', headerCell: () => 'Name',
      cellDefinition: {
        getValue: (row) => `${row.name}`
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'name'
      }, cellFlex: '5'
    },
  ];

  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Nodes', filter: 'Search by name'
  };
  enableTextFilter = true;

  getGlobalActions = () => null;
  getMultiActions = () => [];
  getSingleActions = () => [];
  getColumns = () => this.columns;
  getDataSource = () => this.nodesDataSource;
  getMultiFiltersConfigs = () => [];

  constructor(
    private store: Store<AppState>,
    private activatedRoute: ActivatedRoute,
  ) {
    const caaspId = activatedRoute.snapshot.params.caaspId;
    this.nodesDataSource = new CaaspNodesDataSource(this.store, caaspId, this);
  }

}

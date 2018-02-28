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
      columnId: 'minion_id', headerCell: () => 'ID',
      cellDefinition: {
        getValue: (row) => `${row.minion_id}`
      },
      sort: {
        type: 'sort',
        orderKey: 'minion_id',
        field: 'minion_id'
      },
      cellFlex: '5',
    },
    {
      columnId: 'fqdn', headerCell: () => 'FQDN',
      cellDefinition: {
        getValue: (row) => `${row.fqdn}`
      },
      sort: {
        type: 'sort',
        orderKey: 'fqdn',
        field: 'fqdn'
      },
      cellFlex: '5',
    },
    {
      columnId: 'role', headerCell: () => 'Role',
      cellDefinition: {
        getValue: (row) => `${row.role}`
      },
      sort: {
        type: 'sort',
        orderKey: 'role',
        field: 'role'
      },
      cellFlex: '1',
    },
  ];

  pageSizeOptions = [9, 45, 90];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: 'Nodes'
  };
  enableTextFilter = false;

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

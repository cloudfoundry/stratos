import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { UtilsService } from '../../../../../core/utils.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { DeleteApplicationInstance } from '../../../../../store/actions/application.actions';
import { AppState } from '../../../../../store/app-state';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, ListViewTypes } from '../../list.component.types';
import { CfAppInstancesDataSource, ListAppInstance } from './cf-app-instances-data-source';
import { TableCellUsageComponent } from './table-cell-usage/table-cell-usage.component';

@Injectable()
export class CfAppInstancesConfigService implements IListConfig<ListAppInstance> {

  instancesSource: CfAppInstancesDataSource;
  columns: Array<ITableColumn<ListAppInstance>> = [
    {
      columnId: 'index',
      headerCell: () => 'Index',
      cellDefinition: {
        getValue: (row) => `${row.index}`
      },
      sort: {
        type: 'sort',
        orderKey: 'index',
        field: 'index',
      }, cellFlex: '1'
    },
    {
      columnId: 'state',
      headerCell: () => 'State',
      cellDefinition: {
        getValue: (row) => `${row.value.state}`
      },
      sort: {
        type: 'sort',
        orderKey: 'state',
        field: 'value.state'
      }, cellFlex: '1',
      class: 'app-table__cell--table-column-nowrap',
    },
    {
      columnId: 'memory', headerCell: () => 'Memory',
      cellConfig: {
        value: (row) => row.usage.mem,
        label: (row) => this.utilsService.usageBytes([
          row.usage.hasStats ? row.value.stats.usage.mem : 0,
          row.usage.hasStats ? row.value.stats.mem_quota : 0
        ])
      },
      cellComponent: TableCellUsageComponent, sort: {
        type: 'sort',
        orderKey: 'memory',
        field: 'usage.mem'
      }, cellFlex: '3'
    },
    {
      columnId: 'disk', headerCell: () => 'Disk',
      cellConfig: {
        value: (row) => row.usage.disk,
        label: (row) => this.utilsService.usageBytes([
          row.usage.hasStats ? row.value.stats.usage.disk : 0,
          row.usage.hasStats ? row.value.stats.disk_quota : 0
        ])
      },
      cellComponent: TableCellUsageComponent, sort: {
        type: 'sort',
        orderKey: 'disk',
        field: 'usage.disk'
      }, cellFlex: '3'
    },
    {
      columnId: 'cpu', headerCell: () => 'CPU',
      cellConfig: {
        value: (row) => row.usage.cpu,
        label: (row) => this.utilsService.percent(row.usage.hasStats ? row.value.stats.usage.cpu : 0)
      },
      cellComponent: TableCellUsageComponent, sort: {
        type: 'sort',
        orderKey: 'cpu',
        field: 'usage.cpu'
      }, cellFlex: '2'
    },
    {
      columnId: 'uptime',
      headerCell: () => 'Uptime',
      cellDefinition: {
        getValue: (row) => row.usage.hasStats ? this.utilsService.formatUptime(row.value.stats.uptime) : '-'
      },
      sort: {
        type: 'sort',
        orderKey: 'uptime',
        field: 'value.stats.uptime'
      }, cellFlex: '5'
    }
  ];
  viewType = ListViewTypes.TABLE_ONLY;
  text = {
    title: null,
    noEntries: 'There are no applications'
  };

  private listActionTerminate: IListAction<any> = {
    action: (item) => {
      const confirmation = new ConfirmationDialogConfig(
        'Terminate Instance?',
        `Are you sure you want to terminate instance ${item.index}?`,
        'Terminate',
        true
      );
      this.confirmDialog.open(
        confirmation,
        () => this.store.dispatch(new DeleteApplicationInstance(this.appService.appGuid, item.index, this.appService.cfGuid))
      );
    },
    icon: 'delete',
    label: 'Terminate',
    description: ``, // Description depends on console user permission
    visible: row => true,
    enabled: row => true,
  };

  private listActionSsh: IListAction<any> = {
    action: (item) => {
      const index = item.index;
      const sshRoute = (
        `/applications/${this.appService.cfGuid}/${this.appService.appGuid}/ssh/${index}`
      );
      this.router.navigate([sshRoute]);
    },
    icon: 'computer',
    label: 'SSH',
    description: ``, // Description depends on console user permission
    visible: row => true,
    enabled: row => !!(row.value && row.value.state === 'RUNNING'),
  };

  private singleActions = [
    this.listActionTerminate,
    this.listActionSsh,
  ];

  constructor(
    private store: Store<AppState>,
    private appService: ApplicationService,
    private utilsService: UtilsService,
    private router: Router,
    private confirmDialog: ConfirmationDialogService,
  ) {
    this.instancesSource = new CfAppInstancesDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
      this,
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => this.singleActions;
  getColumns = () => this.columns;
  getDataSource = () => this.instancesSource;
  getMultiFiltersConfigs = () => [];

}

import { UtilsService } from '../../core/utils.service';
import { TableCellUsageComponent } from '../components/table/custom-cells/table-cell-usage/table-cell-usage.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { ApplicationService } from '../../features/applications/application.service';
import { CfAppInstancesDataSource, ListAppInstance } from '../data-sources/cf-app-instances-data-source';
import { IListAction, IListConfig } from '../components/list/list.component';
import { APIResource, EntityInfo } from '../../store/types/api.types';
import { ITableColumn } from '../components/table/table.types';
import {
  TableCellEventTimestampComponent,
} from '../components/table/custom-cells/table-cell-event-timestamp/table-cell-event-timestamp.component';
import {
  TableCellEventTypeComponent,
} from '../components/table/custom-cells/table-cell-event-type/table-cell-event-type.component';
import {
  TableCellEventActionComponent,
} from '../components/table/custom-cells/table-cell-event-action/table-cell-event-action.component';
import {
  TableCellEventDetailComponent,
} from '../components/table/custom-cells/table-cell-event-detail/table-cell-event-detail.component';
import { Injectable } from '@angular/core';
import { TableCellActionsComponent } from '../components/table/table-cell-actions/table-cell-actions.component';
import { DeleteApplicationInstance } from '../../store/actions/application.actions';
import { AppStat } from '../../store/types/app-metadata.types';

@Injectable()
export class CfAppInstancesConfigService implements IListConfig<ListAppInstance> {

  instancesSource: CfAppInstancesDataSource;
  columns: Array<ITableColumn<ListAppInstance>> = [
    {
      columnId: 'index', headerCell: () => 'Index', cell: (row) => `${row.index}`, sort: true, cellFlex: '1'
    },
    {
      columnId: 'state', headerCell: () => 'State', cell: (row) => `${row.value.state}`, sort: true, cellFlex: '1'
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
      cellComponent: TableCellUsageComponent, sort: true, cellFlex: '3'
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
      cellComponent: TableCellUsageComponent, sort: true, cellFlex: '3'
    },
    {
      columnId: 'cpu', headerCell: () => 'CPU',
      cellConfig: {
        value: (row) => row.usage.cpu,
        label: (row) => this.utilsService.percent(row.usage.hasStats ? row.value.stats.usage.cpu : 0)
      },
      cellComponent: TableCellUsageComponent, sort: true, cellFlex: '2'
    },
    {
      columnId: 'uptime', headerCell: () => 'Uptime', cell: (row) =>
        (row.usage.hasStats ? this.utilsService.formatUptime(row.value.stats.uptime) : '-'), sort: true, cellFlex: '5'
    },
    {
      columnId: 'edit',
      headerCell: () => 'Actions',
      cellComponent: TableCellActionsComponent,
      class: 'table-column-edit',
      cellFlex: '1'
    }
  ];
  pageSizeOptions = [5, 25, 50];


  private listActionTerminate: IListAction<any> = {
    action: (item) => {
      this.store.dispatch(new DeleteApplicationInstance(this.appService.appGuid, item.index, this.appService.cfGuid));
    },
    icon: 'delete',
    label: 'Terminate',
    description: ``, // Description depends on console user permission
    visible: row => true,
    enabled: row => !!(row.value && row.value.state === 'RUNNING'),
  };

  private listActionSSh: IListAction<any> = {
    action: (item) => {
      window.alert('SSH!');
    },
    icon: 'computer',
    label: 'SSH',
    description: ``, // Description depends on console user permission
    visible: row => true,
    enabled: row => !!(row.value && row.value.state === 'RUNNING'),
  };

  private singleActions = [
    this.listActionTerminate,
    this.listActionSSh
  ];

  constructor(private store: Store<AppState>, private appService: ApplicationService, private utilsService: UtilsService) {
    this.instancesSource = new CfAppInstancesDataSource(
      this.store,
      this.appService.cfGuid,
      this.appService.appGuid,
    );
  }

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => this.singleActions;
  getColumns = () => this.columns;
  getDataSource = () => this.instancesSource;
  getMultiFiltersConfigs = () => [];

}

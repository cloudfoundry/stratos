import { UtilsService } from '../../core/utils.service';
import { TableCellUsageComponent } from '../components/table/custom-cells/table-cell-usage/table-cell-usage.component';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { ApplicationService } from '../../features/applications/application.service';
import { CfAppInstancesDataSource } from '../data-sources/cf-app-instances-data-source';
import { IListAction, IListConfig } from '../components/list/list.component';
import { EntityInfo } from '../../store/types/api.types';
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

@Injectable()
export class CfAppInstancesConfigService implements IListConfig<any> {

  instancesSource: CfAppInstancesDataSource;
  columns: Array<ITableColumn<any>> = [
    {
      columnId: 'index', headerCell: () => 'Index', cell: (row) => `${row.index}`, sort: true, cellFlex: '1'
    },
    {
      columnId: 'state', headerCell: () => 'State', cell: (row) => `${row.value.state}`, sort: true, cellFlex: '1'
    },
    {
      columnId: 'memory', headerCell: () => 'Memory',
      cellConfig: {
        value: (row) => row.value.stats.usage.mem / row.value.stats.mem_quota,
        label: (row) => this.utilsService.usageBytes([row.value.stats.usage.mem, row.value.stats.mem_quota])
      },
      cellComponent: TableCellUsageComponent, sort: true, cellFlex: '3'
    },
    {
      columnId: 'disk', headerCell: () => 'Disk',
      cellConfig: {
        value: (row) => row.value.stats.usage.disk / row.value.stats.disk_quota,
        label: (row) => this.utilsService.usageBytes([row.value.stats.usage.disk, row.value.stats.disk_quota])
      },
      cellComponent: TableCellUsageComponent, sort: true, cellFlex: '3'
    },
    {
      columnId: 'cpu', headerCell: () => 'CPU',
      cellConfig: {
        value: (row) => row.value.stats.usage.cpu,
        label: (row) => this.utilsService.percent(row.value.stats.usage.cpu)
      },
      cellComponent: TableCellUsageComponent, sort: true, cellFlex: '2'
    },
    {
      columnId: 'uptime', headerCell: () => 'Uptime', cell: (row) => this.utilsService.formatUptime(row.value.stats.uptime), cellFlex: '5'
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
      window.alert('TERMINATE!');
    },
    icon: 'remove_from_queue',
    label: 'Terminate',
    description: ``, // Description depends on console user permission
    visible: row => true,
    enabled: row => !!(row.value && row.value.state === 'RUNNING'),
  };

  private singleActions = [
    this.listActionTerminate,
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
  getFiltersConfigs = () => [];

}

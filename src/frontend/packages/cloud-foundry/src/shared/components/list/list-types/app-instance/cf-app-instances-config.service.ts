import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { combineLatest, map, switchMap } from 'rxjs/operators';

import { DeleteApplicationInstance } from '../../../../../../../cloud-foundry/src/actions/application.actions';
import { FetchApplicationMetricsAction } from '../../../../../../../cloud-foundry/src/actions/cf-metrics.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { UtilsService } from '../../../../../../../core/src/core/utils.service';
import { ConfirmationDialogConfig } from '../../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import {
  getIntegerFieldSortFunction,
} from '../../../../../../../core/src/shared/components/list/data-sources-controllers/local-filtering-sorting';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import {
  IListAction,
  IListConfig,
  ListViewTypes,
} from '../../../../../../../core/src/shared/components/list/list.component.types';
import { MetricQueryType } from '../../../../../../../core/src/shared/services/metrics-range-selector.types';
import { MetricQueryConfig } from '../../../../../../../store/src/actions/metrics.actions';
import { EntityServiceFactory } from '../../../../../../../store/src/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../../../../store/src/monitors/pagination-monitor.factory';
import { IMetricMatrixResult, IMetrics } from '../../../../../../../store/src/types/base-metric.types';
import { IMetricApplication } from '../../../../../../../store/src/types/metric.types';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { CfCellHelper } from '../../../../../features/cloud-foundry/cf-cell.helpers';
import { ListAppInstance } from './app-instance-types';
import { CfAppInstancesDataSource } from './cf-app-instances-data-source';
import { TableCellCfCellComponent } from './table-cell-cf-cell/table-cell-cf-cell.component';
import { TableCellUsageComponent } from './table-cell-usage/table-cell-usage.component';

export function createAppInstancesMetricAction(appGuid: string, cfGuid: string): FetchApplicationMetricsAction {
  return new FetchApplicationMetricsAction(
    appGuid,
    cfGuid,
    new MetricQueryConfig('firehose_container_metric_cpu_percentage'),
    MetricQueryType.QUERY
  );
}

@Injectable()
export class CfAppInstancesConfigService implements IListConfig<ListAppInstance> {

  instancesSource: CfAppInstancesDataSource;
  metricResults$: Observable<IMetricMatrixResult<IMetricApplication>[]>;
  columns: Array<ITableColumn<ListAppInstance>> = [
    {
      columnId: 'index',
      headerCell: () => 'Index',
      cellDefinition: {
        getValue: (row) => `${row.index}`
      },
      sort: getIntegerFieldSortFunction('index'),
      cellFlex: '1'
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
      }, cellFlex: '2'
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
      }, cellFlex: '2'
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
      }, cellFlex: '3'
    }
  ];
  cfCellColumn: ITableColumn<ListAppInstance> = {
    columnId: 'cell',
    headerCell: () => 'Cell',
    cellConfig: {
      metricResults$: null
    },
    cellComponent: TableCellCfCellComponent,
    cellFlex: '2'
  };

  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = true;
  text = {
    title: null,
    filter: 'Search by state',
    noEntries: 'There are no application instances'
  };
  private initialised$: Observable<boolean>;

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
    label: 'Terminate',
    description: ``, // Description depends on console user permission

  };

  private listActionSsh: IListAction<any> = {
    action: (item) => {
      const index = item.index;
      const sshRoute = (
        `/applications/${this.appService.cfGuid}/${this.appService.appGuid}/ssh/${index}`
      );
      this.router.navigate([sshRoute]);
    },
    label: 'SSH',
    description: ``, // Description depends on console user permission
    createEnabled: row$ =>
      row$.pipe(switchMap(row => {
        return this.appService.app$.pipe(
          combineLatest(this.appService.appSpace$),
          map(([app, space]) => {
            return row.value &&
              row.value.state === 'RUNNING' &&
              app.entity.entity.enable_ssh &&
              space.entity.allow_ssh;
          })
        );
      }))
  };

  private singleActions = [
    this.listActionTerminate,
    this.listActionSsh,
  ];

  constructor(
    private store: Store<CFAppState>,
    private appService: ApplicationService,
    private utilsService: UtilsService,
    private router: Router,
    private confirmDialog: ConfirmationDialogService,
    entityServiceFactory: EntityServiceFactory,
    paginationMonitorFactory: PaginationMonitorFactory
  ) {
    const cellHelper = new CfCellHelper(store, paginationMonitorFactory);

    this.initialised$ = cellHelper.hasCellMetrics(appService.cfGuid).pipe(
      map(hasMetrics => {
        if (hasMetrics) {
          this.columns.splice(1, 0, this.cfCellColumn);
          this.cfCellColumn.cellConfig = {
            metricEntityService: this.createMetricsResults(entityServiceFactory),
            cfGuid: this.appService.cfGuid
          };
        }
        return true;
      })
    );

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
  getInitialised = () => this.initialised$;

  private createMetricsResults(entityServiceFactory: EntityServiceFactory) {
    const metricsAction = createAppInstancesMetricAction(this.appService.appGuid, this.appService.cfGuid);
    return entityServiceFactory.create<IMetrics<IMetricMatrixResult<IMetricApplication>>>(
      metricsAction.guid,
      metricsAction
    );
  }
}

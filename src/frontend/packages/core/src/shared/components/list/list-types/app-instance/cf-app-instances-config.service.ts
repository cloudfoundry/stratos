import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { combineLatest as combineLatestOp, filter, map, switchMap } from 'rxjs/operators';

import { DeleteApplicationInstance } from '../../../../../../../store/src/actions/application.actions';
import {
  FetchApplicationMetricsAction,
  FetchCfEiriniMetricsAction,
  MetricQueryConfig,
} from '../../../../../../../store/src/actions/metrics.actions';
import { AppState } from '../../../../../../../store/src/app-state';
import { entityFactory, metricSchemaKey } from '../../../../../../../store/src/helpers/entity-factory';
import { IMetricMatrixResult, IMetrics } from '../../../../../../../store/src/types/base-metric.types';
import { EndpointsRelation } from '../../../../../../../store/src/types/endpoint.types';
import { IMetricApplication } from '../../../../../../../store/src/types/metric.types';
import { EndpointsService } from '../../../../../core/endpoints.service';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { UtilsService } from '../../../../../core/utils.service';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { MetricQueryType } from '../../../../services/metrics-range-selector.types';
import { ConfirmationDialogConfig } from '../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';
import { getIntegerFieldSortFunction } from '../../data-sources-controllers/local-filtering-sorting';
import { ITableColumn } from '../../list-table/table.types';
import { IListAction, IListConfig, ListViewTypes } from '../../list.component.types';
import { ListAppInstance } from './app-instance-types';
import { CfAppInstancesDataSource } from './cf-app-instances-data-source';
import { TableCellCfCellComponent } from './table-cell-cf-cell/table-cell-cf-cell.component';
import { TableCellKubeNodeComponent } from './table-cell-kube-node/table-cell-kube-node.component';
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
    cellConfig: { },
    cellComponent: TableCellCfCellComponent,
    cellFlex: '2'
  };
  cfEiriniColumn: ITableColumn<ListAppInstance> = {
    columnId: 'eirini',
    headerCell: () => 'Kube Node',
    cellConfig: { },
    cellComponent: TableCellKubeNodeComponent,
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
          combineLatestOp(this.appService.appSpace$),
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
    private store: Store<AppState>,
    private appService: ApplicationService,
    private utilsService: UtilsService,
    private router: Router,
    private confirmDialog: ConfirmationDialogService,
    private endpointsService: EndpointsService,
    entityServiceFactory: EntityServiceFactory,
  ) {

    this.initialised$ = combineLatest([
      this.endpointsService.eiriniMetricsProvider(appService.cfGuid),
      this.endpointsService.hasCellMetrics(appService.cfGuid),
    ]).pipe(
      map(([eiriniMetricsProvider, hasCellMetrics]) => {
        if (hasCellMetrics) {
          this.columns.splice(1, 0, this.cfCellColumn);
          this.cfCellColumn.cellConfig = {
            metricEntityService: this.createMetricsResults(entityServiceFactory),
            cfGuid: this.appService.cfGuid
          };
        }
        if (eiriniMetricsProvider) {
          this.columns.splice(1, 0, this.cfEiriniColumn);
          this.cfEiriniColumn.cellConfig = {
            eiriniPodsService: this.createEiriniPodService(entityServiceFactory, eiriniMetricsProvider)
          };
        }
        return true;
    }));

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
      metricSchemaKey,
      entityFactory(metricSchemaKey),
      metricsAction.guid,
      metricsAction,
      false
    );
  }

  private createEiriniPodService(entityServiceFactory: EntityServiceFactory, eiriniMetricsProvider: EndpointsRelation) {
    const metricsKey = `${this.appService.cfGuid}:${this.appService.appGuid}:appPods`;
    const action = new FetchCfEiriniMetricsAction(
      metricsKey,
      this.appService.cfGuid,
      // tslint:disable-next-line:max-line-length
      new MetricQueryConfig(`kube_pod_labels{label_guid="${this.appService.appGuid}",namespace="${eiriniMetricsProvider.metadata.namespace}"} / on(pod) group_right kube_pod_info`),
      MetricQueryType.QUERY
    );
    return entityServiceFactory.create<IMetrics<IMetricMatrixResult<IMetricApplication>>>(
      metricSchemaKey,
      entityFactory(metricSchemaKey),
      action.guid,
      action,
      false
    );
  }
}

import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest as combineLatestObs, type Observable } from 'rxjs';
import { combineLatest, map, switchMap } from 'rxjs/operators';
import {
  CurrentUserPermissionsService,
  type UtilsService,
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  getIntegerFieldSortFunction,
  type ITableColumn,
  type IGlobalListAction,
  type IListAction,
  type IListConfig,
  type IMultiListAction,
  type IListMultiFilterConfig,
  ListViewTypes,
} from '@stratosui/core';
import {
  EntityServiceFactory,
  PaginationMonitorFactory,
  MetricQueryConfig,
  type IMetricMatrixResult,
  type IMetrics,
  type IMetricApplication,
  MetricQueryType,
  type GeneralEntityAppState,
} from '@stratosui/store';
import { DeleteApplicationInstance } from '../../../../../actions/application.actions';
import { FetchApplicationMetricsAction } from '../../../../../actions/cf-metrics.actions';
import type { CFAppState } from '../../../../../cf-app-state';
import type { ApplicationService } from '../../../../../features/applications/application.service';
import { CfCellHelper } from '../../../../../features/cf/cf-cell.helpers';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import type { ListAppInstance } from './app-instance-types';
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

@Injectable({
  providedIn: 'root'
})
export class CfAppInstancesConfigService implements IListConfig<ListAppInstance> {

  instancesSource: CfAppInstancesDataSource;
  metricResults$!: Observable<IMetricMatrixResult<IMetricApplication>[]>;
  columns: Array<ITableColumn<ListAppInstance>> = [
    {
      columnId: 'index',
      headerCell: () => 'Index',
      cellDefinition: {
        getValue: (row) => `${row.index}`
      },
      sort: getIntegerFieldSortFunction('index') as any,
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
        value: (row: ListAppInstance): number => row.usage.mem,
        label: (row: ListAppInstance): string => this.utilsService.usageBytes([
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
        value: (row: ListAppInstance): number => row.usage.disk,
        label: (row: ListAppInstance): string => this.utilsService.usageBytes([
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
        value: (row: ListAppInstance): number => row.usage.cpu,
        label: (row: ListAppInstance): string => this.utilsService.percent(row.usage.hasStats ? row.value.stats.usage.cpu : 0)
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
  text: { title: string | null; filter: string; noEntries: string } = {
    title: null,
    filter: 'Search by state',
    noEntries: 'There are no application instances'
  };
  private initialised$: Observable<boolean>;

  private listActionTerminate: IListAction<ListAppInstance> = {
    action: (item: ListAppInstance) => {
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
    createVisible: () => this.canEditApp$
  };

  private listActionSsh: IListAction<ListAppInstance> = {
    action: (item: ListAppInstance) => {
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
            return !!(
              row?.value &&
              row.value.state === 'RUNNING' &&
              app &&
              app.entity &&
              app.entity.entity &&
              app.entity.entity.enable_ssh &&
              space &&
              space.entity &&
              space.entity.allow_ssh
            );
          })
        );
      })),
    createVisible: () => this.canEditApp$
  };

  private singleActions = [
    this.listActionTerminate,
    this.listActionSsh,
  ];

  private canEditApp$: Observable<boolean>;

  constructor(
    private store: Store<GeneralEntityAppState>,
    private appService: ApplicationService,
    private utilsService: UtilsService,
    private router: Router,
    private confirmDialog: ConfirmationDialogService,
    entityServiceFactory: EntityServiceFactory,
    paginationMonitorFactory: PaginationMonitorFactory,
    cups: CurrentUserPermissionsService
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

    this.canEditApp$ = combineLatestObs(
      appService.appOrg$,
      appService.appSpace$
    ).pipe(
      switchMap(([org, space]) =>
        cups.can(CfCurrentUserPermissions.APPLICATION_EDIT, appService.cfGuid, org.metadata.guid, space.metadata.guid)
      )
    );
  }

  getGlobalActions = (): IGlobalListAction<ListAppInstance>[] => [];
  getMultiActions = (): IMultiListAction<ListAppInstance>[] => [];
  getSingleActions = (): IListAction<ListAppInstance>[] => this.singleActions;
  getColumns = (): ITableColumn<ListAppInstance>[] => this.columns;
  getDataSource = () => this.instancesSource;
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => [];
  getInitialised = (): Observable<boolean> => this.initialised$;

  private createMetricsResults(entityServiceFactory: EntityServiceFactory) {
    const metricsAction = createAppInstancesMetricAction(this.appService.appGuid, this.appService.cfGuid);
    return entityServiceFactory.create<IMetrics<IMetricMatrixResult<IMetricApplication>>>(
      metricsAction.guid,
      metricsAction
    );
  }
}

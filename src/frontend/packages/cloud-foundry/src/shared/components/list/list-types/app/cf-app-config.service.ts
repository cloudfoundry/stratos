import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import {
  UtilsService,
  createTableColumnFavorite,
  ITableColumn,
  ITableText,
  IGlobalListAction,
  IListAction,
  IListConfig,
  IListMultiFilterConfig,
  IMultiListAction,
  ListConfig,
  ListViewTypes,
} from '@stratosui/core';
import { APIResource, IFavoriteMetadata, ListView, UserFavorite } from '@stratosui/store';
// eslint-disable-next-line @stratosui/no-relative-imports
import { IApp } from '../../../../../cf-api.types';
// eslint-disable-next-line @stratosui/no-relative-imports
import { CFAppState } from '../../../../../cf-app-state';
// eslint-disable-next-line @stratosui/no-relative-imports
import { applicationEntityType } from '../../../../../cf-entity-types';
import { CfOrgSpaceDataService, createCfOrgSpaceFilterConfig } from '../../../../data-services/cf-org-space-service.service';
import { CardAppComponent } from './card/card-app.component';
import { CfAppsDataSource } from './cf-apps-data-source';
import {
  TableCellAppCfOrgSpaceHeaderComponent,
} from './table-cell-app-cforgspace-header/table-cell-app-cforgspace-header.component';
import { TableCellAppCfOrgSpaceComponent } from './table-cell-app-cforgspace/table-cell-app-cforgspace.component';
import { TableCellAppInstancesComponent } from './table-cell-app-instances/table-cell-app-instances.component';
import { TableCellAppNameComponent } from './table-cell-app-name/table-cell-app-name.component';
import { TableCellAppStatusComponent } from './table-cell-app-status/table-cell-app-status.component';

@Injectable({
  providedIn: 'root'
})
export class CfAppConfigService extends ListConfig<APIResource> implements IListConfig<APIResource> {

  multiFilterConfigs: IListMultiFilterConfig[];
  initialised$: Observable<boolean>;

  constructor(
    private datePipe: DatePipe,
    private store: Store<CFAppState>,
    private utilsService: UtilsService,
    private cfOrgSpaceService: CfOrgSpaceDataService,
  ) {
    super();

    // Apply the initial cf guid to the data source. Normally this is done via applying the selection to the filter... however this is too
    // late for maxedResult world
    this.initialised$ = this.cfOrgSpaceService.isLoading$.pipe(
      filter(isLoading => !isLoading),
      switchMap(() => this.cfOrgSpaceService.cf.list$),
      first(),
      map(cfs => {
        const cfGuid = cfs.length === 1 ? cfs[0].guid : null;
        this.appsDataSource = new CfAppsDataSource(this.store, this, undefined, undefined, undefined, cfGuid);
        this.cfOrgSpaceService.setInitialValuesFromAction(this.appsDataSource.action, 'cf', 'org', 'space');
        return true;
      })
    );

    this.multiFilterConfigs = [
      createCfOrgSpaceFilterConfig('cf', 'Cloud Foundry', this.cfOrgSpaceService.cf),
      createCfOrgSpaceFilterConfig('org', 'Organization', this.cfOrgSpaceService.org),
      createCfOrgSpaceFilterConfig('space', 'Space', this.cfOrgSpaceService.space),
    ];

  }
  appsDataSource!: CfAppsDataSource;
  columns: Array<ITableColumn<APIResource<IApp>>> = [
    {
      columnId: 'name', headerCell: () => 'Name', cellComponent: TableCellAppNameComponent, cellFlex: '2', sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'entity.name'
      }
    },
    {
      columnId: 'status', headerCell: () => 'Status', cellFlex: '2', cellComponent: TableCellAppStatusComponent,
    },
    {
      columnId: 'instances', headerCell: () => 'Instances', cellComponent: TableCellAppInstancesComponent, cellFlex: '1', sort: {
        type: 'sort',
        orderKey: 'instances',
        field: 'entity.instances'
      }
    },
    {
      columnId: 'disk_quota', headerCell: () => 'Disk Quota',
      cellDefinition: {
        getValue: (row: APIResource) => `${this.utilsService.mbToHumanSize(row.entity.disk_quota)}`
      },
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'disk_quota',
        field: 'entity.disk_quota'
      }
    },
    {
      columnId: 'memory', headerCell: () => 'Memory',
      cellDefinition: {
        getValue: (row: APIResource) => `${this.utilsService.mbToHumanSize(row.entity.memory)}`
      },
      cellFlex: '1',
      sort: {
        type: 'sort',
        orderKey: 'memory',
        field: 'entity.memory'
      }
    },
    {
      columnId: 'cfOrgSpace',
      headerCellComponent: TableCellAppCfOrgSpaceHeaderComponent,
      cellComponent: TableCellAppCfOrgSpaceComponent,
    },
    {
      columnId: 'creation', headerCell: () => 'Creation Date',
      cellDefinition: {
        getValue: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'creation',
        field: 'metadata.created_at'
      },
      cellFlex: '2'
    },
    createTableColumnFavorite((row: APIResource<IApp>): UserFavorite<IFavoriteMetadata> => {
      return new UserFavorite(
        row.entity.cfGuid,
        'cf',
        applicationEntityType,
        row.metadata.guid,
      );
    }),
  ];
  viewType = ListViewTypes.BOTH;
  text: ITableText = {
    title: '',
    filter: 'Search by name',
    noEntries: 'There are no applications',
    maxedResults: {
      icon: 'apps',
      canIgnoreMaxFirstLine: 'Fetching all applications might take a long time',
      cannotIgnoreMaxFirstLine: 'There are too many applications to fetch',
      filterLine: 'Please use the Cloud Foundry, Organization or Space filters'
    }
  };
  enableTextFilter = true;
  cardComponent = CardAppComponent;
  defaultView = 'cards' as ListView;

  getGlobalActions = (): IGlobalListAction<APIResource<IApp>>[] | null => null;
  getMultiActions = (): IMultiListAction<APIResource<IApp>>[] | null => null;
  getSingleActions = (): IListAction<APIResource<IApp>>[] | null => null;
  getColumns = (): ITableColumn<APIResource<IApp>>[] => this.columns;
  getDataSource = (): CfAppsDataSource => this.appsDataSource;
  getMultiFiltersConfigs = (): IListMultiFilterConfig[] => this.multiFilterConfigs;
  getInitialised = (): Observable<boolean> => this.initialised$;
}

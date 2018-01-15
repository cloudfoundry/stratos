import { CNSISModel } from '../../store/types/cnsis.types';
import { ITableColumn } from '../components/table/table.types';
import { DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import {
  TableCellAppNameComponent,
} from '../components/table/custom-cells/table-cell-app-name/table-cell-app-name.component';
import { CfAppsDataSource } from '../data-sources/cf-apps-data-source';
import { APIResource } from '../../store/types/api.types';
import { Injectable } from '@angular/core';
import { EntityInfo } from '../../store/types/api.types';
import { IListAction, IListConfig, IListMultiFilterConfig, IMultiListAction } from '../components/list/list.component';
import { AppState } from '../../store/app-state';
import { UtilsService } from '../../core/utils.service';
import { ApplicationStateService } from '../../shared/components/application-state/application-state.service';
import { TableCellAppStatusComponent } from '../components/table/custom-cells/table-cell-app-status/table-cell-app-status.component';
import { CfOrgSpaceDataService } from '../data-services/cf-org-space-service.service';

@Injectable()
export class CfAppConfigService implements IListConfig<APIResource> {

  multiFilterConfigs: IListMultiFilterConfig[];

  constructor(
    private datePipe: DatePipe,
    private store: Store<AppState>,
    private utilsService: UtilsService,
    private appStateService: ApplicationStateService,
    private cfOrgSpaceService: CfOrgSpaceDataService
  ) {
    this.appsDataSource = new CfAppsDataSource(this.store);

    this.multiFilterConfigs = [
      {
        key: 'cf',
        label: 'Cloud Foundry',
        ...this.cfOrgSpaceService.cf,
        list$: this.cfOrgSpaceService.cf.list$.map((cfs: CNSISModel[]) => {
          return cfs.map(cf => ({
            label: cf.name,
            item: cf,
            value: cf.guid
          }));
        }),
      },
      {
        key: 'org',
        label: 'Organisation',
        ...this.cfOrgSpaceService.org,
        list$: this.cfOrgSpaceService.org.list$.map((orgs: any[]) => {
          return orgs.map(org => ({
            label: org.name,
            item: org,
            value: org.guid
          }));
        }),
      },
      {
        key: 'space',
        label: 'Space',
        ...this.cfOrgSpaceService.space,
        list$: this.cfOrgSpaceService.space.list$.map((spaces: CNSISModel[]) => {
          return spaces.map(space => ({
            label: space.name,
            item: space,
            value: space.guid
          }));
        }),
      }
    ];
  }
  appsDataSource: CfAppsDataSource;
  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'name', headerCell: () => 'Application Name', cellComponent: TableCellAppNameComponent, cellFlex: '2', sort: true
    },
    {
      columnId: 'status', headerCell: () => 'Status',
      cellFlex: '1',
      cellComponent: TableCellAppStatusComponent,
    },
    {
      columnId: 'instances', headerCell: () => 'Instances', cell: (row: APIResource) => `${row.entity.instances}`, cellFlex: '1'
    },
    {
      columnId: 'disk', headerCell: () => 'Disk Quota',
      cell: (row: APIResource) => `${this.utilsService.mbToHumanSize(row.entity.disk_quota)}`, cellFlex: '1'
    },
    {
      columnId: 'memory', headerCell: () => 'Memory',
      cell: (row: APIResource) => `${this.utilsService.mbToHumanSize(row.entity.memory)}`, cellFlex: '1'
    },
    {
      columnId: 'creation', headerCell: () => 'Creation Date',
      cell: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`, sort: true,
      cellFlex: '2'
    },
  ];
  pageSizeOptions = [9, 45, 90];

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getColumns = () => this.columns;
  getDataSource = () => this.appsDataSource;
  getMultiFiltersConfigs = () => this.multiFilterConfigs;

}

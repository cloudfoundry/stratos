import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { UtilsService } from '../../../../../core/utils.service';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { CfOrgSpaceDataService, CfOrgSpaceItem } from '../../../../data-services/cf-org-space-service.service';
import { ApplicationStateService } from '../../../application-state/application-state.service';
import { ITableColumn } from '../../list-table/table.types';
import {
  defaultPaginationPageSizeOptionsCards,
  IListConfig,
  IListMultiFilterConfig,
  ListConfig,
  ListViewTypes,
} from '../../list.component.types';
import { CfAppsDataSource } from '../app/cf-apps-data-source';
import { TableCellAppInstancesComponent } from '../app/table-cell-app-instances/table-cell-app-instances.component';
import { TableCellAppNameComponent } from '../app//table-cell-app-name/table-cell-app-name.component';
import { TableCellAppStatusComponent } from '../app//table-cell-app-status/table-cell-app-status.component';
import { createListFilterConfig } from '../../list.helper';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cloud-foundry/cf-page.types';
import { PaginationEntityState } from '../../../../../store/types/pagination.types';
import { CompactAppCardComponent } from './compact-app-card/compact-app-card.component';

@Injectable()
export class CfRecentAppsListConfig extends ListConfig<APIResource> implements IListConfig<APIResource> {

  multiFilterConfigs: IListMultiFilterConfig[];

  constructor(
    private datePipe: DatePipe,
    private store: Store<AppState>,
    private utilsService: UtilsService,
    private appStateService: ApplicationStateService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    super();
    // this.multiFilterConfigs = [
    //   createListFilterConfig('cf', 'Cloud Foundry', this.cfOrgSpaceService.cf),
    //   createListFilterConfig('org', 'Organization', this.cfOrgSpaceService.org),
    //   createListFilterConfig('space', 'Space', this.cfOrgSpaceService.space),
    // ];

    // this.appsDataSource = new CfAppsDataSource(this.store, this);

    console.log('***************************************************************');
    // console.log(this.appsDataSource.paginationKey);
    let paginationKey = 'recentApps_' + this.activeRouteCfOrgSpace.cfGuid;
    paginationKey += this.activeRouteCfOrgSpace.orgGuid ? '_' + this.activeRouteCfOrgSpace.orgGuid : '';
    paginationKey += this.activeRouteCfOrgSpace.spaceGuid ? '_' + this.activeRouteCfOrgSpace.spaceGuid : '';
//    this.appsDataSource.paginationKey =  paginationKey;
    console.log('***************************************************************');

    const cfGuid = this.activeRouteCfOrgSpace.cfGuid;
    const orgGuid = this.activeRouteCfOrgSpace.orgGuid;
    const spaceGuid = this.activeRouteCfOrgSpace.spaceGuid;

    console.log(cfGuid);
    console.log(orgGuid);
    console.log(spaceGuid);

    const transformEntities = [
      (entities: APIResource[], paginationState: PaginationEntityState) => {
        // Filter by cf/org/space
        console.log(this);
        console.log(orgGuid);
        console.log(spaceGuid);
        return entities.filter(e => {
          console.log(e);
          const validCF = !(cfGuid && cfGuid !== e.entity.cfGuid);
          const validOrg = !(orgGuid && orgGuid !== e.entity.space.entity.organization_guid);
          const validSpace = !(spaceGuid && spaceGuid !== e.entity.space_guid);
          return validCF && validOrg && validSpace;
        });
      }
    ];

    this.appsDataSource = new CfAppsDataSource(this.store, this, transformEntities, paginationKey);




  }
  appsDataSource: CfAppsDataSource;
  // columns: Array<ITableColumn<APIResource>> = [
  //   {
  //     columnId: 'app', headerCell: () => 'Application', cellComponent: CompactAppCardComponent, cellFlex: '1',
  //   },
  // ];
  columns: Array<ITableColumn<APIResource>> = [
    {
      columnId: 'name', headerCell: () => 'Application Name', cellComponent: TableCellAppNameComponent, cellFlex: '2', sort: {
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
      columnId: 'disk', headerCell: () => 'Disk Quota',
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
  ];


  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  defaultView = 'table' as ListView;

  getGlobalActions = () => null;
  getMultiActions = () => null;
  getSingleActions = () => null;
  getColumns = () => this.columns;
  getDataSource = () => this.appsDataSource;
  getMultiFiltersConfigs = () => [];

}

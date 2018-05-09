import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { ServicesService } from '../../../../../features/service-catalog/services.service';
import { AppState } from '../../../../../store/app-state';
import { CfServiceInstancesListConfigBase } from '../cf-services/cf-service-instances-list-config.base';
import { ServiceInstancesWallDataSource } from './service-instances-wall-data-source';
import { CfOrgSpaceDataService } from '../../../../data-services/cf-org-space-service.service';
import { createListFilterConfig } from '../../list.helper';
import { IListMultiFilterConfig } from '../../list.component.types';
import { APIResource } from '../../../../../store/types/api.types';
import { PaginationEntityState } from '../../../../../store/types/pagination.types';

@Injectable()
export class ServiceInstancesWallListConfigService
  extends CfServiceInstancesListConfigBase {

  constructor(store: Store<AppState>,
    datePipe: DatePipe,
    private cfOrgSpaceService: CfOrgSpaceDataService
  ) {
    super(store, datePipe);
    this.getColumns = () => this.serviceInstanceColumns;
    const multiFilterConfigs = [
      createListFilterConfig('cf', 'Cloud Foundry', this.cfOrgSpaceService.cf),
      createListFilterConfig('org', 'Organization', this.cfOrgSpaceService.org),
      createListFilterConfig('space', 'Space', this.cfOrgSpaceService.space),
    ];


    const cfOrgSpaceFilter = (entities: APIResource[], paginationState: PaginationEntityState) => {
      // Filter by cf/org/space
      const cfGuid = paginationState.clientPagination.filter.items['cf'];
      const orgGuid = paginationState.clientPagination.filter.items['org'];
      const spaceGuid = paginationState.clientPagination.filter.items['space'];
      return entities.filter(e => {
        const validCF = !(cfGuid && cfGuid !== e.entity.cfGuid);
        const validOrg = !(orgGuid && orgGuid !== e.entity.space.entity.organization_guid);
        const validSpace = !(spaceGuid && spaceGuid !== e.entity.space_guid);
        return validCF && validOrg && validSpace;
      });
    };



    const transformEntities = [{ type: 'filter', field: 'entity.name' }, cfOrgSpaceFilter];

    this.dataSource = new ServiceInstancesWallDataSource(store, transformEntities, this);
    this.getMultiFiltersConfigs = () => multiFilterConfigs;

    this.text = {
      title: null,
      filter: 'Search by name',
      noEntries: 'There are no service instances'
    };
    this.enableTextFilter = true;


  }

  getDataSource = () => this.dataSource;

}

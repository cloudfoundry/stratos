import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { IApp, ISpace } from '../../../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../../../core/entity-service-factory.service';
import { ActiveRouteCfCell } from '../../../../../features/cloud-foundry/cf-page.types';
import { ListView } from '../../../../../store/actions/list.actions';
import { AppState } from '../../../../../store/app-state';
import { APIResource } from '../../../../../store/types/api.types';
import { ITableColumn } from '../../list-table/table.types';
import { ListViewTypes } from '../../list.component.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCellApp, CfCellAppsDataSource } from './cf-cell-apps-source';

@Injectable()
export class CfCellAppsListConfigService extends BaseCfListConfig<CfCellApp> {

  dataSource: CfCellAppsDataSource;
  defaultView = 'table' as ListView;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  text = {
    title: null,
    noEntries: 'There are no applications'
  };

  constructor(store: Store<AppState>, private activeRouteCfCell: ActiveRouteCfCell, entityServiceFactory: EntityServiceFactory) {
    super();
    this.dataSource = new CfCellAppsDataSource(store, activeRouteCfCell.cfGuid, activeRouteCfCell.cellId, this, entityServiceFactory);
  }

  getColumns = (): ITableColumn<CfCellApp>[] => [
    {
      columnId: 'app',
      headerCell: () => 'App Name',
      cellFlex: '1',
      cellDefinition: {
        getAsyncLink: (value: APIResource<IApp>) => `/applications/${value.entity.cfGuid}/${value.metadata.guid}/summary`,
        asyncValue: {
          pathToObs: 'appEntityService',
          pathToValue: 'entity.name'
        }
      },
    },
    {
      columnId: 'appInstance',
      headerCell: () => 'App Instance',
      cellDefinition: {
        valuePath: 'metric.instance_index',
        getLink: (row: CfCellApp) => `/applications/${this.activeRouteCfCell.cfGuid}/${row.appGuid}/instances`
      },
      cellFlex: '1',
    },
    {
      columnId: 'space',
      headerCell: () => 'Space',
      cellFlex: '1',
      cellDefinition: {
        getAsyncLink: (value: APIResource<IApp>) => {
          const spaceEntity = value.entity.space as APIResource<ISpace>;
          const cf = `/cloud-foundry/${value.entity.cfGuid}/`;
          const org = `organizations/${spaceEntity.entity.organization.metadata.guid}`;
          const space = `/spaces/${spaceEntity.metadata.guid}/summary`;
          return cf + org + space;
        },
        asyncValue: {
          pathToObs: 'appEntityService',
          pathToValue: 'entity.space.entity.name'
        }
      },
    },
    {
      columnId: 'org', headerCell: () => 'Organization',
      cellFlex: '1',
      cellDefinition: {
        getAsyncLink: (value: APIResource<IApp>) => {
          const space = value.entity.space as APIResource<ISpace>;
          return `/cloud-foundry/${value.entity.cfGuid}/organizations/${space.entity.organization.metadata.guid}/summary`;
        },
        asyncValue: {
          pathToObs: 'appEntityService',
          pathToValue: 'entity.space.entity.organization.entity.name'
        }
      },
    },
  ]
  getDataSource = () => this.dataSource;
}

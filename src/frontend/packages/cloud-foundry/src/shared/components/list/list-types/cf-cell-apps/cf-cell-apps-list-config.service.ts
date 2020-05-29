import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { ListView } from '../../../../../../../store/src/actions/list.actions';
import { EntityServiceFactory } from '../../../../../../../store/src/entity-service-factory.service';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IApp, ISpace } from '../../../../../cf-api.types';
import { ActiveRouteCfCell } from '../../../../../features/cloud-foundry/cf-page.types';
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

  constructor(store: Store<CFAppState>, private activeRouteCfCell: ActiveRouteCfCell, entityServiceFactory: EntityServiceFactory) {
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
          const spaceEntity = value ? value.entity.space as APIResource<ISpace> : null;
          if (!spaceEntity) {
            return;
          }
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
          const space = value ? value.entity.space as APIResource<ISpace> : null;
          return space ? `/cloud-foundry/${value.entity.cfGuid}/organizations/${space.entity.organization.metadata.guid}/summary` : null;
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

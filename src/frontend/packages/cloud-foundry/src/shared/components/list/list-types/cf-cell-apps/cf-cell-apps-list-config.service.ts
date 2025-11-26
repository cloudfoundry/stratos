import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import type { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import type { ITableColumn } from '@stratosui/core';
import { ListViewTypes } from '@stratosui/core';
import type { ListView } from '../../../../../../../store/src/actions/list.actions';
import type { APIResource, GeneralEntityAppState } from '@stratosui/store';
import type { IApp, ISpace } from '../../../../../cf-api.types';
import { ActiveRouteCfCell } from '../../../../../features/cf/cf-page.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { type CfCellApp, CfCellAppsDataSource } from './cf-cell-apps-source';

@Injectable({
  providedIn: 'root'
})
export class CfCellAppsListConfigService extends BaseCfListConfig<CfCellApp> {
  private store = inject(Store<GeneralEntityAppState>);
  private activeRouteCfCell = inject(ActiveRouteCfCell);

  dataSource: CfCellAppsDataSource;
  defaultView = 'table' as ListView;
  viewType = ListViewTypes.TABLE_ONLY;
  enableTextFilter = false;
  text: { title: string | null; noEntries: string } = {
    title: null as string | null,
    noEntries: 'There are no applications'
  };

  constructor() {
    super();
    this.dataSource = new CfCellAppsDataSource(this.store, this.activeRouteCfCell.cfGuid, this.activeRouteCfCell.cellId, this as BaseCfListConfig<CfCellApp>);
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

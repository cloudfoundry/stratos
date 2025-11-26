import type { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import type { Observable, Subscription } from 'rxjs';

import {
  CurrentUserPermissionsService,
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  type ITableColumn,
  type IListAction,
  ListViewTypes,
} from '@stratosui/core';
import { RouterNav, type APIResource, type GeneralEntityAppState } from '@stratosui/store';
import { DeleteSpaceQuotaDefinition } from '../../../../../actions/quota-definitions.actions';
import type { IQuotaDefinition } from '../../../../../cf-api.types';
import type { CFAppState } from '../../../../../cf-app-state';
import type { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { QUOTA_FROM_LIST } from '../cf-quotas/cf-quotas-list-config.service';
import { TableCellQuotaComponent } from '../cf-quotas/table-cell-quota/table-cell-quota.component';
import { CfOrgSpaceQuotasDataSourceService } from './cf-space-quotas-data-source.service';

@Injectable({
  providedIn: 'root'
})
export class CfSpaceQuotasListConfigService extends BaseCfListConfig<APIResource<IQuotaDefinition>> {
  dataSource!: CfOrgSpaceQuotasDataSourceService;
  deleteSubscription!: Subscription;
  canEdit: Observable<boolean>;
  canDelete: Observable<boolean>;

  constructor(
    private store: Store<GeneralEntityAppState>,
    private datePipe: DatePipe,
    private confirmDialog: ConfirmationDialogService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    super();
    this.dataSource = new CfOrgSpaceQuotasDataSourceService(this.store, activeRouteCfOrgSpace.orgGuid, activeRouteCfOrgSpace.cfGuid, this);
    const { cfGuid, orgGuid } = this.activeRouteCfOrgSpace;
    this.canEdit = this.currentUserPermissionsService.can(CfCurrentUserPermissions.SPACE_QUOTA_EDIT, cfGuid, orgGuid);
    this.canDelete = this.currentUserPermissionsService.can(CfCurrentUserPermissions.SPACE_QUOTA_DELETE, cfGuid, orgGuid);
  }

  enableTextFilter = true;
  text = {
    title: null as string | null,
    filter: 'Search by name',
    noEntries: 'There are no quotas'
  };
  columns: ITableColumn<APIResource<IQuotaDefinition>>[] = [
    {
      columnId: 'name',
      headerCell: () => 'Name',
      cellComponent: TableCellQuotaComponent,
      cellConfig: {
        baseUrl: [
          '/cloud-foundry',
          this.activeRouteCfOrgSpace.cfGuid,
          'organizations',
          this.activeRouteCfOrgSpace.orgGuid,
          'space-quota-definitions'
        ]
      },
      sort: {
        type: 'sort',
        orderKey: 'name',
        field: 'entity.name'
      }
    },
    {
      columnId: 'createdAt',
      headerCell: () => 'Creation',
      cellDefinition: {
        getValue: (row: APIResource<IQuotaDefinition>) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'createdAt',
        field: 'metadata.created_at'
      },
    }
  ];

  private listActionDelete: IListAction<APIResource<IQuotaDefinition>> = {
    action: (item: APIResource<IQuotaDefinition>) => this.deleteSingleQuota(item),
    label: 'Delete',
    description: 'Delete space quota',
    createVisible: () => this.canDelete
  };

  private listActionEdit: IListAction<APIResource<IQuotaDefinition>> = {
    action: (item: APIResource<IQuotaDefinition>) => this.editSingleQuota(item),
    label: 'Edit',
    description: 'Edit space quota',
    createVisible: () => this.canEdit
  };

  viewType = ListViewTypes.TABLE_ONLY;
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource as any;
  getSingleActions = () => [this.listActionEdit, this.listActionDelete];

  editSingleQuota = (item: APIResource<IQuotaDefinition>) => {
    this.store.dispatch(
      new RouterNav({
        path: [
          '/cloud-foundry',
          this.activeRouteCfOrgSpace.cfGuid,
          'organizations',
          this.activeRouteCfOrgSpace.orgGuid,
          'space-quota-definitions',
          item.metadata.guid,
          'edit-space-quota'
        ],
        query: {
          [QUOTA_FROM_LIST]: true
        }
      })
    );
  }

  deleteSingleQuota(item: APIResource<IQuotaDefinition>) {
    const quotaGuid = item.metadata.guid;
    const confirmation = new ConfirmationDialogConfig(
      'Delete Space Quota',
      { textToMatch: item.entity.name },
      'Delete',
      true,
    );

    this.confirmDialog.open(confirmation, () => {
      this.store.dispatch(new DeleteSpaceQuotaDefinition(quotaGuid, this.activeRouteCfOrgSpace.cfGuid));
    });
  }
}

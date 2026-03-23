import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import {
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  IListAction,
  ITableColumn,
  ListViewTypes
} from '@stratosui/core';
import { APIResource, RouterNav } from '@stratosui/store';
import { DeleteQuotaDefinition } from '../../../../../actions/quota-definitions.actions';
import { CFAppState } from '../../../../../cf-app-state';
import { IQuotaDefinition } from '../../../../../cf-api.types';
import { ActiveRouteCfOrgSpace } from '../../../../../features/cf/cf-page.types';
import { BaseCfListConfig } from '../base-cf/base-cf-list-config';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfQuotasDataSourceService } from './cf-quotas-data-source.service';
import { TableCellQuotaComponent } from './table-cell-quota/table-cell-quota.component';

export const QUOTA_FROM_LIST = 'list';

@Injectable({
  providedIn: 'root'
})
export class CfQuotasListConfigService extends BaseCfListConfig<APIResource<IQuotaDefinition>> {
  dataSource: CfQuotasDataSourceService;
  deleteSubscription!: Subscription;
  canEdit: Observable<boolean>;
  canDelete: Observable<boolean>;

  constructor(
    private store: Store<CFAppState>,
    private datePipe: DatePipe,
    private confirmDialog: ConfirmationDialogService,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    super();
    this.dataSource = new CfQuotasDataSourceService(this.store, activeRouteCfOrgSpace.cfGuid, this);
    this.canEdit = this.currentUserPermissionsService.can(CfCurrentUserPermissions.QUOTA_EDIT, this.activeRouteCfOrgSpace.cfGuid);
    this.canDelete = this.currentUserPermissionsService.can(CfCurrentUserPermissions.QUOTA_DELETE, this.activeRouteCfOrgSpace.cfGuid);
  }


  enableTextFilter = true;
  text = {
    title: null as string | null,
    filter: 'Filter by Name',
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
          'quota-definitions',
        ]
      },
      sort: {
        type: 'natural-sort',
        orderKey: 'name',
        field: 'entity.name'
      }
    },
    {
      columnId: 'createdAt',
      headerCell: () => 'Creation',
      cellDefinition: {
        getValue: (row: APIResource) => `${this.datePipe.transform(row.metadata.created_at, 'medium')}`
      },
      sort: {
        type: 'sort',
        orderKey: 'createdAt',
        field: 'metadata.created_at'
      },
    }
  ];

  private listActionDelete: IListAction<APIResource<IQuotaDefinition>> = {
    action: (item: APIResource) => this.deleteSingleQuota(item),
    label: 'Delete',
    description: 'Delete quota',
    createVisible: () => this.canDelete
  };

  private listActionEdit: IListAction<APIResource<IQuotaDefinition>> = {
    action: (item: APIResource) => this.editSingleQuota(item),
    label: 'Edit',
    description: 'Edit quota',
    createVisible: () => this.canEdit
  };

  viewType = ListViewTypes.TABLE_ONLY;
  getColumns = () => this.columns;
  getDataSource = () => this.dataSource;
  getSingleActions = () => [this.listActionEdit, this.listActionDelete];

  editSingleQuota = (item: APIResource<IQuotaDefinition>): void => {
    this.store.dispatch(
      new RouterNav({
        path: [
          '/cloud-foundry',
          this.activeRouteCfOrgSpace.cfGuid,
          'quota-definitions',
          item.metadata.guid,
          'edit-quota'
        ],
        query: {
          [QUOTA_FROM_LIST]: true
        }
      })
    );
  }

  deleteSingleQuota(item: APIResource<IQuotaDefinition>): void {
    const quotaGuid = item.metadata.guid;
    const confirmation = new ConfirmationDialogConfig(
      'Delete Quota',
      { textToMatch: item.entity.name },
      'Delete',
      true,
    );

    this.confirmDialog.open(confirmation, () => {
      this.store.dispatch(new DeleteQuotaDefinition(quotaGuid, this.activeRouteCfOrgSpace.cfGuid));
    });
  }
}

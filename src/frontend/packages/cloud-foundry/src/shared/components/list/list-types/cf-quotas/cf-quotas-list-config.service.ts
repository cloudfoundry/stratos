import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { DeleteQuotaDefinition } from '../../../../../../../cloud-foundry/src/actions/quota-definitions.actions';
import { CFAppState } from '../../../../../../../cloud-foundry/src/cf-app-state';
import { ActiveRouteCfOrgSpace } from '../../../../../../../cloud-foundry/src/features/cloud-foundry/cf-page.types';
import {
  BaseCfListConfig,
} from '../../../../../../../cloud-foundry/src/shared/components/list/list-types/base-cf/base-cf-list-config';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { ConfirmationDialogConfig } from '../../../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../../../core/src/shared/components/confirmation-dialog.service';
import { ITableColumn } from '../../../../../../../core/src/shared/components/list/list-table/table.types';
import { IListAction, ListViewTypes } from '../../../../../../../core/src/shared/components/list/list.component.types';
import { RouterNav } from '../../../../../../../store/src/actions/router.actions';
import { APIResource } from '../../../../../../../store/src/types/api.types';
import { IQuotaDefinition } from '../../../../../cf-api.types';
import { CfCurrentUserPermissions } from '../../../../../user-permissions/cf-user-permissions-checkers';
import { CfQuotasDataSourceService } from './cf-quotas-data-source.service';
import { TableCellQuotaComponent } from './table-cell-quota/table-cell-quota.component';

export const QUOTA_FROM_LIST = 'list';

@Injectable()
export class CfQuotasListConfigService extends BaseCfListConfig<APIResource<IQuotaDefinition>> {
  dataSource: CfQuotasDataSourceService;
  deleteSubscription: Subscription;
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
    title: null,
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
          'quota-definitions',
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

  editSingleQuota = (item: APIResource<IQuotaDefinition>) => {
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

  deleteSingleQuota(item: APIResource<IQuotaDefinition>) {
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

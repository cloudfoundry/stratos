import { Component, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { DeleteQuotaDefinition } from '../../../../../../../../store/src/actions/quota-definitions.actions';
import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../../../../store/src/app-state';
import { entityFactory, quotaDefinitionSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { IQuotaDefinition } from '../../../../../../core/cf-api.types';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import { safeUnsubscribe } from '../../../../../../core/utils.service';
import {
  CloudFoundryEndpointService,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { EntityMonitorFactory } from '../../../../../monitors/entity-monitor.factory.service';
import { ComponentEntityMonitorConfig, StratosStatus } from '../../../../../shared.types';
import { ConfirmationDialogConfig } from '../../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';


@Component({
  selector: 'app-cf-quota-card',
  templateUrl: './cf-quota-card.component.html',
  styleUrls: ['./cf-quota-card.component.scss']
})
export class CfQuotaCardComponent extends CardCell<APIResource<IQuotaDefinition>> implements OnDestroy {
  cardMenu: MetaCardMenuItem[];
  deleteSubscription: Subscription;
  public entityConfig: ComponentEntityMonitorConfig;
  public favorite: UserFavorite<IFavoriteMetadata>;
  public orgStatus$: Observable<StratosStatus>;

  constructor(
    public cfEndpointService: CloudFoundryEndpointService,
    private store: Store<AppState>,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private confirmDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar,
    private entityMonitorFactory: EntityMonitorFactory
  ) {
    super();

    this.cardMenu = [
      {
        label: 'Edit',
        action: this.edit,
        can: this.currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_EDIT, this.cfEndpointService.cfGuid)
      },
      {
        label: 'Delete',
        action: this.delete,
        can: this.currentUserPermissionsService.can(CurrentUserPermissions.ORGANIZATION_DELETE, this.cfEndpointService.cfGuid)
      }
    ];
  }

  edit = () => {
    this.store.dispatch(
      new RouterNav({
        path: [
          'cloud-foundry',
          this.cfEndpointService.cfGuid,
          'quota-definitions',
          this.row.metadata.guid,
          'edit-quota'
        ]
      })
    );
  }

  delete = () => {
    const quotaGuid = this.row.metadata.guid;
    const confirmation = new ConfirmationDialogConfig(
      'Delete Quota',
      {
        textToMatch: this.row.entity.name
      },
      'Delete',
      true,
    );

    this.confirmDialog.open(confirmation, () => {
      this.store.dispatch(new DeleteQuotaDefinition(quotaGuid, this.cfEndpointService.cfGuid));
      this.deleteSubscription = this.entityMonitorFactory.create<APIResource<IQuotaDefinition>>(
        quotaGuid,
        quotaDefinitionSchemaKey,
        entityFactory(quotaDefinitionSchemaKey)
      ).entityRequest$.pipe(
        filter(r => !!r && !r.deleting.busy),
      ).subscribe(requestInfo => {
        if (requestInfo.deleting.error) {
          const errorMsg = `Failed to delete quota : ${requestInfo.message}`;
          this.snackBar.open(errorMsg, 'Dismiss');
        }
      });
    });
  }

  goToDetails = () => {
    this.store.dispatch(new RouterNav({
      path: [
        'cloud-foundry',
        this.cfEndpointService.cfGuid,
        'quota-definitions',
        this.row.metadata.guid
      ]
    }));
  }

  ngOnDestroy() {
    safeUnsubscribe(this.deleteSubscription);
  }
}

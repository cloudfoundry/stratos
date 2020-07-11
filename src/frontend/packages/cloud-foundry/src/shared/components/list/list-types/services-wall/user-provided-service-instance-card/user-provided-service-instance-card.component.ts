import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of as observableOf } from 'rxjs';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { userProvidedServiceInstanceEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { MenuItem } from '../../../../../../../../store/src/types/menu-item.types';
import { ComponentEntityMonitorConfig } from '../../../../../../../../store/src/types/shared.types';
import { IUserProvidedServiceInstance } from '../../../../../../cf-api-svc.types';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { CSI_CANCEL_URL } from '../../../../add-service-instance/csi-mode.service';


@Component({
  selector: 'app-user-provided-service-instance-card',
  templateUrl: './user-provided-service-instance-card.component.html',
  styleUrls: ['./user-provided-service-instance-card.component.scss'],
})
export class UserProvidedServiceInstanceCardComponent extends CardCell<APIResource<IUserProvidedServiceInstance>> {
  serviceInstanceEntity: APIResource<IUserProvidedServiceInstance>;
  cfGuid: string;
  cardMenu: MenuItem[];

  serviceInstanceTags: AppChip[];
  hasMultipleBindings = new BehaviorSubject(true);
  entityConfig: ComponentEntityMonitorConfig;

  cfOrgSpace: CfOrgSpaceLabelService;

  @Input('row')
  set row(row: APIResource<IUserProvidedServiceInstance>) {
    if (row) {
      this.setup(row);
    }
  }

  private setup(row: APIResource<IUserProvidedServiceInstance>) {
    this.serviceInstanceEntity = row;
    const schema = cfEntityFactory(userProvidedServiceInstanceEntityType);
    this.entityConfig = new ComponentEntityMonitorConfig(row.metadata.guid, schema);
    this.serviceInstanceTags = (row.entity.tags || []).map(t => ({
      value: t
    }));
    this.cfGuid = row.entity.cfGuid;
    this.hasMultipleBindings.next(!(row.entity.service_bindings && row.entity.service_bindings.length > 0));
    this.cardMenu = [
      {
        label: 'Edit',
        action: this.edit,
        can: this.currentUserPermissionsService.can(
          CfCurrentUserPermissions.SERVICE_INSTANCE_EDIT,
          this.serviceInstanceEntity.entity.cfGuid,
          this.serviceInstanceEntity.entity.space_guid
        )
      },
      {
        label: 'Unbind',
        action: this.detach,
        disabled: observableOf(this.serviceInstanceEntity.entity.service_bindings.length === 0),
        can: this.currentUserPermissionsService.can(
          CfCurrentUserPermissions.SERVICE_INSTANCE_EDIT,
          this.serviceInstanceEntity.entity.cfGuid,
          this.serviceInstanceEntity.entity.space_guid
        )
      },
      {
        label: 'Delete',
        action: this.delete,
        can: this.currentUserPermissionsService.can(
          CfCurrentUserPermissions.SERVICE_INSTANCE_DELETE,
          this.serviceInstanceEntity.entity.cfGuid,
          this.serviceInstanceEntity.entity.space_guid
        )
      }
    ];
    if (!this.cfOrgSpace) {
      this.cfOrgSpace = new CfOrgSpaceLabelService(
        this.store,
        this.cfGuid,
        row.entity.space.entity.organization_guid,
        row.entity.space_guid);
    }
  }

  constructor(
    private store: Store<CFAppState>,
    private serviceActionHelperService: ServiceActionHelperService,
    private currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    super();
  }

  private detach = () => {
    this.serviceActionHelperService.detachServiceBinding(
      this.serviceInstanceEntity.entity.service_bindings,
      this.serviceInstanceEntity.metadata.guid,
      this.serviceInstanceEntity.entity.cfGuid,
      false,
      true
    );
  }

  private delete = () => this.serviceActionHelperService.deleteServiceInstance(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.name,
    this.serviceInstanceEntity.entity.cfGuid,
    true
  )

  private edit = () => this.serviceActionHelperService.startEditServiceBindingStepper(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.cfGuid,
    {
      [CSI_CANCEL_URL]: '/services'
    },
    true
  )

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });

}

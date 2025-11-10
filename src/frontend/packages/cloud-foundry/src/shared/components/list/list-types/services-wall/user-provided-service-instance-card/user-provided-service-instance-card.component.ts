import { Component, Input , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of as observableOf } from 'rxjs';

import {
  CFAppState,
  userProvidedServiceInstanceEntityType,
  IUserProvidedServiceInstance,
  cfEntityFactory,
  CfCurrentUserPermissions,
  ServiceActionHelperService,
  CfOrgSpaceLabelService,
  CfOrgSpaceLinksComponent,
  CSI_CANCEL_URL,
} from '@stratosui/cloud-foundry';
import {
  CurrentUserPermissionsService,
  AppChip,
  AppChipsComponent,
  CardCell,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent,
} from '@stratosui/core';
import { APIResource, MenuItem, ComponentEntityMonitorConfig } from '@stratosui/store';


@Component({
selector: 'app-user-provided-service-instance-card',
  templateUrl: './user-provided-service-instance-card.component.html',
  styleUrls: ['./user-provided-service-instance-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    CfOrgSpaceLinksComponent,
    AppChipsComponent,
  ]
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
    super.row = row;
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
  };

  private delete = () => this.serviceActionHelperService.deleteServiceInstance(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.name,
    this.serviceInstanceEntity.entity.cfGuid,
    true
  );

  private edit = () => this.serviceActionHelperService.startEditServiceBindingStepper(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.cfGuid,
    {
      [CSI_CANCEL_URL]: '/services'
    },
    true
  );

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });

}

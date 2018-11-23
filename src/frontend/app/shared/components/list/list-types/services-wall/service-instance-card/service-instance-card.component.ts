import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, of as observableOf } from 'rxjs';

import { IServiceExtra, IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import { entityFactory, serviceInstancesSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { APIResource } from '../../../../../../store/types/api.types';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { AppChip } from '../../../../chips/chips.component';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell } from '../../../list.types';

@Component({
  selector: 'app-service-instance-card',
  templateUrl: './service-instance-card.component.html',
  styleUrls: ['./service-instance-card.component.scss'],
})
export class ServiceInstanceCardComponent extends CardCell<APIResource<IServiceInstance>> {
  serviceInstanceEntity: APIResource<IServiceInstance>;
  cfGuid: string;
  cardMenu: MetaCardMenuItem[];

  serviceInstanceTags: AppChip[];
  hasMultipleBindings = new BehaviorSubject(true);
  entityConfig: ComponentEntityMonitorConfig;

  @Input('row')
  set row(row: APIResource<IServiceInstance>) {
    if (row) {
      this.entityConfig = new ComponentEntityMonitorConfig(row.metadata.guid, entityFactory(serviceInstancesSchemaKey));
      this.serviceInstanceEntity = row;
      this.serviceInstanceTags = row.entity.tags.map(t => ({
        value: t
      }));
      this.cfGuid = row.entity.cfGuid;
      this.hasMultipleBindings.next(!(row.entity.service_bindings.length > 0));
      this.cardMenu = [
        {
          label: 'Edit',
          action: this.edit,
          can: this.currentUserPermissionsService.can(
            CurrentUserPermissions.SERVICE_INSTANCE_EDIT,
            this.serviceInstanceEntity.entity.cfGuid,
            this.serviceInstanceEntity.entity.space_guid
          )
        },
        {
          label: 'Unbind',
          action: this.detach,
          disabled: observableOf(this.serviceInstanceEntity.entity.service_bindings.length === 0),
          can: this.currentUserPermissionsService.can(
            CurrentUserPermissions.SERVICE_INSTANCE_EDIT,
            this.serviceInstanceEntity.entity.cfGuid,
            this.serviceInstanceEntity.entity.space_guid
          )
        },
        {
          label: 'Delete',
          action: this.delete,
          can: this.currentUserPermissionsService.can(
            CurrentUserPermissions.SERVICE_INSTANCE_DELETE,
            this.serviceInstanceEntity.entity.cfGuid,
            this.serviceInstanceEntity.entity.space_guid
          )
        }
      ];
    }
  }

  constructor(
    private serviceActionHelperService: ServiceActionHelperService,
    private currentUserPermissionsService: CurrentUserPermissionsService
  ) {
    super();
  }

  detach = () => {
    this.serviceActionHelperService.detachServiceBinding
      (this.serviceInstanceEntity.entity.service_bindings,
      this.serviceInstanceEntity.metadata.guid,
      this.serviceInstanceEntity.entity.cfGuid);
  }

  delete = () => this.serviceActionHelperService.deleteServiceInstance(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.name,
    this.serviceInstanceEntity.entity.cfGuid
  )

  edit = () => this.serviceActionHelperService.editServiceBinding(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.cfGuid
  )

  getServiceName = () => {
    const serviceEntity = this.serviceInstanceEntity.entity.service;
    let extraInfo: IServiceExtra = null;
    try {
      extraInfo = serviceEntity.entity.extra ? JSON.parse(serviceEntity.entity.extra) : null;
    } catch (e) { }
    let displayName = serviceEntity.entity ? serviceEntity.entity.label : '';
    if (extraInfo && extraInfo.displayName) {
      displayName = extraInfo.displayName;
    }
    return displayName;
  }

  getSpaceName = () => this.serviceInstanceEntity.entity.space.entity.name;
  getSpaceURL = () => [
    '/cloud-foundry',
    this.serviceInstanceEntity.entity.cfGuid,
    'organizations',
    this.serviceInstanceEntity.entity.space.entity.organization_guid,
    'spaces',
    this.serviceInstanceEntity.entity.space_guid,
    'summary'
  ]
  getSpaceBreadcrumbs = () => ({ 'breadcrumbs': 'services-wall' });

}

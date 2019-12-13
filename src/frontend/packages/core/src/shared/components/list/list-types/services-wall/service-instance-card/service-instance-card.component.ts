import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { filter, first, map } from 'rxjs/operators';

import { GetServiceBroker } from '../../../../../../../../store/src/actions/service-broker.actions';
import { AppState } from '../../../../../../../../store/src/app-state';
import {
  entityFactory,
  serviceBrokerSchemaKey,
  serviceInstancesSchemaKey,
} from '../../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IServiceBroker, IServiceExtra, IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
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

  @Input('row')
  set row(row: APIResource<IServiceInstance>) {

    if (row) {
      this.serviceInstanceEntity = row;
      const schema = entityFactory(serviceInstancesSchemaKey);
      this.entityConfig = new ComponentEntityMonitorConfig(row.metadata.guid, schema);
      this.serviceInstanceTags = row.entity.tags.map(t => ({
        value: t
      }));
      this.cfGuid = row.entity.cfGuid;
      this.hasMultipleBindings.next(!(row.entity.service_bindings && row.entity.service_bindings.length > 0));
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
      if (!this.cfOrgSpace) {
        this.cfOrgSpace = new CfOrgSpaceLabelService(
          this.store,
          this.cfGuid,
          row.entity.space.entity.organization_guid,
          row.entity.space_guid);
      }

      if (!this.serviceBroker$) {
        const brokerGuid = this.serviceInstanceEntity.entity.service.entity.service_broker_guid;
        this.serviceBroker$ = this.entityServiceFactory.create<APIResource<IServiceBroker>>(
          serviceBrokerSchemaKey,
          entityFactory(serviceBrokerSchemaKey),
          brokerGuid,
          new GetServiceBroker(
            brokerGuid,
            this.serviceInstanceEntity.entity.cfGuid
          )
        ).waitForEntity$.pipe(
          map(a => a.entity),
          filter(res => !!res),
          first()
        );
      }
    }
  }

  constructor(
    private store: Store<AppState>,
    private serviceActionHelperService: ServiceActionHelperService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
    private entityServiceFactory: EntityServiceFactory
  ) {
    super();
  }

  static done = false;
  serviceInstanceEntity: APIResource<IServiceInstance>;
  cfGuid: string;
  cardMenu: MetaCardMenuItem[];

  serviceInstanceTags: AppChip[];
  hasMultipleBindings = new BehaviorSubject(true);
  entityConfig: ComponentEntityMonitorConfig;

  cfOrgSpace: CfOrgSpaceLabelService;
  serviceBroker$: Observable<APIResource<IServiceBroker>>;

  detach = () => {
    this.serviceActionHelperService.detachServiceBinding(
      this.serviceInstanceEntity.entity.service_bindings,
      this.serviceInstanceEntity.metadata.guid,
      this.serviceInstanceEntity.entity.cfGuid,
      false
    );
  }

  delete = () => this.serviceActionHelperService.deleteServiceInstance(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.name,
    this.serviceInstanceEntity.entity.cfGuid
  )

  edit = () => this.serviceActionHelperService.editServiceBinding(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.cfGuid,
    null
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

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });

  getServiceUrl = () =>
    `/marketplace/${this.serviceInstanceEntity.entity.cfGuid}/${this.serviceInstanceEntity.entity.service.entity.guid}/summary`

}

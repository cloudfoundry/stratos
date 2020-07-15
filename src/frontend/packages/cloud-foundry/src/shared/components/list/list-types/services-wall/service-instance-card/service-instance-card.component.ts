import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { serviceInstancesEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import {
  CurrentUserPermissionsService,
} from '../../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { MenuItem } from '../../../../../../../../store/src/types/menu-item.types';
import { ComponentEntityMonitorConfig } from '../../../../../../../../store/src/types/shared.types';
import { IService, IServiceInstance } from '../../../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import {
  getServiceBrokerName,
  getServiceName,
  getServicePlanName,
  getServiceSummaryUrl,
} from '../../../../../../features/service-catalog/services-helper';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { CSI_CANCEL_URL } from '../../../../add-service-instance/csi-mode.service';

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
      const schema = cfEntityFactory(serviceInstancesEntityType);
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

      if (!this.service$) {
        this.service$ = cfEntityCatalog.service.store.getEntityService(
          this.serviceInstanceEntity.entity.service_guid,
          this.serviceInstanceEntity.entity.cfGuid,
          {
            includeRelations: []
          }
        ).waitForEntity$.pipe(
          filter(s => !!s),
          map(s => s.entity)
        );
      }

      if (!this.serviceBrokerName$) {
        // Note, here we just need the service's service broker. This should be available by
        // `this.serviceInstanceEntity.entity.service_plan.entity.service.entity.service_broker_guid` however can be empty (see #4397).
        // So fetch the service separately, as per the table way (this shouldn't start a http request if it's already in the store) 
        this.serviceBrokerName$ = this.service$.pipe(
          switchMap(service => getServiceBrokerName(service.entity.service_broker_guid, service.entity.cfGuid))
        )
      }

      if (!this.serviceName$) {
        // See note for this.serviceBrokerName$
        this.serviceName$ = this.service$.pipe(
          map(getServiceName)
        )
      }

      this.servicePlanName = this.serviceInstanceEntity.entity.service_plan ?
        getServicePlanName(this.serviceInstanceEntity.entity.service_plan.entity)
        : null;

      this.serviceUrl = getServiceSummaryUrl(
        this.serviceInstanceEntity.entity.cfGuid,
        this.serviceInstanceEntity.entity.service_guid
      );
    }
  }

  constructor(
    private store: Store<CFAppState>,
    private serviceActionHelperService: ServiceActionHelperService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    super();
  }

  static done = false;
  serviceInstanceEntity: APIResource<IServiceInstance>;
  cfGuid: string;
  cardMenu: MenuItem[];

  serviceInstanceTags: AppChip[];
  hasMultipleBindings = new BehaviorSubject(true);
  entityConfig: ComponentEntityMonitorConfig;

  cfOrgSpace: CfOrgSpaceLabelService;
  serviceBrokerName$: Observable<string>;
  serviceName$: Observable<string>;
  servicePlanName: string;
  serviceUrl: string;

  private service$: Observable<APIResource<IService>>;

  private detach = () => {
    this.serviceActionHelperService.detachServiceBinding(
      this.serviceInstanceEntity.entity.service_bindings,
      this.serviceInstanceEntity.metadata.guid,
      this.serviceInstanceEntity.entity.cfGuid,
      false
    );
  }

  private delete = () => this.serviceActionHelperService.deleteServiceInstance(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.name,
    this.serviceInstanceEntity.entity.cfGuid
  )

  private edit = () => this.serviceActionHelperService.startEditServiceBindingStepper(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.cfGuid,
    {
      [CSI_CANCEL_URL]: '/services'
    }
  )

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });

}

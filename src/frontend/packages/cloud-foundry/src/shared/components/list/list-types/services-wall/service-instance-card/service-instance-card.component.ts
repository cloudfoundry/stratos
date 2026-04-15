import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import {
  CFAppState,
  serviceInstancesEntityType,
  IService,
  IServiceInstance,
  cfEntityCatalog,
  cfEntityFactory,
  CfCurrentUserPermissions,
  ServiceActionHelperService,
  CfOrgSpaceLabelService,
  CSI_CANCEL_URL,
  CfOrgSpaceLinksComponent,
} from '@stratosui/cloud-foundry';
import { getServiceName, getServicePlanName, getServiceSummaryUrl } from '../../../../../../features/service-catalog/services-helper';
import { ServiceInstanceLastOpComponent } from '../../../../service-instance-last-op/service-instance-last-op.component';
import {
  ServiceInstanceLastServiceBindingComponent,
} from '../../../../service-instance-last-service-binding/service-instance-last-service-binding.component';
import {
  CurrentUserPermissionsService,
  ClickStopPropagationDirective,
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
import {
  TableCellServiceBrokerComponent,
  TableCellServiceBrokerComponentConfig,
  TableCellServiceBrokerComponentMode,
} from '../../cf-services/table-cell-service-broker/table-cell-service-broker.component';

@Component({
  selector: 'app-service-instance-card',
  templateUrl: './service-instance-card.component.html',
  styleUrls: ['./service-instance-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    CfOrgSpaceLinksComponent,
    TableCellServiceBrokerComponent,
    ServiceInstanceLastOpComponent,
    ServiceInstanceLastServiceBindingComponent,
    AppChipsComponent,
    ClickStopPropagationDirective,
  ]
})
export class ServiceInstanceCardComponent extends CardCell<APIResource<IServiceInstance>> {
  private store = inject<Store<CFAppState>>(Store);
  private serviceActionHelperService = inject(ServiceActionHelperService);
  private currentUserPermissionsService = inject(CurrentUserPermissionsService);


  @Input()
  set row(row: APIResource<IServiceInstance>) {
    super.row = row;
    if (row && row.entity && row.metadata) {
      this.serviceInstanceEntity = row;
      const schema = cfEntityFactory(serviceInstancesEntityType);
      this.entityConfig = new ComponentEntityMonitorConfig(row.metadata.guid, schema);
      this.serviceInstanceTags = row.entity.tags ? row.entity.tags.map(t => ({
        value: t
      })) : [];
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
          disabled: observableOf(!this.serviceInstanceEntity.entity.service_bindings || this.serviceInstanceEntity.entity.service_bindings.length === 0),
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
      if (!this.cfOrgSpace && row.entity.space && row.entity.space.entity) {
        this.cfOrgSpace = new CfOrgSpaceLabelService(
          this.store,
          this.cfGuid,
          row.entity.space.entity.organization_guid,
          row.entity.space_guid);
      }

      if (!this.service$ && this.serviceInstanceEntity.entity.service_guid) {
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

      if (!this.serviceName$ && this.service$) {
        // See note for this.serviceBrokerName$
        this.serviceName$ = this.service$.pipe(
          map(getServiceName)
        );
      }

      this.servicePlanName = this.serviceInstanceEntity.entity.service_plan && this.serviceInstanceEntity.entity.service_plan.entity ?
        getServicePlanName(this.serviceInstanceEntity.entity.service_plan.entity)
        : null;

      if (this.serviceInstanceEntity.entity.cfGuid && this.serviceInstanceEntity.entity.service_guid) {
        this.serviceUrl = getServiceSummaryUrl(
          this.serviceInstanceEntity.entity.cfGuid,
          this.serviceInstanceEntity.entity.service_guid
        );
      }
    }
  }

  static done = false;
  serviceInstanceEntity: APIResource<IServiceInstance>;
  cfGuid: string;
  cardMenu: MenuItem[];

  serviceInstanceTags: AppChip[];
  hasMultipleBindings = new BehaviorSubject(true);
  entityConfig: ComponentEntityMonitorConfig;

  cfOrgSpace: CfOrgSpaceLabelService;
  serviceName$: Observable<string>;
  servicePlanName: string;
  serviceUrl: string;

  service$: Observable<APIResource<IService>>;

  brokerNameConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.NAME
  };
  brokerScopeConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.SCOPE,
    altScope: true
  };

  private detach = () => {
    this.serviceActionHelperService.detachServiceBinding(
      this.serviceInstanceEntity.entity.service_bindings,
      this.serviceInstanceEntity.metadata.guid,
      this.serviceInstanceEntity.entity.cfGuid,
      false
    );
  };

  private delete = () => this.serviceActionHelperService.deleteServiceInstance(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.name,
    this.serviceInstanceEntity.entity.cfGuid
  );

  private edit = () => this.serviceActionHelperService.startEditServiceBindingStepper(
    this.serviceInstanceEntity.metadata.guid,
    this.serviceInstanceEntity.entity.cfGuid,
    {
      [CSI_CANCEL_URL]: '/services'
    }
  );

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });

}

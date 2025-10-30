import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TailwindDialogService } from '@stratosui/core';
import { combineLatest as observableCombineLatest, Observable, of } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
} from '../../../../../../../../core/src/core/permissions/current-user-permissions.service';
import { AppChip, AppChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { CardCell, IListRowCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { MetaCardComponent } from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardValueComponent } from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { MetaCardTitleComponent } from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import { ActionState } from '../../../../../../../../store/src/reducers/api-request-reducer/types';
import { APIResource, EntityInfo } from '../../../../../../../../store/src/types/api.types';
import { MenuItem } from '../../../../../../../../store/src/types/menu-item.types';
import { ComponentEntityMonitorConfig } from '../../../../../../../../store/src/types/shared.types';
import {
  IService,
  IServiceBinding,
  IServiceInstance,
  IUserProvidedServiceInstance,
} from '../../../../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../../../../cf-entity-catalog';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { serviceBindingEntityType } from '../../../../../../cf-entity-types';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { isUserProvidedServiceInstance } from '../../../../../../features/cf/cf.helpers';
import {
  getServiceName,
  getServicePlanName,
  getServiceSummaryUrl,
} from '../../../../../../features/service-catalog/services-helper';
import { AppEnvVarsState } from '../../../../../../store/types/app-metadata.types';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { ServiceIconComponent } from '../../../../service-icon/service-icon.component';
import { CSI_CANCEL_URL } from '../../../../add-service-instance/csi-mode.service';
import { EnvVarViewComponent } from '../../../../env-var-view/env-var-view.component';
import {
  TableCellServiceBrokerComponent,
  TableCellServiceBrokerComponentConfig,
  TableCellServiceBrokerComponentMode,
} from '../../cf-services/table-cell-service-broker/table-cell-service-broker.component';


interface EnvVarData {
  key: string;
  value: string;
}
@Component({
  selector: 'app-app-service-binding-card',
  templateUrl: './app-service-binding-card.component.html',
  styleUrls: ['./app-service-binding-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    ServiceIconComponent,
    AppChipsComponent,
    TableCellServiceBrokerComponent
  ]
})
export class AppServiceBindingCardComponent extends CardCell<APIResource<IServiceBinding>> implements OnInit, IListRowCell {

  envVarsAvailable$: Observable<EnvVarData>;
  listData: {
    label: string;
    data$: Observable<string>;
    customStyle?: string;
  }[];
  cardMenu: MenuItem[];
  service$: Observable<APIResource<IService> | null>;
  serviceInstance$: Observable<EntityInfo<APIResource<IServiceInstance | IUserProvidedServiceInstance>>>;
  tags$: Observable<AppChip<IServiceInstance | IUserProvidedServiceInstance>[]>;
  entityConfig: ComponentEntityMonitorConfig;
  private envVarServicesSection$: Observable<string>;
  isUserProvidedServiceInstance: boolean;
  serviceDescription$: Observable<string>;
  serviceUrl$: Observable<string>;
  serviceName$: Observable<string>;

  brokerNameConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.NAME
  };
  brokerScopeConfig: TableCellServiceBrokerComponentConfig = {
    mode: TableCellServiceBrokerComponentMode.SCOPE,
  };

  constructor(
    private dialog: TailwindDialogService,
    private appService: ApplicationService,
    private serviceActionHelperService: ServiceActionHelperService,
    private currentUserPermissionsService: CurrentUserPermissionsService,
  ) {
    super();
    this.cardMenu = [
      {
        label: 'Edit',
        action: this.edit,
        can: this.appService.waitForAppEntity$.pipe(
          switchMap(app => this.currentUserPermissionsService.can(
            CfCurrentUserPermissions.SERVICE_BINDING_EDIT,
            this.appService.cfGuid,
            app.entity.entity.space_guid
          )))
      },
      {
        label: 'Unbind',
        action: this.detach,
        can: this.appService.waitForAppEntity$.pipe(
          switchMap(app => this.currentUserPermissionsService.can(
            CfCurrentUserPermissions.SERVICE_BINDING_EDIT,
            this.appService.cfGuid,
            app.entity.entity.space_guid
          )))
      }];
  }

  ngOnInit() {
    if (!this.row || !this.row.entity || !this.row.entity.service_instance || !this.row.entity.service_instance.entity || !this.row.metadata) {
      console.warn('Invalid service binding data');
      return;
    }

    this.entityConfig = new ComponentEntityMonitorConfig(this.row.metadata.guid, cfEntityFactory(serviceBindingEntityType));

    this.isUserProvidedServiceInstance = !!isUserProvidedServiceInstance(this.row.entity.service_instance.entity);
    if (this.isUserProvidedServiceInstance) {
      this.setupAsUserProvidedServiceInstance();
    } else {
      this.setupAsServiceInstance();
    }

    this.tags$ = this.serviceInstance$.pipe(
      filter(o => !!o && !!o.entity && !!o.entity.entity && !!o.entity.entity.tags),
      map(o => o.entity.entity.tags.filter(t => t != null).map(t => ({ value: t })))
    );

    this.setupEnvVars();
  }

  private setupAsServiceInstance(): void {
    const serviceInstance$ = cfEntityCatalog.serviceInstance.store.getEntityService(
      this.row.entity.service_instance_guid, this.appService.cfGuid
    ).waitForEntity$;
    this.serviceInstance$ = serviceInstance$;
    this.service$ = serviceInstance$.pipe(
      filter(o => !!o && !!o.entity && !!o.entity.entity && !!o.entity.entity.service_guid),
      switchMap(o => cfEntityCatalog.service.store.getEntityService(o.entity.entity.service_guid, this.appService.cfGuid, {})
        .waitForEntity$),
      filter(service => !!service && !!service.entity),
      map(e => e.entity)
    );
    this.listData = [{
      label: 'Service Plan',
      data$: this.serviceInstance$.pipe(
        filter(si => !!si && !!si.entity && !!si.entity.entity),
        map(si => {
          if (this.isUserProvidedServiceInstance) {
            return null;
          }
          const serviceInstance: IServiceInstance = si.entity.entity as IServiceInstance;
          return serviceInstance && serviceInstance.service_plan && serviceInstance.service_plan.entity
            ? getServicePlanName(serviceInstance.service_plan.entity)
            : null;
        })
      )
    }];
    this.envVarServicesSection$ = this.service$.pipe(
      filter(s => !!s && !!s.entity),
      map(s => s.entity.label)
    );

    this.serviceDescription$ = this.service$.pipe(
      filter(service => !!service && !!service.entity),
      map(service => service.entity.description)
    );

    this.serviceUrl$ = this.service$.pipe(
      filter(service => !!service && !!service.entity && !!service.metadata),
      map(service => getServiceSummaryUrl(service.entity.cfGuid, service.metadata.guid))
    );

    this.serviceName$ = this.service$.pipe(
      map(service => getServiceName(service))
    );

  }

  private setupAsUserProvidedServiceInstance(): void {
    const userProvidedServiceInstance$ = cfEntityCatalog.userProvidedService.store.getEntityService(
      this.row.entity.service_instance_guid, this.appService.cfGuid
    ).waitForEntity$;
    this.serviceInstance$ = userProvidedServiceInstance$;
    this.service$ = of(null);
    this.listData = [{
      label: 'Route Service URL',
      data$: userProvidedServiceInstance$.pipe(
        map(service => service.entity.entity.route_service_url)
      )
    }, {
      label: 'Syslog Drain URL',
      data$: userProvidedServiceInstance$.pipe(
        map(service => service.entity.entity.syslog_drain_url)
      )
    }];
    this.envVarServicesSection$ = of('user-provided');
  }

  private setupEnvVars(): void {
    this.envVarsAvailable$ = observableCombineLatest(
      this.envVarServicesSection$,
      this.serviceInstance$,
      this.appService.appEnvVars.entities$)
      .pipe(
        first(),
        map(([serviceLabel, serviceInstance, allEnvVars]) => {
          const systemEnvJson = (allEnvVars as APIResource<AppEnvVarsState>[])?.[0]?.entity?.system_env_json;
          const serviceInstanceName = serviceInstance?.entity?.entity?.name;

          return (systemEnvJson?.VCAP_SERVICES?.[serviceLabel] && serviceInstanceName) ? {
            key: serviceInstanceName,
            value: systemEnvJson.VCAP_SERVICES[serviceLabel].find((s: any) => s.name === serviceInstanceName)
          } : null;
        }),
        filter(p => !!p),
      );
  }

  showEnvVars = (envVarData: EnvVarData): void => {
    this.dialog.open(EnvVarViewComponent, {
      data: envVarData,
      disableClose: false
    });
  };

  private detach = (): void => {
    this.serviceActionHelperService.detachServiceBinding(
      [this.row],
      this.row.entity.service_instance_guid,
      this.appService.cfGuid,
      false,
      this.isUserProvidedServiceInstance
    );
  };

  private edit = (): void => {
    this.serviceActionHelperService.startEditServiceBindingStepper(
      this.row.entity.service_instance_guid,
      this.appService.cfGuid,
      {
        appId: this.appService.appGuid,
        [CSI_CANCEL_URL]: `/applications/${this.appService.cfGuid}/${this.appService.appGuid}/services`
      },
      this.isUserProvidedServiceInstance
    );
  };
}

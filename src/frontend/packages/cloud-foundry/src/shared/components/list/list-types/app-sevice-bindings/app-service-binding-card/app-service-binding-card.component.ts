import { Component, type OnInit , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TailwindDialogService } from '@stratosui/core';
import { combineLatest as observableCombineLatest, type Observable, of } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import {
  CurrentUserPermissionsService,
} from '@stratosui/core';
import { type AppChip, AppChipsComponent } from '@stratosui/core';
import { CardCell, type IListRowCell } from '@stratosui/core';
import { MetaCardComponent } from '@stratosui/core';
import { MetaCardItemComponent } from '@stratosui/core';
import { MetaCardKeyComponent } from '@stratosui/core';
import { MetaCardValueComponent } from '@stratosui/core';
import { MetaCardTitleComponent } from '@stratosui/core';
import type { APIResource, EntityInfo } from '../../../../../../../../store/src/types/api.types';
import type { MenuItem } from '../../../../../../../../store/src/types/menu-item.types';
import { ComponentEntityMonitorConfig } from '../../../../../../../../store/src/types/shared.types';
import type {
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
import type { AppEnvVarsState } from '../../../../../../store/types/app-metadata.types';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions-checkers';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { ServiceIconComponent } from '../../../../service-icon/service-icon.component';
import { CSI_CANCEL_URL } from '../../../../add-service-instance/csi-mode.service';
import { EnvVarViewComponent } from '../../../../env-var-view/env-var-view.component';
import {
  TableCellServiceBrokerComponent,
  type TableCellServiceBrokerComponentConfig,
  TableCellServiceBrokerComponentMode,
} from '../../cf-services/table-cell-service-broker/table-cell-service-broker.component';


interface EnvVarData {
  key: string;
  value: string;
}

interface VcapService {
  name: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-app-service-binding-card',
  templateUrl: './app-service-binding-card.component.html',
  styleUrls: ['./app-service-binding-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AsyncPipe,
    DatePipe,
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

  envVarsAvailable$!: Observable<EnvVarData | null>;
  listData!: {
    label: string;
    data$: Observable<string>;
    customStyle?: string;
  }[];
  cardMenu: MenuItem[];
  service$!: Observable<APIResource<IService> | null>;
  serviceInstance$!: Observable<EntityInfo<APIResource<IServiceInstance | IUserProvidedServiceInstance>>>;
  tags$!: Observable<AppChip<IServiceInstance | IUserProvidedServiceInstance>[]>;
  entityConfig!: ComponentEntityMonitorConfig;
  private envVarServicesSection$!: Observable<string>;
  isUserProvidedServiceInstance!: boolean;
  serviceDescription$!: Observable<string | undefined>;
  serviceUrl$!: Observable<string | undefined>;
  serviceName$!: Observable<string | undefined>;

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
          return serviceInstance?.service_plan?.entity
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
        map(([serviceLabel, serviceInstance, allEnvVars]): EnvVarData | null => {
          const systemEnvJson = (allEnvVars as APIResource<AppEnvVarsState>[])?.[0]?.entity?.system_env_json as Record<string, Record<string, unknown>> | undefined;
          const serviceInstanceName = serviceInstance?.entity?.entity?.name;

          if (systemEnvJson?.VCAP_SERVICES && (systemEnvJson.VCAP_SERVICES as Record<string, unknown>)[serviceLabel] && serviceInstanceName) {
            const vcapValue = ((systemEnvJson.VCAP_SERVICES as Record<string, unknown>)[serviceLabel] as VcapService[]).find((s: VcapService) => s.name === serviceInstanceName);
            return vcapValue ? {
              key: serviceInstanceName,
              value: JSON.stringify(vcapValue)
            } : null;
          }
          return null;
        }),
        filter((p): p is EnvVarData => !!p),
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

import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { combineLatest as observableCombineLatest, Observable, of as observableOf, of } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { GetServiceInstance } from '../../../../../../../../cloud-foundry/src/actions/service-instances.actions';
import { GetUserProvidedService } from '../../../../../../../../cloud-foundry/src/actions/user-provided-service.actions';
import { cfEntityFactory, serviceBindingEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-factory';
import { ApplicationService } from '../../../../../../../../cloud-foundry/src/features/applications/application.service';
import { isUserProvidedServiceInstance } from '../../../../../../../../cloud-foundry/src/features/cloud-foundry/cf.helpers';
import { getCfService } from '../../../../../../../../cloud-foundry/src/features/service-catalog/services-helper';
import {
  ServiceActionHelperService,
} from '../../../../../../../../cloud-foundry/src/shared/data-services/service-action-helper.service';
import { AppEnvVarsState } from '../../../../../../../../cloud-foundry/src/store/types/app-metadata.types';
import {
  IService,
  IServiceBinding,
  IServiceInstance,
  IUserProvidedServiceInstance,
} from '../../../../../../../../core/src/core/cf-api-svc.types';
import { CurrentUserPermissions } from '../../../../../../../../core/src/core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../../../core/src/core/current-user-permissions.service';
import { EntityServiceFactory } from '../../../../../../../../core/src/core/entity-service-factory.service';
import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { EnvVarViewComponent } from '../../../../../../../../core/src/shared/components/env-var-view/env-var-view.component';
import {
  MetaCardMenuItem,
} from '../../../../../../../../core/src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell, IListRowCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { ComponentEntityMonitorConfig } from '../../../../../../../../core/src/shared/shared.types';
import { APIResource, EntityInfo } from '../../../../../../../../store/src/types/api.types';

interface EnvVarData {
  key: string;
  value: string;
}
@Component({
  selector: 'app-app-service-binding-card',
  templateUrl: './app-service-binding-card.component.html',
  styleUrls: ['./app-service-binding-card.component.scss']
})
export class AppServiceBindingCardComponent extends CardCell<APIResource<IServiceBinding>> implements OnInit, IListRowCell {

  envVarsAvailable$: Observable<EnvVarData>;
  listData: {
    label: string;
    data$: Observable<string>;
    customStyle?: string;
  }[];
  cardMenu: MetaCardMenuItem[];
  service$: Observable<EntityInfo<APIResource<IService>> | null>;
  serviceInstance$: Observable<EntityInfo<APIResource<IServiceInstance | IUserProvidedServiceInstance>>>;
  tags$: Observable<AppChip<IServiceInstance | IUserProvidedServiceInstance>[]>;
  entityConfig: ComponentEntityMonitorConfig;
  private envVarServicesSection$: Observable<string>;
  private isUserProvidedServiceInstance: boolean;

  constructor(
    private dialog: MatDialog,
    private datePipe: DatePipe,
    private entityServiceFactory: EntityServiceFactory,
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
            CurrentUserPermissions.SERVICE_BINDING_EDIT,
            this.appService.cfGuid,
            app.entity.entity.space_guid
          )))
      },
      {
        label: 'Unbind',
        action: this.detach,
        can: this.appService.waitForAppEntity$.pipe(
          switchMap(app => this.currentUserPermissionsService.can(
            CurrentUserPermissions.SERVICE_BINDING_EDIT,
            this.appService.cfGuid,
            app.entity.entity.space_guid
          )))
      }];
  }
  ngOnInit(): void {
    this.entityConfig = new ComponentEntityMonitorConfig(this.row.metadata.guid, cfEntityFactory(serviceBindingEntityType));

    this.isUserProvidedServiceInstance = !!isUserProvidedServiceInstance(this.row.entity.service_instance.entity);
    if (this.isUserProvidedServiceInstance) {
      this.setupAsUserProvidedServiceInstance();
    } else {
      this.setupAsServiceInstance();
    }

    this.listData.push({
      label: 'Date Created On',
      data$: observableOf(this.datePipe.transform(this.row.metadata.created_at, 'medium'))
    });

    this.tags$ = this.serviceInstance$.pipe(
      filter(o => !!o.entity.entity.tags),
      map(o => o.entity.entity.tags.map(t => ({ value: t })))
    );

    this.setupEnvVars();
  }

  private setupAsServiceInstance() {
    const serviceInstance$ = this.entityServiceFactory.create<APIResource<IServiceInstance>>(
      this.row.entity.service_instance_guid,
      new GetServiceInstance(this.row.entity.service_instance_guid, this.appService.cfGuid),
      true
    ).waitForEntity$;
    this.serviceInstance$ = serviceInstance$;
    this.service$ = serviceInstance$.pipe(
      switchMap(o => getCfService(o.entity.entity.service_guid, this.appService.cfGuid, this.entityServiceFactory).waitForEntity$),
      filter(service => !!service)
    );
    this.listData = [{
      label: null,
      data$: this.service$.pipe(
        map(service => service.entity.entity.description)
      ),
      customStyle: 'long-text'
    },
    {
      label: 'Service Name',
      data$: this.service$.pipe(
        map(service => service.entity.entity.label)
      )
    },
    {
      label: 'Service Plan',
      data$: serviceInstance$.pipe(
        map(service => service.entity.entity.service_plan.entity.name)
      )
    }
    ];
    this.envVarServicesSection$ = this.service$.pipe(map(s => s.entity.entity.label));
  }

  private setupAsUserProvidedServiceInstance() {
    const userProvidedServiceInstance$ = this.entityServiceFactory.create<APIResource<IUserProvidedServiceInstance>>(
      this.row.entity.service_instance_guid,
      new GetUserProvidedService(this.row.entity.service_instance_guid, this.appService.cfGuid),
      true
    ).waitForEntity$;
    this.serviceInstance$ = userProvidedServiceInstance$;
    this.service$ = of(null);
    this.listData = [{
      label: null,
      data$: of('User Provided Service Instance'),
      customStyle: 'long-text'
    }, {
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

  private setupEnvVars() {
    this.envVarsAvailable$ = observableCombineLatest(
      this.envVarServicesSection$,
      this.serviceInstance$,
      this.appService.appEnvVars.entities$)
      .pipe(
        first(),
        map(([serviceLabel, serviceInstance, allEnvVars]) => {
          const systemEnvJson = (allEnvVars as APIResource<AppEnvVarsState>[])[0].entity.system_env_json;
          const serviceInstanceName = serviceInstance.entity.entity.name;

          return systemEnvJson.VCAP_SERVICES[serviceLabel] ? {
            key: serviceInstanceName,
            value: systemEnvJson.VCAP_SERVICES[serviceLabel].find(s => s.name === serviceInstanceName)
          } : null;
        }),
        filter(p => !!p),
      );
  }

  showEnvVars = (envVarData: EnvVarData) => {
    this.dialog.open(EnvVarViewComponent, {
      data: envVarData,
      disableClose: false
    });
  }

  detach = () => {
    this.serviceActionHelperService.detachServiceBinding(
      [this.row],
      this.row.entity.service_instance_guid,
      this.appService.cfGuid,
      false,
      this.isUserProvidedServiceInstance
    );
  }

  edit = () => this.serviceActionHelperService.editServiceBinding(
    this.row.entity.service_instance_guid,
    this.appService.cfGuid,
    { appId: this.appService.appGuid },
    this.isUserProvidedServiceInstance
  )

}

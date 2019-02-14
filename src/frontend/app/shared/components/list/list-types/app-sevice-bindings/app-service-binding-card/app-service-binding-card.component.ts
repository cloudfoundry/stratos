import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { combineLatest as observableCombineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { IService, IServiceBinding, IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { CurrentUserPermissions } from '../../../../../../core/current-user-permissions.config';
import { CurrentUserPermissionsService } from '../../../../../../core/current-user-permissions.service';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { getCfService } from '../../../../../../features/service-catalog/services-helper';
import { GetServiceInstance } from '../../../../../../store/actions/service-instances.actions';
import {
  entityFactory,
  serviceBindingSchemaKey,
  serviceInstancesSchemaKey,
} from '../../../../../../store/helpers/entity-factory';
import { APIResource, EntityInfo } from '../../../../../../store/types/api.types';
import { AppEnvVarsState } from '../../../../../../store/types/app-metadata.types';
import { ServiceActionHelperService } from '../../../../../data-services/service-action-helper.service';
import { ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { AppChip } from '../../../../chips/chips.component';
import { EnvVarViewComponent } from '../../../../env-var-view/env-var-view.component';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { CardCell, IListRowCell, IListRowCellData } from '../../../list.types';



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
  listData: IListRowCellData[];
  envVarUrl: string;
  cardMenu: MetaCardMenuItem[];
  service$: Observable<EntityInfo<APIResource<IService>>>;
  serviceInstance$: Observable<EntityInfo<APIResource<IServiceInstance>>>;
  tags$: Observable<AppChip<IServiceInstance>[]>;
  entityConfig: ComponentEntityMonitorConfig;

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
    this.entityConfig = new ComponentEntityMonitorConfig(this.row.metadata.guid, entityFactory(serviceBindingSchemaKey));
    this.serviceInstance$ = this.entityServiceFactory.create<APIResource<IServiceInstance>>(
      serviceInstancesSchemaKey,
      entityFactory(serviceInstancesSchemaKey),
      this.row.entity.service_instance_guid,
      new GetServiceInstance(this.row.entity.service_instance_guid, this.appService.cfGuid),
      true
    ).waitForEntity$;

    this.service$ = this.serviceInstance$.pipe(
      switchMap(o => getCfService(o.entity.entity.service_guid, this.appService.cfGuid, this.entityServiceFactory).waitForEntity$),
      filter(service => !!service)
    );

    this.listData = [
      {
        label: 'Service Name',
        data$: this.service$.pipe(
          map(service => service.entity.entity.label)
        )
      },
      {
        label: 'Service Plan',
        data$: this.serviceInstance$.pipe(
          map(service => service.entity.entity.service_plan.entity.name)
        )
      },
      {
        label: 'Date Created On',
        data$: observableOf(this.datePipe.transform(this.row.metadata.created_at, 'medium'))
      }
    ];

    this.tags$ = this.serviceInstance$.pipe(
      map(o => o.entity.entity.tags.map(t => ({ value: t })))
    );
    this.envVarUrl = `/applications/${this.appService.cfGuid}/${this.appService.appGuid}/service-bindings/${this.row.metadata.guid}/vars`;

    this.envVarsAvailable$ = observableCombineLatest(this.service$, this.serviceInstance$, this.appService.appEnvVars.entities$)
      .pipe(
        first(),
        map(([service, serviceInstance, allEnvVars]) => {
          const systemEnvJson = (allEnvVars as APIResource<AppEnvVarsState>[])[0].entity.system_env_json;
          const serviceInstanceName = serviceInstance.entity.entity.name;
          const serviceLabel = (service as EntityInfo<APIResource<IService>>).entity.entity.label;

          if (systemEnvJson['VCAP_SERVICES'][serviceLabel]) {
            return {
              key: serviceInstanceName,
              value: systemEnvJson['VCAP_SERVICES'][serviceLabel].find(s => s.name === serviceInstanceName)
            };
          }
          return null;
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
      this.appService.cfGuid
    );
  }

  edit = () => this.serviceActionHelperService.editServiceBinding(
    this.row.entity.service_instance_guid,
    this.appService.cfGuid,
    { 'appId': this.appService.appGuid }
  )

}

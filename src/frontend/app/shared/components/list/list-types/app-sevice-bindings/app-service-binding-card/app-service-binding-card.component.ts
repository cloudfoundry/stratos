import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { first, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { IService, IServiceBinding, IServiceInstance } from '../../../../../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { DeleteAppServiceBinding } from '../../../../../../store/actions/application-service-routes.actions';
import { GetServiceInstance } from '../../../../../../store/actions/service-instances.actions';
import { GetService } from '../../../../../../store/actions/service.actions';
import { AppState } from '../../../../../../store/app-state';
import { entityFactory, serviceInstancesSchemaKey, serviceSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { APIResource, EntityInfo } from '../../../../../../store/types/api.types';
import { AppEnvVarsState } from '../../../../../../store/types/app-metadata.types';
import { AppChip } from '../../../../chips/chips.component';
import { ConfirmationDialogConfig } from '../../../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../confirmation-dialog.service';
import { EnvVarViewComponent } from '../../../../env-var-view/env-var-view.component';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';

@Component({
  selector: 'app-app-service-binding-card',
  templateUrl: './app-service-binding-card.component.html',
  styleUrls: ['./app-service-binding-card.component.scss']
})
export class AppServiceBindingCardComponent extends TableCellCustom<APIResource<IServiceBinding>> implements OnInit {

  envVarUrl: string;
  cardMenu: MetaCardMenuItem[];
  service$: Observable<EntityInfo<APIResource<IService>>>;
  serviceInstance$: Observable<EntityInfo<APIResource<IServiceInstance>>>;
  tags$: Observable<AppChip<IServiceInstance>[]>;
  @Input('row') row: APIResource<IServiceBinding>;

  constructor(
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private appService: ApplicationService,
    private dialog: MatDialog,
    private confirmDialog: ConfirmationDialogService
  ) {
    super();
    this.cardMenu = [
      {
        icon: 'settings',
        label: 'Detach',
        action: this.detach
      }
    ];
  }
  ngOnInit(): void {
    this.serviceInstance$ = this.entityServiceFactory.create<APIResource<IServiceInstance>>(
      serviceInstancesSchemaKey,
      entityFactory(serviceInstancesSchemaKey),
      this.row.entity.service_instance_guid,
      new GetServiceInstance(this.row.entity.service_instance_guid, this.appService.cfGuid),
      true
    ).entityObs$;

    this.service$ = this.serviceInstance$.pipe(
      switchMap(o => this.entityServiceFactory.create<APIResource<IService>>(
        serviceSchemaKey,
        entityFactory(serviceSchemaKey),
        o.entity.entity.service_guid,
        new GetService(o.entity.entity.service_guid, this.appService.cfGuid),
        true
      ).entityObs$)
    );

    this.tags$ = this.serviceInstance$.pipe(
      map(o => o.entity.entity.tags.map(t => ({ value: t })))
    );
    this.envVarUrl = `/applications/${this.appService.cfGuid}/${this.appService.appGuid}/service-bindings/${this.row.metadata.guid}/vars`;
  }

  showEnvVars = () => {

    Observable.combineLatest(this.service$, this.serviceInstance$, this.appService.appEnvVars.entities$)
      .pipe(
        withLatestFrom(),
        map(([[service, serviceInstance, allEnvVars]]) => {
          const systemEnvJson = (allEnvVars as APIResource<AppEnvVarsState>[])[0].entity.system_env_json;
          const serviceInstanceName = (serviceInstance as EntityInfo<APIResource<IServiceInstance>>).entity.entity.name;
          const serviceLabel = (service as EntityInfo<APIResource<IService>>).entity.entity.label;
          if (systemEnvJson['VCAP_SERVICES'][serviceLabel]) {
            return {
              key: serviceInstanceName,
              value: systemEnvJson['VCAP_SERVICES'][serviceLabel].find(s => s.name === serviceInstanceName)
            };
          }
        }),
        tap(data => {
          this.dialog.open(EnvVarViewComponent, {
            data: data,
            disableClose: false
          });
        }),
        first()
      ).subscribe();

  }

  detach = () => {
    const confirmation = new ConfirmationDialogConfig(
      'Detach Service Instance',
      'Are you sure you want to detach the application from the service?',
      'Detach',
      true
    );
    this.confirmDialog.open(confirmation, () =>
      this.store.dispatch(new DeleteAppServiceBinding(this.appService.appGuid, this.row.metadata.guid, this.appService.cfGuid))
    );
  }
}

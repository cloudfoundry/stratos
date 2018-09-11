import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { ApplicationStateService } from '../../../shared/components/application-state/application-state.service';
import { APP_GUID, CF_GUID, ENTITY_SERVICE } from '../../../shared/entity.tokens';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../store/app-state';
import { applicationSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { ApplicationService, createGetApplicationAction } from '../application.service';
import { ApplicationEnvVarsHelper } from './application-tabs-base/tabs/build-tab/application-env-vars.service';



export function applicationServiceFactory(
  cfId: string,
  id: string,
  store: Store<AppState>,
  entityServiceFactoryInstance: EntityServiceFactory,
  appStateService: ApplicationStateService,
  appEnvVarsService: ApplicationEnvVarsHelper,
  paginationMonitorFactory: PaginationMonitorFactory
) {
  return new ApplicationService(
    cfId,
    id,
    store,
    entityServiceFactoryInstance,
    appStateService,
    appEnvVarsService,
    paginationMonitorFactory
  );
}

export function entityServiceFactory(
  cfId: string,
  id: string,
  _entityServiceFactory: EntityServiceFactory,
) {
  return _entityServiceFactory.create(
    applicationSchemaKey,
    entityFactory(applicationSchemaKey),
    id,
    createGetApplicationAction(id, cfId),
    true
  );
}

export function getGuids(type?: string) {
  return (activatedRoute: ActivatedRoute) => {
    const { id, cfId } = activatedRoute.snapshot.params;
    if (type) {
      return cfId;
    }
    return id;
  };
}

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss'],
  providers: [
    ApplicationService,
    {
      provide: CF_GUID,
      useFactory: getGuids('cf'),
      deps: [ActivatedRoute]
    },
    {
      provide: APP_GUID,
      useFactory: getGuids(),
      deps: [ActivatedRoute]
    },
    {
      provide: ApplicationService,
      useFactory: applicationServiceFactory,
      deps: [CF_GUID, APP_GUID, Store, EntityServiceFactory, ApplicationStateService, ApplicationEnvVarsHelper, PaginationMonitorFactory]
    },
    {
      provide: ENTITY_SERVICE,
      useFactory: entityServiceFactory,
      deps: [CF_GUID, APP_GUID, EntityServiceFactory]
    },

  ]
})
export class ApplicationBaseComponent {
}

import { Component, HostBinding } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { ApplicationStateService } from '../../../shared/components/application-state/application-state.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { AppState } from '../../../store/app-state';
import { applicationSchemaKey, entityFactory } from '../../../store/helpers/entity-factory';
import { ApplicationService, createGetApplicationAction } from '../application.service';
import { ApplicationEnvVarsService } from './application-tabs-base/tabs/build-tab/application-env-vars.service';
import { CF_GUID, APP_GUID } from '../../../shared/entity.tokens';


export function applicationServiceFactory(
  store: Store<AppState>,
  activatedRoute: ActivatedRoute,
  entityServiceFactory: EntityServiceFactory,
  appStateService: ApplicationStateService,
  appEnvVarsService: ApplicationEnvVarsService,
  paginationMonitorFactory: PaginationMonitorFactory
) {
  const { id, cfId } = activatedRoute.snapshot.params;
  return new ApplicationService(
    cfId,
    id,
    store,
    entityServiceFactory,
    appStateService,
    appEnvVarsService,
    paginationMonitorFactory
  );
}

export function entityServiceFactory(
  _entityServiceFactory: EntityServiceFactory,
  activatedRoute: ActivatedRoute
) {
  const { id, cfId } = activatedRoute.snapshot.params;
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
      deps: [CF_GUID, APP_GUID, Store, EntityServiceFactory, ApplicationStateService, ApplicationEnvVarsService, PaginationMonitorFactory]
    },
    {
      provide: EntityService,
      useFactory: entityServiceFactory,
      deps: [EntityServiceFactory, ActivatedRoute]
    },

  ]
})
export class ApplicationBaseComponent {
}

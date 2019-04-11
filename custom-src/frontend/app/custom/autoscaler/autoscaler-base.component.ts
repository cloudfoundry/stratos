import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { AppState } from '../../../../store/src/app-state';
import { applicationSchemaKey, entityFactory } from '../../../../store/src/helpers/entity-factory';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { ApplicationStateService } from '../../shared/components/application-state/application-state.service';
import { APP_GUID, CF_GUID, ENTITY_SERVICE } from '../../shared/entity.tokens';
import { PaginationMonitorFactory } from '../../shared/monitors/pagination-monitor.factory';
import { ApplicationService, createGetApplicationAction } from '../../features/applications/application.service';
import { ApplicationEnvVarsHelper } from '../../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';

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
  esf: EntityServiceFactory,
) {
  return esf.create(
    applicationSchemaKey,
    entityFactory(applicationSchemaKey),
    id,
    createGetApplicationAction(id, cfId),
    true
  );
}

export function getGuids(type?: string) {
  return (activatedRoute: ActivatedRoute) => {
    const { id, endpointId } = activatedRoute.snapshot.params;
    if (type) {
      return endpointId;
    }
    return id;
  };
}

@Component({
  selector: 'app-autoscaler-base',
  templateUrl: './autoscaler-base.component.html',
  styleUrls: ['./autoscaler-base.component.scss'],
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
export class AutoscalerBaseComponent {
}

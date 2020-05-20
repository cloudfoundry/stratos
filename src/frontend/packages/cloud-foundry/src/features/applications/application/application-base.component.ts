import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { APP_GUID, CF_GUID, ENTITY_SERVICE } from '../../../../../core/src/shared/entity.tokens';
import { EntityServiceFactory } from '../../../../../store/src/entity-service-factory.service';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import { ApplicationService, createGetApplicationAction } from '../application.service';
import { ApplicationEnvVarsHelper } from './application-tabs-base/tabs/build-tab/application-env-vars.service';

export function applicationServiceFactory(
  cfId: string,
  id: string,
  store: Store<CFAppState>,
  appStateService: ApplicationStateService,
  appEnvVarsService: ApplicationEnvVarsHelper,
) {
  return new ApplicationService(
    cfId,
    id,
    store,
    appStateService,
    appEnvVarsService,
  );
}

export function cfApplicationEntityServiceFactory(
  cfId: string,
  id: string,
  esf: EntityServiceFactory
) {
  return esf.create(
    id,
    createGetApplicationAction(id, cfId)
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
      deps: [
        CF_GUID,
        APP_GUID,
        Store,
        ApplicationStateService,
        ApplicationEnvVarsHelper,
      ]
    },
    {
      provide: ENTITY_SERVICE,
      useFactory: cfApplicationEntityServiceFactory,
      deps: [CF_GUID, APP_GUID, EntityServiceFactory]
    },

  ]
})
export class ApplicationBaseComponent {
}

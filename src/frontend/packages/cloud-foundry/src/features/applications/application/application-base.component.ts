import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { APP_GUID, CF_GUID } from '../../../../../core/src/shared/entity.tokens';
import { ApplicationEnvVarsHelper } from '../../../shared/services/application-env-vars.service';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import { ApplicationService } from '../../../shared/services/application.service';
import { getGuids } from '../../../shared/utils';

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
    }
  ]
})
export class ApplicationBaseComponent {
}

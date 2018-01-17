import { GetApplication, ApplicationSchema } from '../../../store/actions/application.actions';
import { ApplicationService } from '../application.service';
import { ApplicationEnvVarsService } from './application-tabs-base/tabs/build-tab/application-env-vars.service';
import { ApplicationStateService } from '../../../shared/components/application-state/application-state.service';
import { EntityService } from '../../../core/entity-service';
import { AppState } from '../../../store/app-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';


const applicationServiceFactory = (
  store: Store<AppState>,
  activatedRoute: ActivatedRoute,
  entityService: EntityService,
  appStateService: ApplicationStateService,
  appEnvVarsService: ApplicationEnvVarsService
) => {
  const { id, cfId } = activatedRoute.snapshot.params;
  return new ApplicationService(
    cfId,
    id,
    store,
    entityService,
    appStateService,
    appEnvVarsService,
  );
};

const entityServiceFactory = (
  store: Store<AppState>,
  activatedRoute: ActivatedRoute
) => {
  const { id, cfId } = activatedRoute.snapshot.params;
  return new EntityService(
    store,
    ApplicationSchema.key,
    ApplicationSchema,
    id,
    new GetApplication(id, cfId)
  );
};

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss'],
  providers: [
    ApplicationService,
    {
      provide: ApplicationService,
      useFactory: applicationServiceFactory,
      deps: [Store, ActivatedRoute, EntityService, ApplicationStateService, ApplicationEnvVarsService]
    },
    {
      provide: EntityService,
      useFactory: entityServiceFactory,
      deps: [Store, ActivatedRoute]
    }
  ]
})
export class ApplicationBaseComponent implements OnInit, OnDestroy {

  constructor(
  ) { }

  ngOnDestroy(): void {
  }
  ngOnInit(): void {
  }

}

import { GetApplication, ApplicationSchema } from '../../../store/actions/application.actions';
import { ApplicationService } from '../application.service';
import { ApplicationStateService } from '../../../shared/components/application-state/application-state.service';
import { EntityService } from '../../../core/entity-service';
import { AppState } from '../../../store/app-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { RouterNav } from '../../../store/actions/router.actions';
import { ApplicationEnvVarsService } from './application-tabs-base/tabs/build-tab/application-env-vars.service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';


function applicationServiceFactory(
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

function entityServiceFactory(
  _entityServiceFactory: EntityServiceFactory,
  activatedRoute: ActivatedRoute
) {
  const { id, cfId } = activatedRoute.snapshot.params;
  // const entityMonitor = new en
  return _entityServiceFactory.create(
    ApplicationSchema.key,
    ApplicationSchema,
    id,
    new GetApplication(id, cfId)
  );
}

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss'],
  providers: [
    ApplicationService,
    {
      provide: ApplicationService,
      useFactory: applicationServiceFactory,
      deps: [Store, ActivatedRoute, EntityServiceFactory, ApplicationStateService, ApplicationEnvVarsService, PaginationMonitorFactory]
    },
    {
      provide: EntityService,
      useFactory: entityServiceFactory,
      deps: [EntityServiceFactory, ActivatedRoute]
    }
  ]
})
export class ApplicationBaseComponent implements OnInit, OnDestroy {

  constructor(
  ) { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
  }
}

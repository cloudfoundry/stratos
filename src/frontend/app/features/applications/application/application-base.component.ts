import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { first, map } from 'rxjs/operators';

import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { ApplicationStateService } from '../../../shared/components/application-state/application-state.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { ApplicationSchema, GetApplication } from '../../../store/actions/application.actions';
import { AppState } from '../../../store/app-state';
import { endpointsEntityRequestDataSelector } from '../../../store/selectors/endpoint.selectors';
import { ApplicationService } from '../application.service';
import { ApplicationEnvVarsService } from './application-tabs-base/tabs/build-tab/application-env-vars.service';


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
    {
      provide: ApplicationService,
      useFactory: applicationServiceFactory,
      deps: [Store, ActivatedRoute, EntityServiceFactory, ApplicationStateService, ApplicationEnvVarsService, PaginationMonitorFactory]
    },
    {
      provide: EntityService,
      useFactory: entityServiceFactory,
      deps: [EntityServiceFactory, ActivatedRoute]
    },

  ]
})
export class ApplicationBaseComponent { }

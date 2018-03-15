import { Component, OnDestroy, OnInit } from '@angular/core';
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
    applicationSchemaKey,
    entityFactory(applicationSchemaKey),
    id,
    createGetApplicationAction(id, cfId),
    true
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

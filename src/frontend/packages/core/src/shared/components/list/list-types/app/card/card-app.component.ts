import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { IApp } from '../../../../../../core/cf-api.types';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { haveMultiConnectedCfs } from '../../../../../../features/cloud-foundry/cf.helpers';

import {
  ApplicationStateData,
  ApplicationStateService
} from '../../../../application-state/application-state.service';
import { CardCell } from '../../../list.types';
import { ComponentEntityMonitorConfig, CardStatus } from '../../../../../shared.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { AppState } from '../../../../../../../../store/src/app-state';
import { entityFactory, applicationSchemaKey, endpointSchemaKey } from '../../../../../../../../store/src/helpers/entity-factory';
import { EndpointModel } from '../../../../../../../../store/src/types/endpoint.types';
import { selectEntity } from '../../../../../../../../store/src/selectors/api.selectors';

@Component({
  selector: 'app-card-app',
  templateUrl: './card-app.component.html',
  styleUrls: ['./card-app.component.scss']
})
export class CardAppComponent extends CardCell<APIResource<IApp>> implements OnInit {

  @Input() row: APIResource<IApp>;
  applicationState$: Observable<ApplicationStateData>;

  appStatus$: Observable<CardStatus>;
  endpointName$: Observable<string>;
  multipleConnectedEndpoints$: Observable<boolean>;
  entityConfig: ComponentEntityMonitorConfig;

  constructor(
    private store: Store<AppState>,
    private appStateService: ApplicationStateService
  ) {
    super();
  }

  ngOnInit() {
    this.entityConfig = new ComponentEntityMonitorConfig(this.row.metadata.guid, entityFactory(applicationSchemaKey));
    this.multipleConnectedEndpoints$ = haveMultiConnectedCfs(this.store);

    this.endpointName$ = this.store.select<EndpointModel>(selectEntity(endpointSchemaKey, this.row.entity.cfGuid)).pipe(
      map(endpoint => endpoint ? endpoint.name : '')
    );

    const initState = this.appStateService.get(this.row.entity, null);
    this.applicationState$ = ApplicationService.getApplicationState(
      this.store,
      this.appStateService,
      this.row.entity,
      this.row.metadata.guid,
      this.row.entity.cfGuid
    ).pipe(
      startWith(initState)
    );
    this.appStatus$ = this.applicationState$.pipe(
      map(state => state.indicator),
    );
  }
}

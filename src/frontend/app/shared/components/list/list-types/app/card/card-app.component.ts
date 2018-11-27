import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { IApp } from '../../../../../../core/cf-api.types';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { haveMultiConnectedCfs } from '../../../../../../features/cloud-foundry/cf.helpers';
import { AppState } from '../../../../../../store/app-state';
import { endpointSchemaKey, entityFactory, applicationSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { APIResource } from '../../../../../../store/types/api.types';
import { EndpointModel } from '../../../../../../store/types/endpoint.types';
import {
  ApplicationStateData,
  ApplicationStateService,
  CardStatus,
} from '../../../../application-state/application-state.service';
import { CardCell } from '../../../list.types';
import { ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { SaveUserFavoriteAction } from '../../../../../../store/actions/user-favourites-actions/save-user-favorite-action';
import { UserFavoritesEffect, userFavoritesPaginationKey } from '../../../../../../store/effects/user-favoutites-effect';
import { isFavorite } from '../../../../../../store/selectors/favorite.selectors';

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

  public isFavorite$: Observable<boolean>;

  constructor(
    private store: Store<AppState>,
    private appStateService: ApplicationStateService
  ) {
    super();
  }


  public favorite() {
    this.store.dispatch(new SaveUserFavoriteAction(
      this.row.entity.guid,
      this.row.entity.cfGuid,
      applicationSchemaKey,
      'cf'
    ));
  }

  ngOnInit() {
    this.entityConfig = new ComponentEntityMonitorConfig(this.row.metadata.guid, entityFactory(applicationSchemaKey));
    this.multipleConnectedEndpoints$ = haveMultiConnectedCfs(this.store);

    this.endpointName$ = this.store.select<EndpointModel>(selectEntity(endpointSchemaKey, this.row.entity.cfGuid)).pipe(
      map(endpoint => endpoint ? endpoint.name : '')
    );

    this.isFavorite$ = this.store.select(
      isFavorite(
        {
          entityId: this.row.entity.guid,
          endpointId: this.row.entity.cfGuid,
          /*
            entityType should correspond to a type in the requestData part of the store.
          */
          entityType: applicationSchemaKey,
          endpointType: 'cf',
        },
        applicationSchemaKey,
        userFavoritesPaginationKey
      )
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

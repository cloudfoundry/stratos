import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { first, map, startWith, tap } from 'rxjs/operators';
import { IApp } from '../../../../../../core/cf-api.types';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { haveMultiConnectedCfs } from '../../../../../../features/cloud-foundry/cf.helpers';
import { RemoveUserFavoriteAction } from '../../../../../../store/actions/user-favourites-actions/remove-user-favorite-action';
import { SaveUserFavoriteAction } from '../../../../../../store/actions/user-favourites-actions/save-user-favorite-action';
import { AppState } from '../../../../../../store/app-state';
import { applicationSchemaKey, endpointSchemaKey, entityFactory } from '../../../../../../store/helpers/entity-factory';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { isFavorite } from '../../../../../../store/selectors/favorite.selectors';
import { APIResource } from '../../../../../../store/types/api.types';
import { EndpointModel } from '../../../../../../store/types/endpoint.types';
import { UserFavorite } from '../../../../../../store/types/user-favorites.types';
import { ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { ApplicationStateData, ApplicationStateService, CardStatus } from '../../../../application-state/application-state.service';
import { CardCell } from '../../../list.types';
import { UserFavoriteManager } from '../../../../../../core/user-favorite-hydrator';

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
  private favoriteObject: UserFavorite;
  userFavoriteManager: UserFavoriteManager;

  constructor(
    private store: Store<AppState>,
    private appStateService: ApplicationStateService
  ) {
    super();
    this.userFavoriteManager = new UserFavoriteManager(store);
  }

  public toggleFavorite() {
    this.userFavoriteManager.toggleFavorite(this.favoriteObject);
  }

  private getFavoriteObservable = () => this.userFavoriteManager.getIsFavoriteObservable(this.favoriteObject);

  ngOnInit() {
    this.entityConfig = new ComponentEntityMonitorConfig(this.row.metadata.guid, entityFactory(applicationSchemaKey));
    this.multipleConnectedEndpoints$ = haveMultiConnectedCfs(this.store);

    this.endpointName$ = this.store.select<EndpointModel>(selectEntity(endpointSchemaKey, this.row.entity.cfGuid)).pipe(
      map(endpoint => endpoint ? endpoint.name : '')
    );
    this.favoriteObject = new UserFavorite(
      this.row.entity.cfGuid,
      'cf',
      this.row.entity.guid,
      applicationSchemaKey,
    );
    this.isFavorite$ = this.getFavoriteObservable();

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

import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { applicationEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { IAppFavMetadata } from '../../../../../../../../cloud-foundry/src/cf-metadata-types';
import { IApp, ISpace } from '../../../../../../../../core/src/core/cf-api.types';
import { getFavoriteFromCfEntity } from '../../../../../../../../core/src/core/user-favorite-helpers';
import {
  ApplicationStateData,
  ApplicationStateService,
} from '../../../../../../../../core/src/shared/components/application-state/application-state.service';
import {
  FavoritesConfigMapper,
} from '../../../../../../../../core/src/shared/components/favorites-meta-card/favorite-config-mapper';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { CfOrgSpaceLabelService } from '../../../../../../../../core/src/shared/services/cf-org-space-label.service';
import { ComponentEntityMonitorConfig, StratosStatus } from '../../../../../../../../core/src/shared/shared.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { ApplicationService } from '../../../../../../features/applications/application.service';

@Component({
  selector: 'app-card-app',
  templateUrl: './card-app.component.html',
  styleUrls: ['./card-app.component.scss']
})
export class CardAppComponent extends CardCell<APIResource<IApp>> implements OnInit {

  @Input() row: APIResource<IApp>;
  applicationState$: Observable<ApplicationStateData>;

  appStatus$: Observable<StratosStatus>;
  entityConfig: ComponentEntityMonitorConfig;
  cfOrgSpace: CfOrgSpaceLabelService;

  public favorite: UserFavorite<IAppFavMetadata>;

  constructor(
    private store: Store<CFAppState>,
    private appStateService: ApplicationStateService,
    private favoritesConfigMapper: FavoritesConfigMapper,


  ) {
    super();
  }

  ngOnInit() {
    this.entityConfig = new ComponentEntityMonitorConfig(this.row.metadata.guid, cfEntityFactory(applicationEntityType));
    this.cfOrgSpace = new CfOrgSpaceLabelService(
      this.store,
      this.row.entity.cfGuid,
      (this.row.entity.space as APIResource<ISpace>).entity.organization_guid,
      this.row.entity.space_guid
    );

    this.favorite = getFavoriteFromCfEntity(this.row, applicationEntityType, this.favoritesConfigMapper);

    const initState = this.appStateService.get(this.row.entity, null);
    this.applicationState$ = ApplicationService.getApplicationState(
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

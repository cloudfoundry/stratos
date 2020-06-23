import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { applicationEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { IAppFavMetadata } from '../../../../../../../../cloud-foundry/src/cf-metadata-types';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { FavoritesConfigMapper } from '../../../../../../../../store/src/favorite-config-mapper';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { ComponentEntityMonitorConfig, StratosStatus } from '../../../../../../../../store/src/types/shared.types';
import { UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { getFavoriteFromEntity } from '../../../../../../../../store/src/user-favorite-helpers';
import { IApp, ISpace } from '../../../../../../cf-api.types';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { ApplicationStateData, ApplicationStateService } from '../../../../../services/application-state.service';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';

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

    this.favorite = getFavoriteFromEntity(this.row, applicationEntityType, this.favoritesConfigMapper, CF_ENDPOINT_TYPE);

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

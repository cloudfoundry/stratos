import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { AppState } from '../../../../../../../../store/src/app-state';
import { applicationSchemaKey, entityFactory } from '../../../../../../../../store/src/helpers/entity-factory';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { IAppFavMetadata } from '../../../../../../cf-favourite-types';
import { IApp, ISpace } from '../../../../../../core/cf-api.types';
import { getFavoriteFromCfEntity } from '../../../../../../core/user-favorite-helpers';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { StratosStatus, ComponentEntityMonitorConfig } from '../../../../../shared.types';
import { ApplicationStateData, ApplicationStateService } from '../../../../application-state/application-state.service';
import { CardCell } from '../../../list.types';

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
    private store: Store<AppState>,
    private appStateService: ApplicationStateService
  ) {
    super();
  }

  ngOnInit() {
    this.entityConfig = new ComponentEntityMonitorConfig(this.row.metadata.guid, entityFactory(applicationSchemaKey));
    this.cfOrgSpace = new CfOrgSpaceLabelService(
      this.store,
      this.row.entity.cfGuid,
      (this.row.entity.space as APIResource<ISpace>).entity.organization_guid,
      this.row.entity.space_guid
    );

    this.favorite = getFavoriteFromCfEntity(this.row, applicationSchemaKey);

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

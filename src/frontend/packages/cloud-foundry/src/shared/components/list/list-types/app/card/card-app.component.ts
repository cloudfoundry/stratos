import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { applicationEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { ComponentEntityMonitorConfig, StratosStatus } from '../../../../../../../../store/src/types/shared.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../../../../store/src/user-favorite-manager';
import { UserFavoriteManager } from '../../../../../../../../store/src/user-favorite-manager';
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

  applicationState$: Observable<ApplicationStateData>;

  appStatus$: Observable<StratosStatus>;
  entityConfig: ComponentEntityMonitorConfig;
  cfOrgSpace: CfOrgSpaceLabelService;

  public favorite: UserFavorite<IFavoriteMetadata>;

  constructor(
    private store: Store<CFAppState>,
    private appStateService: ApplicationStateService,
    private userFavoriteManager: UserFavoriteManager
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

    this.favorite = this.userFavoriteManager.getFavorite(this.row, applicationEntityType, CF_ENDPOINT_TYPE);

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

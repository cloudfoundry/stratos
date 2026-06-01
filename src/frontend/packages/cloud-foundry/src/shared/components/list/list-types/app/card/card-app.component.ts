import { CommonModule } from '@angular/common';
import { Component, Injector, OnInit, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { EndpointsSignalService } from '@stratosui/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { applicationEntityType } from '../../../../../../../../cloud-foundry/src/cf-entity-types';
import { ApplicationStateComponent } from '../../../../../../../../core/src/shared/components/application-state/application-state.component';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { MetaCardComponent } from '../../../../../../../../core/src/shared/components/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from '../../../../../../../../core/src/shared/components/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from '../../../../../../../../core/src/shared/components/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardTitleComponent } from '../../../../../../../../core/src/shared/components/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardValueComponent } from '../../../../../../../../core/src/shared/components/meta-card/meta-card-value/meta-card-value.component';
import { MultilineTitleComponent } from '../../../../../../../../core/src/shared/components/multiline-title/multiline-title.component';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { ComponentEntityMonitorConfig, StratosStatus } from '../../../../../../../../store/src/types/shared.types';
import { IFavoriteMetadata, UserFavorite } from '../../../../../../../../store/src/types/user-favorites.types';
import { UserFavoriteManager } from '../../../../../../../../store/src/user-favorite-manager';
import { IApp, ISpace } from '../../../../../../cf-api.types';
import { cfEntityFactory } from '../../../../../../cf-entity-factory';
import { CF_ENDPOINT_TYPE } from '../../../../../../cf-types';
import { AppStatsDataRegistry } from '../../../../../../services/endpoint-data/app-stats-data.registry';
import { CfCurrentUserRolesSignalService } from '../../../../../../user-permissions/cf-current-user-roles-signal.service';
import { ApplicationStateData, ApplicationStateService } from '../../../../../services/application-state.service';
import { CfOrgSpaceLabelService } from '../../../../../services/cf-org-space-label.service';
import { CfOrgSpaceLinksComponent } from '../../../../cf-org-space-links/cf-org-space-links.component';
import { RunningInstancesComponent } from '../../../../running-instances/running-instances.component';

@Component({
  selector: 'app-card-app',
  templateUrl: './card-app.component.html',
  styleUrls: ['./card-app.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    ApplicationStateComponent,
    RunningInstancesComponent,
    CfOrgSpaceLinksComponent
  ]
})
export class CardAppComponent extends CardCell<APIResource<IApp>> implements OnInit {
  private endpoints = inject(EndpointsSignalService);
  private cfRoles = inject(CfCurrentUserRolesSignalService);
  private appStateService = inject(ApplicationStateService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private statsRegistry = inject(AppStatsDataRegistry);
  private injector = inject(Injector);


  applicationState$!: Observable<ApplicationStateData>;

  appStatus$!: Observable<StratosStatus>;
  entityConfig!: ComponentEntityMonitorConfig;
  cfOrgSpace!: CfOrgSpaceLabelService;

  public favorite: UserFavorite<IFavoriteMetadata>;

  ngOnInit() {
    this.entityConfig = new ComponentEntityMonitorConfig(this.row.metadata.guid, cfEntityFactory(applicationEntityType));
    this.cfOrgSpace = new CfOrgSpaceLabelService(
      this.endpoints,
      this.cfRoles,
      this.row.entity.cfGuid,
      (this.row.entity.space as APIResource<ISpace>).entity.organization_guid,
      this.row.entity.space_guid
    );

    this.favorite = this.userFavoriteManager.getFavorite(this.row, applicationEntityType, CF_ENDPOINT_TYPE);

    const stats = this.statsRegistry.acquire(this.row.entity.cfGuid, this.row.metadata.guid);
    const stateSignal = computed(() => this.appStateService.get(this.row.entity, stats.stats()));
    this.applicationState$ = toObservable(stateSignal, { injector: this.injector });
    this.appStatus$ = this.applicationState$.pipe(map(state => state.indicator));
    stats.load().subscribe();
  }
}

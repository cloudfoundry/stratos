import { NgModule } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { cfEntityCatalog } from '../../cloud-foundry/src/cf-entity-catalog';
import { applicationEntityType, organizationEntityType, spaceEntityType } from '../../cloud-foundry/src/cf-entity-types';
import { createEntityRelationKey } from '../../cloud-foundry/src/entity-relations/entity-relations.types';
import { getGuids } from '../../cloud-foundry/src/features/applications/application/application-base.component';
import { CfCurrentUserPermissions } from '../../cloud-foundry/src/user-permissions/cf-user-permissions-checkers';
import { CurrentUserPermissionsService } from '../../core/src/core/permissions/current-user-permissions.service';
import { StratosTab, StratosTabType } from '../../core/src/public-api';
import { AppState } from '../../store/src/app-state';
import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { EntityServiceFactory } from '../../store/src/entity-service-factory.service';
import { isAutoscalerEnabled } from './core/autoscaler-helpers/autoscaler-available';
import { generateASEntities } from './store/autoscaler-entity-generator';
import { AutoscalerEffects } from './store/autoscaler.effects';

@StratosTab({
  type: StratosTabType.Application,
  label: 'Autoscale',
  link: 'autoscale',
  icon: 'meter',
  iconFont: 'stratos-icons',
  loadChildren: () => import('./cf-autoscaler-tab.module').then(m => m.CfAutoscalerTabModule),
  hidden: (store: Store<AppState>, esf: EntityServiceFactory, activatedRoute: ActivatedRoute, cups: CurrentUserPermissionsService) => {
    const endpointGuid = getGuids('cf')(activatedRoute) || window.location.pathname.split('/')[2];
    const appGuid = getGuids()(activatedRoute) || window.location.pathname.split('/')[3];
    const appEntService = cfEntityCatalog.application.store.getEntityService(appGuid, endpointGuid, {
      includeRelations: [
        createEntityRelationKey(applicationEntityType, spaceEntityType),
        createEntityRelationKey(spaceEntityType, organizationEntityType),
      ],
      populateMissing: true
    });

    const canEditApp$ = appEntService.waitForEntity$.pipe(
      switchMap(app => cups.can(
        CfCurrentUserPermissions.APPLICATION_EDIT,
        endpointGuid,
        app.entity.entity.space.entity.organization_guid,
        app.entity.entity.space.metadata.guid
      )),
    );

    const autoscalerEnabled = isAutoscalerEnabled(endpointGuid, esf);

    return canEditApp$.pipe(
      switchMap(canEditSpace => canEditSpace ? autoscalerEnabled : of(false)),
      map(can => !can)
    );
  }
})
@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateASEntities),
    EffectsModule.forFeature([
      AutoscalerEffects
    ]),
  ],
})
export class CfAutoscalerPackageModule { }


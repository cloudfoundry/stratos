import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

import { StratosTab, StratosTabType } from '../../core/src/public-api';
import { EntityCatalogModule } from '../../store/src/entity-catalog.module';
import { generateASEntities } from './store/autoscaler-entity-generator';
import { AutoscalerEffects } from './store/autoscaler.effects';

@StratosTab({
  type: StratosTabType.Application,
  label: 'Autoscale',
  link: 'autoscale',
  icon: 'meter',
  iconFont: 'stratos-icons',
  loadChildren: () => import('./cf-autoscaler-tab.module').then(m => m.CfAutoscalerTabModule),
  // hidden: (store: Store<AppState>, esf: EntityServiceFactory, activatedRoute: ActivatedRoute, cups: CurrentUserPermissionsService) => {
  //   const endpointGuid = getGuids('cf')(activatedRoute) || window.location.pathname.split('/')[2];
  //   const appGuid = getGuids()(activatedRoute) || window.location.pathname.split('/')[3];
  //   const appEntService = cfEntityCatalog.application.store.getEntityService(appGuid, endpointGuid, {
  //     includeRelations: [
  //       createEntityRelationKey(applicationEntityType, spaceEntityType),
  //       createEntityRelationKey(spaceEntityType, organizationEntityType),
  //     ],
  //     populateMissing: true
  //   });

  //   const canEditApp$ = appEntService.waitForEntity$.pipe(
  //     switchMap(app => cups.can(
  //       CfCurrentUserPermissions.APPLICATION_EDIT,
  //       endpointGuid,
  //       app.entity.entity.space.entity.organization_guid,
  //       app.entity.entity.space.metadata.guid
  //     )),
  //   );

  //   const autoscalerEnabled = isAutoscalerEnabled(endpointGuid, esf);

  //   return canEditApp$.pipe(
  //     switchMap(canEditSpace => canEditSpace ? autoscalerEnabled : of(false)),
  //     map(can => !can)
  //   );
  // }
})
@NgModule({
  imports: [
    EntityCatalogModule.forFeature(generateASEntities),
    EffectsModule.forFeature([
      AutoscalerEffects
    ]),
  ],
})
export class CfAutoscalerPackageModule { 

  constructor() {
    console.log('CfAutoscalerPackageModule');
  }
}


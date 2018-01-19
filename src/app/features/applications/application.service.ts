import { getPaginationObservables, PaginationObservables } from './../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { EntityService } from '../../core/entity-service';
import { cnsisEntitiesSelector } from '../../store/selectors/cnsis.selectors';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { ApplicationSchema } from '../../store/actions/application.actions';
import {
  GetApplication,
  UpdateApplication,
  UpdateExistingApplication,
} from '../../store/actions/application.actions';
import { AppState } from '../../store/app-state';
import {
  ApplicationEnvVarsService,
  EnvVarStratosProject
} from './application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import {
  ApplicationStateData,
  ApplicationStateService,
} from '../../shared/components/application-state/application-state.service';
import { EntityInfo, APIResource } from '../../store/types/api.types';
import { combineLatest } from 'rxjs/operators/combineLatest';
import {
  AppStats,
  AppSummarySchema,
  AppStatsSchema,
  AppEnvVarSchema,
  AppStat,
  AppEnvVarsState,
  AppSummary
} from '../../store/types/app-metadata.types';
import { EntityServiceFactory } from '../../core/entity-service-factory.service';
import { GetAppSummaryAction, GetAppStatsAction, GetAppEnvVarsAction } from '../../store/actions/app-metadata.actions';
import { PaginationEntityState, PaginationState } from '../../store/types/pagination.types';
import {
  defaultPaginationEntityState,
  defaultPaginationState,
} from '../../store/reducers/pagination-reducer/pagination.reducer';

export interface ApplicationData {
  fetching: boolean;
  app: EntityInfo;
  space: EntityInfo;
  organisation: EntityInfo;
  stack: EntityInfo;
  cf: any;
}

@Injectable()
export class ApplicationService {
  applicationInstanceState$: Observable<any>;

  private appEntityService: EntityService;
  private appSummaryEntityService: EntityService;

  constructor(
    public cfGuid: string,
    public appGuid: string,
    private store: Store<AppState>,
    private entityServiceFactory: EntityServiceFactory,
    private appStateService: ApplicationStateService,
    private appEnvVarsService: ApplicationEnvVarsService) {

    this.appEntityService = this.entityServiceFactory.create(
      ApplicationSchema.key,
      ApplicationSchema,
      appGuid,
      new GetApplication(appGuid, cfGuid));

    this.appSummaryEntityService = this.entityServiceFactory.create(
      AppSummarySchema.key,
      AppSummarySchema,
      appGuid,
      new GetAppSummaryAction(appGuid, cfGuid));

    this.constructCoreObservables();
    this.constructAmalgamatedObservables();
    this.constructStatusObservables();
  }

  // NJ: This needs to be cleaned up. So much going on!
  isFetchingApp$: Observable<boolean>;
  isUpdatingApp$: Observable<boolean>;

  isDeletingApp$: Observable<boolean>;

  isFetchingEnvVars$: Observable<boolean>;
  isUpdatingEnvVars$: Observable<boolean>;
  isFetchingStats$: Observable<boolean>;

  app$: Observable<EntityInfo>;
  waitForAppEntity$: Observable<EntityInfo>;
  appSummary$: Observable<EntityInfo<AppSummary>>;
  appStats$: Observable<APIResource<AppStat>[]>;
  private appStatsFetching$: Observable<PaginationEntityState>; // Use isFetchingStats$ which is properly gated
  appEnvVars: PaginationObservables<AppEnvVarsState>;

  application$: Observable<ApplicationData>;
  applicationStratProject$: Observable<EnvVarStratosProject>;
  applicationState$: Observable<ApplicationStateData>;

  private constructCoreObservables() {
    // First set up all the base observables
    this.app$ = this.appEntityService.entityObs$;

    this.isDeletingApp$ = this.appEntityService.isDeletingEntity$;

    this.waitForAppEntity$ = this.appEntityService.waitForEntity$;

    this.appSummary$ = this.waitForAppEntity$.mergeMap(() => this.appSummaryEntityService.entityObs$);

    this.appEnvVars = getPaginationObservables<AppEnvVarsState>({
      store: this.store,
      action: new GetAppEnvVarsAction(this.appGuid, this.cfGuid),
      schema: AppEnvVarSchema
    }, true);
  }

  private constructAmalgamatedObservables() {
    // Assign/Amalgamate them to public properties (with mangling if required)

    const appStats = getPaginationObservables<APIResource<AppStat>>({
      store: this.store,
      action: new GetAppStatsAction(this.appGuid, this.cfGuid),
      schema: AppStatsSchema
    }, true);

    this.appStats$ = this.waitForAppEntity$
      .filter(ai => ai && ai.entity && ai.entity.entity)
      .mergeMap(ai => {
        if (ai.entity.entity.state === 'STARTED') {
          return appStats.entities$;
        } else {
          return Observable.of(new Array<APIResource<AppStat>>());
        }
      });

    this.appStatsFetching$ = this.waitForAppEntity$
      .filter(ai => ai && ai.entity && ai.entity.entity)
      .mergeMap(ai => {
        if (ai.entity.entity.state === 'STARTED') {
          return appStats.pagination$;
        } else {
          return Observable.of(defaultPaginationEntityState);
        }
      });

    this.application$ = this.waitForAppEntity$
      .combineLatest(
      this.store.select(cnsisEntitiesSelector),
    )
      .filter(([{ entity, entityRequestInfo }, cnsis]: [EntityInfo, any]) => {
        return entity && entity.entity && entity.entity.cfGuid && entity.entity.space && entity.entity.space.entity.organization;
      })
      .map(([{ entity, entityRequestInfo }, cnsis]: [EntityInfo, any]): ApplicationData => {
        return {
          fetching: entityRequestInfo.fetching,
          app: entity,
          space: entity.entity.space,
          organisation: entity.entity.space.entity.organization,
          stack: entity.entity.stack,
          cf: cnsis[entity.entity.cfGuid],
        };
      });

    this.applicationState$ = this.waitForAppEntity$
      .combineLatest(this.appStats$)
      .map(([appInfo, appStatsArray]: [EntityInfo, APIResource<AppStat>[]]) => {
        return this.appStateService.get(appInfo.entity.entity, appStatsArray.map(apiResource => apiResource.entity));
      });

    this.applicationInstanceState$ = this.waitForAppEntity$
      .combineLatest(this.appStatsGated$)
      .map(([appInfo, appStats]: [EntityInfo, AppMetadataInfo]) => {
        return this.appStateService.getInstanceState(appInfo.entity.entity, appStats ? appStats.metadata : null);
    });

      this.applicationStratProject$ = this.appEnvVars.entities$.map(applicationEnvVars => {
      return this.appEnvVarsService.FetchStratosProject(applicationEnvVars[0]);
    });
  }

  private constructStatusObservables() {
    /**
     * An observable based on the core application entity
    */
    this.isFetchingApp$ = Observable.combineLatest(
      this.app$.map(ei => ei.entityRequestInfo.fetching),
      this.appSummary$.map(as => as.entityRequestInfo.fetching)
    )
      .map((fetching) => fetching[0] || fetching[1]);

    this.isUpdatingApp$ =
      this.app$.map(a => {
        const updatingSection = a.entityRequestInfo.updating[UpdateExistingApplication.updateKey] || {
          busy: false
        };
        return updatingSection.busy || false;
      });

    this.isFetchingEnvVars$ = this.appEnvVars.pagination$.map(ev => ev.fetching).startWith(false);

    this.isUpdatingEnvVars$ = this.appEnvVars.pagination$.map(ev => ev.fetching && ev.ids[ev.currentPage]).startWith(false);

    this.isFetchingStats$ = this.appStatsFetching$.map(appStats => appStats ? appStats.fetching : false).startWith(false);
  }

  isEntityComplete(value, requestInfo: { fetching: boolean }): boolean {
    if (requestInfo) {
      return !requestInfo.fetching;
    } else {
      return !!value;
    }
  }

  updateApplication(updatedApplication: UpdateApplication) {
    this.store.dispatch(new UpdateExistingApplication(
      this.appGuid,
      this.cfGuid,
      { ...updatedApplication }
    ));
  }

}

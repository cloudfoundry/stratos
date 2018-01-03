import { getPaginationObservables, PaginationObservables } from './../../store/reducers/pagination-reducer/pagination-reducer.helper';
import {
  EnvVarsSchema,
  GetAppEnvVarsAction,
  GetAppInstancesAction,
  GetAppSummaryAction,
} from './../../store/actions/app-metadata.actions';
import { EntityService } from '../../core/entity-service';
import { cnsisEntitiesSelector } from '../../store/selectors/cnsis.selectors';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import {
  AppMetadataProperties,
  getAppMetadataObservable,
} from '../../store/actions/app-metadata.actions';
import { ApplicationSchema } from '../../store/actions/application.actions';
import {
  GetApplication,
  UpdateApplication,
  UpdateExistingApplication,
} from '../../store/actions/application.actions';
import { AppState } from '../../store/app-state';

import { ApplicationEnvVarsService, EnvVarStratosProject } from './application/build-tab/application-env-vars.service';
import {
  ApplicationStateData,
  ApplicationStateService,
} from './application/build-tab/application-state/application-state.service';
import { EntityInfo } from '../../store/types/api.types';
import { AppMetadataRequestState, AppMetadataInfo, AppMetadataType, AppEnvVarsState } from '../../store/types/app-metadata.types';
import { combineLatest } from 'rxjs/operators/combineLatest';

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

  constructor(
    public cfGuid: string,
    public appGuid: string,
    private store: Store<AppState>,
    private entityService: EntityService,
    private appStateService: ApplicationStateService,
    private appEnvVarsService: ApplicationEnvVarsService) {
    this.constructCoreObservables();
    this.constructAmalgamatedObservables();
    this.constructStatusObservables();
  }

  // Subscribing to this will make the stats call. It's better to subscribe to appStatsGated$
  private appStats$: Observable<null | AppMetadataInfo>;

  // NJ: This needs to be cleaned up. So much going on!
  isFetchingApp$: Observable<boolean>;
  isUpdatingApp$: Observable<boolean>;

  isDeletingApp$: Observable<boolean>;

  isFetchingEnvVars$: Observable<boolean>;
  isUpdatingEnvVars$: Observable<boolean>;
  isFetchingStats$: Observable<boolean>;

  app$: Observable<EntityInfo>;
  waitForAppEntity$: Observable<EntityInfo>;
  appSummary$: Observable<AppMetadataInfo>;
  appStatsGated$: Observable<null | AppMetadataInfo>;
  appEnvVars: PaginationObservables<AppEnvVarsState>;

  application$: Observable<ApplicationData>;
  applicationStratProject$: Observable<EnvVarStratosProject>;
  applicationState$: Observable<ApplicationStateData>;

  private constructCoreObservables() {
    // First set up all the base observables
    this.app$ = this.entityService.entityObs$;

    this.isDeletingApp$ = this.entityService.isDeletingEntity$;

    this.waitForAppEntity$ = this.entityService.waitForEntity$;

    this.appSummary$ =
      this.waitForAppEntity$.mergeMap(() => getAppMetadataObservable(
        this.store,
        this.appGuid,
        new GetAppSummaryAction(this.appGuid, this.cfGuid)
      ));

    // Subscribing to this will make the stats call. It's better to subscribe to appStatsGated$
    this.appStats$ =
      this.waitForAppEntity$.take(1).mergeMap(() => getAppMetadataObservable(
        this.store,
        this.appGuid,
        new GetAppInstancesAction(this.appGuid, this.cfGuid)
      ));

    this.appEnvVars = getPaginationObservables<AppEnvVarsState>({
      store: this.store,
      action: new GetAppEnvVarsAction(this.appGuid, this.cfGuid),
      schema: EnvVarsSchema
    });
  }

  private constructAmalgamatedObservables() {
    // Assign/Amalgamate them to public properties (with mangling if required)

    this.appStatsGated$ = this.waitForAppEntity$
      .filter(ai => ai && ai.entity && ai.entity.entity)
      .mergeMap(ai => {
        if (ai.entity.entity.state === 'STARTED') {
          return this.appStats$;
        } else {
          return Observable.of(null);
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
      .combineLatest(this.appStatsGated$)
      .map(([appInfo, appStats]: [EntityInfo, AppMetadataInfo]) => {
        return this.appStateService.get(appInfo.entity.entity, appStats ? appStats.metadata : null);
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
      this.appSummary$.map(as => as.metadataRequestState.fetching.busy)
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

    this.isFetchingStats$ =
      this.appStatsGated$.map(appStats => appStats ? appStats.metadataRequestState.updating.busy : false).startWith(false);
  }

  isEntityComplete(value, requestInfo: { fetching: boolean }): boolean {
    if (requestInfo) {
      return !requestInfo.fetching;
    } else {
      return !!value;
    }
  }

  isMetadataComplete(value, requestInfo: AppMetadataRequestState): boolean {
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

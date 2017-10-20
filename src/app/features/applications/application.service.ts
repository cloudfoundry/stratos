import { cnsisEntitySelector } from '../../store/selectors/cnsis.selectors';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import { getEntityObservable } from '../../store/actions/api.actions';
import {
  AppMetadataProperties,
  GetAppMetadataAction,
  getAppMetadataObservable,
  selectMetadataRequest,
} from '../../store/actions/app-metadata.actions';
import { ApplicationSchema } from '../../store/actions/application.actions';
import {
  GetApplication,
  UpdateApplication,
  UpdateExistingApplication,
} from '../../store/actions/application.actions';
import { AppState } from '../../store/app-state';
import { ActionState, EntityRequestState } from '../../store/reducers/api-request-reducer';

import { ApplicationEnvVarsService, EnvVarStratosProject } from './application/summary-tab/application-env-vars.service';
import {
  ApplicationStateData,
  ApplicationStateService,
} from './application/summary-tab/application-state/application-state.service';
import { EntityInfo } from '../../store/types/api.types';
import { AppMetadataRequestState, AppMetadataInfo, AppMetadataType } from '../../store/types/app-metadata.types';

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

  constructor(private store: Store<AppState>, private appStateService: ApplicationStateService,
    private appEnvVarsService: ApplicationEnvVarsService) {
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
  appSummary$: Observable<AppMetadataInfo>;
  appStatsGated$: Observable<null | AppMetadataInfo>;
  appEnvVars$: Observable<AppMetadataInfo>;

  application$: Observable<ApplicationData>;
  applicationStratProject$: Observable<EnvVarStratosProject>;
  applicationState$: Observable<ApplicationStateData>;

  appGuid: string;
  cfGuid: string;

  IsEntityComplete(value, requestInfo: { fetching: boolean }): boolean {
    if (requestInfo) {
      return !requestInfo.fetching;
    } else {
      return !!value;
    }
  }

  IsMetadataComplete(value, requestInfo: AppMetadataRequestState): boolean {
    if (requestInfo) {
      return !requestInfo.fetching;
    } else {
      return !!value;
    }
  }

  SetApplication(cfGuid, appGuid) {
    this.appGuid = appGuid;
    this.cfGuid = cfGuid;

    // First set up all the base observables
    this.app$ = getEntityObservable(
      this.store,
      ApplicationSchema.key,
      ApplicationSchema,
      appGuid,
      new GetApplication(appGuid, cfGuid)
    );

    this.isDeletingApp$ = this.app$.map(a => a.entityRequestInfo.deleting.busy).startWith(false);

    this.waitForAppEntity$ = this.app$
      .filter((appInfo) => {
        return (
          !!appInfo.entity &&
          !appInfo.entityRequestInfo.deleting.busy &&
          !appInfo.entityRequestInfo.deleting.deleted &&
          !appInfo.entityRequestInfo.error
        );
      })
      .delay(1);

    this.appSummary$ =
      this.waitForAppEntity$.mergeMap(() => getAppMetadataObservable(
        this.store,
        appGuid,
        new GetAppMetadataAction(appGuid, cfGuid, AppMetadataProperties.SUMMARY as AppMetadataType)
      ));

    // Subscribing to this will make the stats call. It's better to subscribe to appStatsGated$
    const appStats$ =
      this.waitForAppEntity$.take(1).mergeMap(() => getAppMetadataObservable(
        this.store,
        appGuid,
        new GetAppMetadataAction(appGuid, cfGuid, AppMetadataProperties.INSTANCES as AppMetadataType)
      ));

    this.appEnvVars$ =
      this.waitForAppEntity$.take(1).mergeMap(() => getAppMetadataObservable(
        this.store,
        appGuid,
        new GetAppMetadataAction(appGuid, cfGuid, AppMetadataProperties.ENV_VARS as AppMetadataType)
      ));

    // Assign/Amalgamate them to public properties (with mangling if required)

    this.appStatsGated$ = this.waitForAppEntity$
      .filter(ai => ai && ai.entity && ai.entity.entity)
      .mergeMap(ai => {
        if (ai.entity.entity.state === 'STARTED') {
          return appStats$;
        } else {
          return Observable.of(null);
        }
      });

    this.application$ = this.waitForAppEntity$
      .combineLatest(
      this.store.select(cnsisEntitySelector),
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
          cf: cnsis.find((CNSIModel) => {
            return CNSIModel.guid === entity.entity.cfGuid;
          }),
        };
      });

    this.applicationState$ = this.waitForAppEntity$
      .combineLatest(this.appStatsGated$)
      .map(([appInfo, appStats]: [EntityInfo, AppMetadataInfo]) => {
        return this.appStateService.Get(appInfo.entity.entity, appStats ? appStats.metadata : null);
      });

    this.applicationStratProject$ = this.appEnvVars$.map(applicationEnvVars => {
      return this.appEnvVarsService.FetchStratosProject(applicationEnvVars.metadata);
    });


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

    this.isFetchingEnvVars$ = this.appEnvVars$.map(ev => ev.metadataRequestState.fetching.busy).startWith(false);

    this.isUpdatingEnvVars$ = this.appEnvVars$.map(ev => ev.metadataRequestState.updating.busy).startWith(false);

    this.isFetchingStats$ =
      this.appStatsGated$.map(appStats => appStats ? appStats.metadataRequestState.updating.busy : false).startWith(false);

  }

  UpdateApplication(updatedApplication: UpdateApplication) {
    this.store.dispatch(new UpdateExistingApplication(
      this.appGuid,
      this.cfGuid,
      { ...updatedApplication }
    ));
  }

  UpdateApplicationEvVars(updatedApplication: UpdateApplication) {
    this.store.dispatch(new UpdateExistingApplication(
      this.appGuid,
      this.cfGuid,
      { ...updatedApplication }
    ));
  }
}

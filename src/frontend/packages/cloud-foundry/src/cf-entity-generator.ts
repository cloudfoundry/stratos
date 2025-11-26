import type { Compiler, Injector } from '@angular/core';
import type { Action, Store } from '@ngrx/store';
import { combineLatest, type Observable, of } from 'rxjs';
import { first, map } from 'rxjs/operators';

import { BaseEndpointAuth, urlValidationExpression } from '@stratosui/core';
import {
  type ActionDispatcher,
  type APIResource,
  type AppState,
  EndpointHealthCheck,
  type EntityInfo,
  type EntitySchema,
  entityFetchedWithoutError,
  type GeneralEntityAppState,
  type ICFAction,
  type IFavoriteMetadata,
  type IStratosEntityDefinition,
  type JetstreamError,
  type JetstreamResponse,
  metricEntityType,
  type PaginatedAction,
  type PaginationEntityState,
  type RequestInfoState,
  selectSessionData,
  type StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
  type StratosEndpointExtensionDefinition
} from '@stratosui/store';
import { CfValidateEntitiesStart } from './actions/relations-actions';
import type {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
  IUserProvidedServiceInstance,
} from './cf-api-svc.types';
import type {
  CfEvent,
  IApp,
  IAppSummary,
  IBuildpack,
  ICfV2Info,
  IDomain,
  IFeatureFlag,
  IOrganization,
  IOrgQuotaDefinition,
  IPrivateDomain,
  IRoute,
  ISecurityGroup,
  ISpace,
  ISpaceQuotaDefinition,
  IStack,
} from './cf-api.types';
import { cfEntityCatalog } from './cf-entity-catalog';
import { cfEntityFactory } from './cf-entity-factory';
import {
  appEnvVarsEntityType,
  applicationEntityType,
  appStatsEntityType,
  appSummaryEntityType,
  buildpackEntityType,
  cfEventEntityType,
  cfInfoEntityType,
  cfUserEntityType,
  domainEntityType,
  featureFlagEntityType,
  organizationEntityType,
  privateDomainsEntityType,
  quotaDefinitionEntityType,
  routeEntityType,
  securityGroupEntityType,
  serviceBindingEntityType,
  serviceBindingNoBindingsEntityType,
  serviceBrokerEntityType,
  serviceEntityType,
  serviceInstancesEntityType,
  serviceInstancesWithNoBindingsEntityType,
  serviceInstancesWithSpaceEntityType,
  servicePlanEntityType,
  servicePlanVisibilityEntityType,
  spaceEntityType,
  spaceQuotaEntityType,
  spaceWithOrgEntityType,
  stackEntityType,
  userProvidedServiceInstanceEntityType,
} from './cf-entity-types';
import { type CfErrorResponse, getCfError } from './cf-error-helpers';
import type { ISpaceFavMetadata } from './cf-metadata-types';
import { CF_ENDPOINT_TYPE } from './cf-types';
import {
  type AppEnvVarActionBuilders,
  appEnvVarActionBuilders,
} from './entity-action-builders/application-env-var.action-builders';
import { type AppStatsActionBuilders, appStatsActionBuilders } from './entity-action-builders/application-stats.action-builders';
import {
  type AppSummaryActionBuilders,
  appSummaryActionBuilders,
} from './entity-action-builders/application-summary.action-builders';
import { applicationActionBuilder, type ApplicationActionBuilders } from './entity-action-builders/application.action-builders';
import { type BuildpackActionBuilders, buildpackActionBuilders } from './entity-action-builders/buildpack.action-builders';
import { type CfEventActionBuilders, cfEventActionBuilders } from './entity-action-builders/cf-event.action-builders';
import {
  type CfInfoDefinitionActionBuilders,
  cfInfoDefinitionActionBuilders,
} from './entity-action-builders/cf-info.action-builders';
import { type DomainActionBuilders, domainActionBuilders } from './entity-action-builders/domin.action-builder';
import { type FeatureFlagActionBuilders, featureFlagActionBuilders } from './entity-action-builders/feature-flag.action-builder';
import {
  type OrganizationActionBuilders,
  organizationActionBuilders,
} from './entity-action-builders/organization.action-builders';
import {
  type QuotaDefinitionActionBuilder,
  quotaDefinitionActionBuilder,
} from './entity-action-builders/quota-definition.action-builders';
import { type RoutesActionBuilders, routesActionBuilders } from './entity-action-builders/routes.action-builder';
import { type SecurityGroupBuilders, securityGroupBuilders } from './entity-action-builders/security-groups.action-builder';
import {
  type ServiceBindingActionBuilders,
  serviceBindingActionBuilders,
} from './entity-action-builders/service-binding.action-builders';
import {
  type ServiceBrokerActionBuilders,
  serviceBrokerActionBuilders,
} from './entity-action-builders/service-broker.entity-builders';
import {
  type ServiceInstanceActionBuilders,
  serviceInstanceActionBuilders,
} from './entity-action-builders/service-instance.action.builders';
import {
  type ServicePlanVisibilityActionBuilders,
  servicePlanVisibilityActionBuilders,
} from './entity-action-builders/service-plan-visibility.action-builders';
import { type ServicePlanActionBuilders, servicePlanActionBuilders } from './entity-action-builders/service-plan.action-builders';
import { type ServiceActionBuilders, serviceActionBuilders } from './entity-action-builders/service.entity-builders';
import {
  type SpaceQuotaDefinitionActionBuilders,
  spaceQuotaDefinitionActionBuilders,
} from './entity-action-builders/space-quota.action-builders';
import { type SpaceActionBuilders, spaceActionBuilders } from './entity-action-builders/space.action-builders';
import { type StackActionBuilders, stackActionBuilders } from './entity-action-builders/stack-action-builders';
import {
  type UserProvidedServiceActionBuilder,
  userProvidedServiceActionBuilder,
} from './entity-action-builders/user-provided-service.action-builders';
import { type UserActionBuilders, userActionBuilders } from './entity-action-builders/user.action-builders';
import { addCfQParams, addCfRelationParams } from './entity-relations/cf-entity-relations.getters';
import { populatePaginationFromParent } from './entity-relations/entity-relations';
import { isEntityInlineParentAction } from './entity-relations/entity-relations.types';
import { CfEndpointDetailsComponent } from './shared/components/cf-endpoint-details/cf-endpoint-details.component';
import { updateApplicationRoutesReducer } from './store/reducers/application-route.reducer';
import { cfUserReducer, endpointDisconnectUserReducer, userSpaceOrgReducer } from './store/reducers/cf-users.reducer';
import { currentCfUserRolesReducer } from './store/reducers/current-cf-user-roles-reducer/current-cf-user-roles.reducer';
import { endpointDisconnectRemoveEntitiesReducer } from './store/reducers/endpoint-disconnect-application.reducer';
import { updateOrganizationQuotaReducer } from './store/reducers/organization-quota.reducer';
import { updateOrganizationSpaceReducer } from './store/reducers/organization-space.reducer';
import { routeReducer, updateAppSummaryRoutesReducer } from './store/reducers/routes.reducer';
import { serviceInstanceReducer } from './store/reducers/service-instance.reducer';
import { updateSpaceQuotaReducer } from './store/reducers/space-quota.reducer';
import type { AppEnvVarsState, AppStat } from './store/types/app-metadata.types';
import type { CfAPIResource, CFResponse } from './store/types/cf-api.types';
import type { CfUser } from './store/types/cf-user.types';
import { cfUserRolesFetch } from './user-permissions/cf-user-roles-fetch';

function safePopulatePaginationFromParent(store: Store, action: PaginatedAction): Observable<Action> {
  const result$ = populatePaginationFromParent(store, action);
  // Guard against null/undefined Observable from populatePaginationFromParent
  if (!result$) {
    return of(action);
  }
  return result$.pipe(
    map(newAction => newAction || action)
  );
}

function getPaginationCompareString(paginationEntity: PaginationEntityState) {
  if (!paginationEntity) {
    return '';
  }
  let params = '';
  if (paginationEntity.params) {
    params = JSON.stringify(paginationEntity.params);
  }
  // paginationEntity.totalResults included to ensure we cover the 'ResetPagination' case, for instance after AddParam
  return paginationEntity.totalResults + paginationEntity.currentPage + params + paginationEntity.pageCount;
}

function shouldValidate(action: ICFAction, isValidated: boolean, entityInfo: RequestInfoState) {
  // Validate if..
  // 1) The action is the correct type
  const parentAction = isEntityInlineParentAction(action);
  if (!parentAction) {
    return false;
  }
  // 2) We have basic request info
  // 3) The action states it should not be skipped
  // 4) It's already been validated
  // 5) There are actual relations to validate
  if (!entityInfo || action.skipValidation || isValidated || parentAction.includeRelations.length === 0) {
    return false;
  }
  // 6) The entity isn't in the process of being updated
  return !entityInfo.fetching &&
    !entityInfo.error &&
    !entityInfo.deleting?.busy &&
    !entityInfo.deleting?.deleted &&
    // This is required to ensure that we don't continue trying to fetch missing relations when we're already fetching missing relations
    !(entityInfo.updating && Object.keys(entityInfo.updating).find(key => entityInfo.updating[key]?.busy));
}

export interface CFBasePipelineRequestActionMeta {
  /**
   * Define a set of children that a cf entity should have, for instance organisation --> space, application --> space --> organisation
   */
  includeRelations?: string[];
  /**
   * If relations, as described in `includeRelations` are missing, should they be fetched?
   */
  populateMissing?: boolean;
  /**
   * Only applicable to collections
   */
  flatten?: boolean;
}

function cfShortcuts(id: string) {
  return [
    {
      title: 'View Organizations',
      link: ['/cloud-foundry', id, 'organizations'],
      icon: 'organization',
      iconFont: 'stratos-icons'
    },
    {
      title: 'View Applications',
      link: ['/applications', id],
      icon: 'apps'
    },
    {
      title: 'Deploy an Application',
      link: ['/applications', 'new', id],
      icon: 'publish'
    },
    {
      title: 'View Cloud Foundry Info',
      link: ['/cloud-foundry', id],
      icon: 'cloud_foundry',
      iconFont: 'stratos-icons'
    },
  ];
}

export function generateCFEntities(): StratosBaseCatalogEntity[] {
  const endpointDefinition: StratosEndpointExtensionDefinition = {
    urlValidationRegexString: urlValidationExpression,
    type: CF_ENDPOINT_TYPE,
    label: 'Cloud Foundry',
    labelPlural: 'Cloud Foundry',
    icon: 'cloud_foundry',
    iconFont: 'stratos-icons',
    logoUrl: '/core/assets/endpoint-icons/cloudfoundry.png',
    authTypes: [BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.SSO],
    homeCard: {
      component: (compiler: Compiler, injector: Injector) => import('./features/home/cfhome-card/cfhome-card.module').then(m => {
        return compiler.compileModuleAndAllComponentsAsync(m.CFHomeCardModule).then(cm => {
          const mod = cm.ngModuleFactory.create(injector);
          return mod.instance.createHomeCard(mod.componentFactoryResolver);
        });
      }),
      shortcuts: cfShortcuts,
      fullView: false,
    },
    listDetailsComponent: CfEndpointDetailsComponent,
    renderPriority: 1,
    healthCheck: new EndpointHealthCheck(CF_ENDPOINT_TYPE, (endpoint) => cfEntityCatalog.cfInfo.api.get(endpoint.guid)),
    getEndpointIdFromEntity: (entity: CfAPIResource) => entity.entity.cfGuid,
    globalPreRequest: (request, action) => {
      return addCfRelationParams(request, action);
    },
    globalPrePaginationRequest: (request, action, catalogEntity, appState) => {
      const rWithRelations = addCfRelationParams(request, action);
      return addCfQParams(rWithRelations, action, catalogEntity, appState);
    },
    globalSuccessfulRequestDataMapper: (data, endpointGuid, guid) => {
      if (data && typeof data === 'object') {
        const dataObj = data as Record<string, unknown>;
        if ('entity' in dataObj && dataObj.entity && typeof dataObj.entity === 'object') {
          const entity = dataObj.entity as Record<string, unknown>;
          entity.cfGuid = endpointGuid;
          entity.guid = guid;
        } else {
          dataObj.cfGuid = endpointGuid;
          dataObj.guid = guid;
        }
      }
      return data;
    },
    globalErrorMessageHandler: (errors: JetstreamError<CfErrorResponse>[]) => {
      if (!errors || errors.length === 0) {
        return 'No errors in response';
      }

      if (errors.length === 1) {
        return getCfError(errors[0].jetstreamErrorResponse);
      }

      return errors.reduce((message, error) => {
        message += `\n${getCfError(error.jetstreamErrorResponse)}`;
        return message;
      }, 'Multiple Cloud Foundry Errors. ');
    },
    entityEmitHandler: (action: ICFAction, dispatcher: ActionDispatcher) => {
      let validated = false;
      return (entityInfo: EntityInfo) => {
        if (!entityInfo || entityInfo.entity) {
          if (shouldValidate(action, validated, entityInfo.entityRequestInfo)) {
            validated = true;
            dispatcher(new CfValidateEntitiesStart(
              action,
              [action.guid]
            ));
          }
        }
      };
    },
    entitiesEmitHandler: (action: PaginatedAction | PaginatedAction[], dispatcher: ActionDispatcher) => {
      let lastValidationFootprint: string;
      const actionsArray = Array.isArray(action) ? action : [action];
      return (state: PaginationEntityState) => {
        const newValidationFootprint = getPaginationCompareString(state);
        if (lastValidationFootprint !== newValidationFootprint) {
          lastValidationFootprint = newValidationFootprint;
          actionsArray.forEach(actionFromArray => {
            dispatcher(new CfValidateEntitiesStart(
              actionFromArray,
              (state.ids as Record<number, string[]>)[actionFromArray.__forcedPageNumber__ || state.currentPage]
            ));
          });
        }
      };
    },
    entitiesFetchHandler: (store: Store, actions: PaginatedAction[]) => () => {
      combineLatest(actions.map(action => safePopulatePaginationFromParent(store, action))).pipe(
        first(),
      ).subscribe(newActions => newActions?.forEach(newAction => {
        if (newAction) {
          store.dispatch(newAction);
        }
      }));
    },
    paginationConfig: {
      getEntitiesFromResponse: (response: CFResponse) => response.resources,
      getTotalPages: (responseWithPages: JetstreamResponse<CFResponse | CFResponse[]>) =>
        // Input is keyed per endpoint. Value per endpoint can either be a response or a number of responses (one per page)
        Object.values(responseWithPages).reduce((max, response: CFResponse | CFResponse[]) => {
          const resp = Array.isArray(response) ? response[0] : response;
          return max > resp.total_pages ? max : resp.total_pages;
        }, 0),
      getTotalEntities: (responseWithPages: JetstreamResponse<CFResponse | CFResponse[]>) =>
        Object.values(responseWithPages).reduce((all, response: CFResponse | CFResponse[]) => {
          const resp = Array.isArray(response) ? response[0] : response;
          return all + resp.total_results;
        }, 0),
      getPaginationParameters: (page: number) => ({ page: `${page}` }),
      canIgnoreMaxedState: (store: Store) => {
        // Does entity type support? Yes
        // Does BE support ignore?
        return store.select(selectSessionData()).pipe(
          map(sessionData => !!sessionData.config.listAllowLoadMaxed)
        );
      },
      maxedStateStartAt: (store: Store, action: PaginatedAction) => {
        // Disable via the action?
        // Only allowed maxed process if enabled by action. This will be removed via #4204
        if (!action.flattenPaginationMax) {
          return of(null);
        }

        // Maxed Count from Backend?
        const beValue$ = store.select(selectSessionData()).pipe(
          map(sessionData => sessionData.config.listMaxSize)
        );

        // TODO: See #4205
        // Maxed count as per user config
        const userOverride$ = of(null);
        // const userOverride$ = store.select(selectSessionData()).pipe(
        //   // Check that the user is allowed to load all, if so they can set their own max number
        //   map(sessionData => !!sessionData.config.listAllowLoadMaxed ? null : null)
        // );

        // Maxed count from entity type
        const entityTypeDefault = 600;

        // Choose in order of priority
        return combineLatest([
          beValue$,
          userOverride$
        ]).pipe(
          map(([beValue, userOverride]) => userOverride || beValue || entityTypeDefault)
        );
      },
    },
    userRolesFetch: cfUserRolesFetch,
    userRolesReducer: currentCfUserRolesReducer
  };
  return [
    generateCfEndpointEntity(endpointDefinition),
    generateCfApplicationEntity(endpointDefinition),
    generateCfSpaceEntity(endpointDefinition),
    generateCfOrgEntity(endpointDefinition),
    generateFeatureFlagEntity(endpointDefinition),
    generateStackEntity(endpointDefinition),
    generateRouteEntity(endpointDefinition),
    generateEventEntity(endpointDefinition),
    generateCFDomainEntity(endpointDefinition),
    generateCFUserEntity(endpointDefinition),
    generateCFServiceInstanceEntity(endpointDefinition),
    generateCFServicePlanEntity(endpointDefinition),
    generateCFServiceEntity(endpointDefinition),
    generateCFServiceBindingEntity(endpointDefinition),
    generateCFSecurityGroupEntity(endpointDefinition),
    generateCFServicePlanVisibilityEntity(endpointDefinition),
    generateCFServiceBrokerEntity(endpointDefinition),
    generateCFBuildPackEntity(endpointDefinition),
    generateCFAppStatsEntity(endpointDefinition),
    generateCFUserProvidedServiceInstanceEntity(endpointDefinition),
    generateCFInfoEntity(endpointDefinition),
    generateCFPrivateDomainEntity(endpointDefinition),
    generateCFSpaceQuotaEntity(endpointDefinition),
    generateCFAppSummaryEntity(endpointDefinition),
    generateCFAppEnvVarEntity(endpointDefinition),
    generateCFQuotaDefinitionEntity(endpointDefinition),
    generateCFMetrics(endpointDefinition)
  ];
}

function generateCFQuotaDefinitionEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: quotaDefinitionEntityType,
    schema: cfEntityFactory(quotaDefinitionEntityType),
    endpoint: endpointDefinition,
    label: 'Organization Quota',
    labelPlural: 'Organization Quotas',
  };
  cfEntityCatalog.quotaDefinition = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IOrgQuotaDefinition>,
    QuotaDefinitionActionBuilder,
    QuotaDefinitionActionBuilder
  >(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: quotaDefinitionActionBuilder
  });
  return cfEntityCatalog.quotaDefinition;
}

function generateCFAppEnvVarEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition<EntitySchema, APIResource<AppEnvVarsState>, AppEnvVarsState> = {
    type: appEnvVarsEntityType,
    schema: cfEntityFactory(appEnvVarsEntityType),
    endpoint: endpointDefinition,
    paginationConfig: {
      getEntitiesFromResponse: (response: unknown) => Array.isArray(response) ? response : [response],
      getTotalPages: (responses: JetstreamResponse<CFResponse>) => Object.values(responses).length,
      getTotalEntities: (_responses: JetstreamResponse<CFResponse>) => 1,
      getPaginationParameters: (_page: number) => ({ page: '1' }),
      canIgnoreMaxedState: () => of(false),
      maxedStateStartAt: () => of(null),
    },
    successfulRequestDataMapper: (data, endpointGuid, _guid, _entityType, _endpointType, action) => {
      return {
        entity: {
          ...(data || {}),
          cfGuid: endpointGuid
        },
        metadata: {
          guid: action.guid,
          created_at: '',
          updated_at: '',
          url: ''
        }
      };
    },
    label: 'App Env Var',
    labelPlural: 'App Env Vars',
  };
  cfEntityCatalog.appEnvVar = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource,
    AppEnvVarActionBuilders,
    AppEnvVarActionBuilders
  >(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: appEnvVarActionBuilders,
    entityBuilder: {
      getMetadata: ent => ({
        name: `Application environment variables (${ent.metadata.guid}).`,
      }),
      getGuid: entity => entity.metadata.guid
    },
  });
  return cfEntityCatalog.appEnvVar;
}

function generateCFAppSummaryEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: appSummaryEntityType,
    schema: cfEntityFactory(appSummaryEntityType),
    endpoint: endpointDefinition,
    label: 'App Summary',
    labelPlural: 'App Summaries',
  };
  cfEntityCatalog.appSummary = new StratosCatalogEntity<IFavoriteMetadata, IAppSummary, AppSummaryActionBuilders, AppSummaryActionBuilders>(definition, {
    dataReducers: [
      updateAppSummaryRoutesReducer,
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: appSummaryActionBuilders,
    entityBuilder: {
      getMetadata: ent => ({
        name: ent.name,
      }),
      getGuid: entity => entity.guid,
    }
  });
  return cfEntityCatalog.appSummary;
}

function generateCFSpaceQuotaEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: spaceQuotaEntityType,
    schema: cfEntityFactory(spaceQuotaEntityType),
    endpoint: endpointDefinition,
    label: 'Space Quota',
    labelPlural: 'Space Quotas',
  };
  cfEntityCatalog.spaceQuota = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<ISpaceQuotaDefinition>,
    SpaceQuotaDefinitionActionBuilders,
    SpaceQuotaDefinitionActionBuilders>(definition, {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: spaceQuotaDefinitionActionBuilders
    });
  return cfEntityCatalog.spaceQuota;
}

function generateCFPrivateDomainEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: privateDomainsEntityType,
    schema: cfEntityFactory(privateDomainsEntityType),
    endpoint: endpointDefinition,
    label: 'Private Domain',
    labelPlural: 'Private Domains',
  };
  cfEntityCatalog.privateDomain = new StratosCatalogEntity<IFavoriteMetadata, APIResource<IPrivateDomain>>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
  });
  return cfEntityCatalog.privateDomain;
}

function generateCFInfoEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const cfInfoDefinition: IStratosEntityDefinition = {
    type: cfInfoEntityType,
    schema: cfEntityFactory(cfInfoEntityType),
    label: 'Cloud Foundry Info',
    labelPlural: 'Cloud Foundry Infos',
    endpoint: endpointDefinition
  };
  cfEntityCatalog.cfInfo = new StratosCatalogEntity<IFavoriteMetadata, APIResource<ICfV2Info>, CfInfoDefinitionActionBuilders, CfInfoDefinitionActionBuilders>(
    cfInfoDefinition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: cfInfoDefinitionActionBuilders,
      entityBuilder: {
        getMetadata: info => ({
          name: info.entity.name,
        }),
        getGuid: entity => entity.metadata.guid
      }
    }
  );
  return cfEntityCatalog.cfInfo;
}

function generateCFUserProvidedServiceInstanceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: userProvidedServiceInstanceEntityType,
    schema: cfEntityFactory(userProvidedServiceInstanceEntityType),
    label: 'User Provided Service Instance',
    labelPlural: 'User Provided Service Instances',
    endpoint: endpointDefinition,
  };
  cfEntityCatalog.userProvidedService = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IUserProvidedServiceInstance>,
    UserProvidedServiceActionBuilder,
    UserProvidedServiceActionBuilder
  >(
    definition,
    {
      actionBuilders: userProvidedServiceActionBuilder,
      dataReducers: [
        serviceInstanceReducer,
        endpointDisconnectRemoveEntitiesReducer()
      ],
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.name,
        }),
        getGuid: entity => entity.metadata.guid
      },
    }
  );
  return cfEntityCatalog.userProvidedService;
}

function generateCFAppStatsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition<EntitySchema, AppStat> = {
    type: appStatsEntityType,
    schema: cfEntityFactory(appStatsEntityType),
    endpoint: endpointDefinition,
    paginationConfig: {
      getEntitiesFromResponse: (response) => {
        const responseTyped = response as Record<string, Record<string, unknown>>;
        return Object.keys(responseTyped).map(key => {
          const stat = responseTyped[key];
          stat.guid = key;
          return stat;
        });
      },
      getTotalPages: (responses: JetstreamResponse) => Object.values(responses).length,
      getTotalEntities: (responses: JetstreamResponse): number => Object.values(responses).reduce<number>((count, response) => {
        return count + Object.keys(response as Record<string, unknown>).length;
      }, 0),
      getPaginationParameters: (page: number) => ({ page: `${page}` }),
      canIgnoreMaxedState: () => of(false),
      maxedStateStartAt: () => of(null),
    },
    successfulRequestDataMapper: (data, endpointGuid, guid, _entityType, _endpointType, action) => {
      if (data) {
        return {
          ...data,
          cfGuid: endpointGuid,
          guid: `${action.guid}-${guid}`
        };
      }
      return data;
    },
  };
  cfEntityCatalog.appStats = new StratosCatalogEntity<IFavoriteMetadata, AppStat, AppStatsActionBuilders, AppStatsActionBuilders>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: appStatsActionBuilders,
    entityBuilder: {
      getMetadata: ent => ({
        name: ent.guid,
      }),
      getGuid: entity => entity.guid
    }
  });
  return cfEntityCatalog.appStats;
}

function generateCFBuildPackEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: buildpackEntityType,
    schema: cfEntityFactory(buildpackEntityType),
    endpoint: endpointDefinition
  };
  cfEntityCatalog.buildPack = new StratosCatalogEntity<IFavoriteMetadata, APIResource<IBuildpack>, BuildpackActionBuilders, BuildpackActionBuilders>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: buildpackActionBuilders
  });
  return cfEntityCatalog.buildPack;
}

function generateCFServiceBrokerEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: serviceBrokerEntityType,
    schema: cfEntityFactory(serviceBrokerEntityType),
    endpoint: endpointDefinition
  };
  cfEntityCatalog.serviceBroker = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServiceBroker>,
    ServiceBrokerActionBuilders,
    ServiceBrokerActionBuilders>(definition, {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: serviceBrokerActionBuilders
    });
  return cfEntityCatalog.serviceBroker;
}

function generateCFServicePlanVisibilityEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: servicePlanVisibilityEntityType,
    schema: cfEntityFactory(servicePlanVisibilityEntityType),
    endpoint: endpointDefinition
  };
  cfEntityCatalog.servicePlanVisibility = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServicePlanVisibility>,
    ServicePlanVisibilityActionBuilders,
    ServicePlanVisibilityActionBuilders
  >(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: servicePlanVisibilityActionBuilders
  });
  return cfEntityCatalog.servicePlanVisibility;
}

function generateCFSecurityGroupEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: securityGroupEntityType,
    schema: cfEntityFactory(securityGroupEntityType),
    label: 'Security Group',
    labelPlural: 'Security Groups',
    endpoint: endpointDefinition
  };
  cfEntityCatalog.securityGroup = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<ISecurityGroup>,
    SecurityGroupBuilders,
    SecurityGroupBuilders>(definition, {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: securityGroupBuilders
    });
  return cfEntityCatalog.securityGroup;
}

function generateCFServiceBindingEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: serviceBindingEntityType,
    schema: {
      default: cfEntityFactory(serviceBindingEntityType),
      [serviceBindingNoBindingsEntityType]: cfEntityFactory(serviceBindingNoBindingsEntityType)
    },
    label: 'Service Binding',
    labelPlural: 'Service Bindings',
    endpoint: endpointDefinition
  };
  cfEntityCatalog.serviceBinding = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServiceBinding>,
    ServiceBindingActionBuilders,
    ServiceBindingActionBuilders
  >(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: serviceBindingActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.metadata.guid,
        }),
        getGuid: entity => entity.metadata.guid
      }
    }
  );
  return cfEntityCatalog.serviceBinding;
}

function generateCFServiceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: serviceEntityType,
    schema: cfEntityFactory(serviceEntityType),
    label: 'Service',
    labelPlural: 'Services',
    endpoint: endpointDefinition
  };
  cfEntityCatalog.service = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IService>,
    ServiceActionBuilders,
    ServiceActionBuilders
  >(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: serviceActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.label,
        }),
        getGuid: entity => entity.metadata.guid
      },
    }
  );
  return cfEntityCatalog.service;
}

function generateCFServicePlanEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: servicePlanEntityType,
    schema: cfEntityFactory(servicePlanEntityType),
    label: 'Service Plan',
    labelPlural: 'Service Plans',
    endpoint: endpointDefinition
  };
  cfEntityCatalog.servicePlan = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServicePlan>,
    ServicePlanActionBuilders,
    ServicePlanActionBuilders
  >(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: servicePlanActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.name,
        }),
        getGuid: entity => entity.metadata.guid
      }
    }
  );
  return cfEntityCatalog.servicePlan;
}

function generateCFServiceInstanceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: serviceInstancesEntityType,
    schema: {
      default: cfEntityFactory(serviceInstancesEntityType),
      [serviceInstancesWithSpaceEntityType]: cfEntityFactory(serviceInstancesWithSpaceEntityType),
      [serviceInstancesWithNoBindingsEntityType]: cfEntityFactory(serviceInstancesWithNoBindingsEntityType),
    },
    label: 'Marketplace Service Instance',
    labelPlural: 'Marketplace Service Instances',
    endpoint: endpointDefinition,
  };
  cfEntityCatalog.serviceInstance = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServiceInstance>,
    ServiceInstanceActionBuilders,
    ServiceInstanceActionBuilders
  >(
    definition,
    {
      dataReducers: [
        serviceInstanceReducer,
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: serviceInstanceActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.name,
        }),
        getGuid: entity => entity.metadata.guid
      }
    }
  );
  return cfEntityCatalog.serviceInstance;
}

function generateCFUserEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: cfUserEntityType,
    schema: cfEntityFactory(cfUserEntityType),
    label: 'User',
    labelPlural: 'Users',
    endpoint: endpointDefinition,
  };
  cfEntityCatalog.user = new StratosCatalogEntity<IFavoriteMetadata, APIResource<CfUser>, UserActionBuilders, UserActionBuilders>(
    definition,
    {
      actionBuilders: userActionBuilders,
      dataReducers: [cfUserReducer, endpointDisconnectUserReducer],
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.username || ent.entity.guid || ent.metadata.guid,
        }),
        getGuid: entity => entity.metadata.guid
      }
    }
  );
  return cfEntityCatalog.user;
}

function generateCFDomainEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: domainEntityType,
    schema: cfEntityFactory(domainEntityType),
    label: 'Domain',
    labelPlural: 'Domains',
    endpoint: endpointDefinition
  };
  cfEntityCatalog.domain = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IDomain>,
    DomainActionBuilders,
    DomainActionBuilders
  >(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: domainActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.name,
        }),
        getGuid: entity => entity.metadata.guid
      }
    }
  );
  return cfEntityCatalog.domain;
}



function generateEventEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: cfEventEntityType,
    schema: cfEntityFactory(cfEventEntityType),
    label: 'Event',
    labelPlural: 'Events',
    endpoint: endpointDefinition
  };
  cfEntityCatalog.event = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<CfEvent>,
    CfEventActionBuilders,
    CfEventActionBuilders>(
      definition,
      {
        dataReducers: [
          endpointDisconnectRemoveEntitiesReducer()
        ],
        actionBuilders: cfEventActionBuilders,
        entityBuilder: {
          getMetadata: event => {
            return {
              name: event.metadata.guid,
            };
          },
          getGuid: entity => entity.metadata.guid
        }
      }
    );
  return cfEntityCatalog.event;
}

function generateRouteEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: routeEntityType,
    schema: cfEntityFactory(routeEntityType),
    label: 'Application Route',
    labelPlural: 'Application Routes',
    endpoint: endpointDefinition
  };
  cfEntityCatalog.route = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IRoute>,
    RoutesActionBuilders,
    RoutesActionBuilders
  >(
    definition,
    {
      actionBuilders: routesActionBuilders,
      dataReducers: [
        routeReducer,
        endpointDisconnectRemoveEntitiesReducer()
      ],
      entityBuilder: {
        getMetadata: app => ({
          name: app.entity.domain_url,
        }),
        getGuid: entity => entity.metadata.guid
      }
    }
  );
  return cfEntityCatalog.route;
}

function generateStackEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: stackEntityType,
    schema: cfEntityFactory(stackEntityType),
    label: 'Stack',
    labelPlural: 'Stacks',
    endpoint: endpointDefinition
  };
  cfEntityCatalog.stack = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IStack>,
    StackActionBuilders,
    StackActionBuilders
  >(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: stackActionBuilders,
      entityBuilder: {
        getMetadata: app => ({
          name: app.entity.name,
        }),
        getGuid: entity => entity.metadata.guid
      }
    }
  );
  return cfEntityCatalog.stack;
}

function generateFeatureFlagEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const featureFlagDefinition: IStratosEntityDefinition = {
    type: featureFlagEntityType,
    schema: cfEntityFactory(featureFlagEntityType),
    label: 'Feature Flag',
    labelPlural: 'Feature Flags',
    endpoint: endpointDefinition,
    successfulRequestDataMapper: (
      response,
      endpointGuid
    ) => {
      const resp = response as { name: string };
      return {
        ...response as Record<string, unknown>,
        guid: `${endpointGuid}-${resp.name}`
      };
    },
    paginationConfig: {
      getEntitiesFromResponse: (response: unknown) => {
        return Array.isArray(response) ? response : [response];
      },
      getTotalPages: (_responses: JetstreamResponse) => 1,
      getTotalEntities: (responses: JetstreamResponse) => Array.isArray(responses) ? responses.length : Object.keys(responses).length,
      getPaginationParameters: (page: number) => ({ page: `${page}` }),
      canIgnoreMaxedState: () => of(false),
      maxedStateStartAt: () => of(null),
    }
  };
  cfEntityCatalog.featureFlag = new StratosCatalogEntity<
    IFavoriteMetadata,
    IFeatureFlag,
    FeatureFlagActionBuilders,
    FeatureFlagActionBuilders>(
      featureFlagDefinition,
      {
        dataReducers: [
          endpointDisconnectRemoveEntitiesReducer()
        ],
        actionBuilders: featureFlagActionBuilders,
        entityBuilder: {
          getMetadata: (ff: IFeatureFlag) => ({
            name: ff.name,
          }),
          getGuid: (entity: IFeatureFlag) => entity.guid,
        }
      }
    );
  return cfEntityCatalog.featureFlag;
}

function generateCfEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  cfEntityCatalog.cfEndpoint = new StratosCatalogEndpointEntity(
    endpointDefinition,
    favorite => `/cloud-foundry/${favorite.endpointId}`
  );
  return cfEntityCatalog.cfEndpoint;
}

function generateCfApplicationEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const applicationDefinition: IStratosEntityDefinition<EntitySchema, APIResource<IApp>> = {
    type: applicationEntityType,
    schema: cfEntityFactory(applicationEntityType),
    label: 'Application',
    labelPlural: 'Applications',
    endpoint: endpointDefinition,
    icon: 'apps',
    tableConfig: {
      rowBuilders: [
        ['Name', (entity: APIResource<IApp>) => entity.entity.name],
        ['Created', (entity: APIResource<IApp>) => entity.metadata.created_at]
      ]
    }
  };

  cfEntityCatalog.application = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IApp>,
    ApplicationActionBuilders,
    ApplicationActionBuilders
  >(
    applicationDefinition,
    {
      dataReducers: [
        updateApplicationRoutesReducer(),
        endpointDisconnectRemoveEntitiesReducer()
      ],
      entityBuilder: {
        getMetadata: (app: APIResource<IApp>) => ({
          name: app.entity.name,
        }),
        getLink: favorite => `/applications/${favorite.endpointId}/${favorite.entityId}/summary`,
        getGuid: entity => entity.metadata.guid,
        getIsValid: (fav) => cfEntityCatalog.application.api.get(fav.entityId, fav.endpointId, {}).pipe(
          entityFetchedWithoutError<RequestInfoState>()
        )
      },
      actionBuilders: applicationActionBuilder
    },
  );
  return cfEntityCatalog.application;
}

function generateCfSpaceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const spaceDefinition: IStratosEntityDefinition = {
    type: spaceEntityType,
    schema: {
      default: cfEntityFactory(spaceEntityType),
      [spaceWithOrgEntityType]: cfEntityFactory(spaceWithOrgEntityType)
    },
    label: 'Space',
    labelPlural: 'Spaces',
    endpoint: endpointDefinition,
    icon: 'virtual_space',
    iconFont: 'stratos-icons'
  };
  cfEntityCatalog.space = new StratosCatalogEntity<ISpaceFavMetadata, APIResource<ISpace>, SpaceActionBuilders, SpaceActionBuilders>(
    spaceDefinition,
    {
      actionBuilders: spaceActionBuilders,
      dataReducers: [
        updateSpaceQuotaReducer,
        endpointDisconnectRemoveEntitiesReducer(),
        userSpaceOrgReducer(true)
      ],
      entityBuilder: {
        getMetadata: space => ({
          orgGuid: space.entity.organization_guid ? space.entity.organization_guid : space.entity.organization.metadata.guid,
          name: space.entity.name,
        }),
        getLink: favorite => `/cloud-foundry/${favorite.endpointId}/organizations/${favorite.metadata.orgGuid}/spaces/${favorite.entityId}/summary`,
        getGuid: entity => entity.metadata.guid,
        getIsValid: (fav) => cfEntityCatalog.space.api.get(fav.entityId, fav.endpointId).pipe(
          entityFetchedWithoutError<RequestInfoState>()
        )
      }
    }
  );
  return cfEntityCatalog.space;
}

function generateCfOrgEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const orgDefinition: IStratosEntityDefinition = {
    type: organizationEntityType,
    schema: cfEntityFactory(organizationEntityType),
    label: 'Organization',
    labelPlural: 'Organizations',
    endpoint: endpointDefinition,
    icon: 'organization',
    iconFont: 'stratos-icons'
  };
  cfEntityCatalog.org = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IOrganization>,
    OrganizationActionBuilders,
    OrganizationActionBuilders
  >(
    orgDefinition,
    {
      actionBuilders: organizationActionBuilders,
      dataReducers: [
        updateOrganizationQuotaReducer,
        updateOrganizationSpaceReducer(),
        endpointDisconnectRemoveEntitiesReducer(),
        userSpaceOrgReducer(false)
      ],
      entityBuilder: {
        getMetadata: (org: APIResource<IOrganization>) => ({
          name: org.entity.name,
        }),
        getLink: favorite => `/cloud-foundry/${favorite.endpointId}/organizations/${favorite.entityId}`,
        getGuid: entity => entity.metadata.guid,
        getIsValid: (favorite) => cfEntityCatalog.org.api.get(favorite.entityId, favorite.endpointId, {}).pipe(
          entityFetchedWithoutError<RequestInfoState>()
        )
      }
    }
  );
  return cfEntityCatalog.org;
}

function generateCFMetrics(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: metricEntityType,
    schema: cfEntityFactory(metricEntityType),
    label: 'CF Metric',
    labelPlural: 'CF Metrics',
    endpoint: endpointDefinition,
  };
  cfEntityCatalog.metric = new StratosCatalogEntity<IFavoriteMetadata, unknown>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer(),
      ],
    }
  );
  return cfEntityCatalog.metric;
}

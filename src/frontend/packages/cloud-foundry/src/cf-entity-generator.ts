

import { Action, Store } from '@ngrx/store';
import { combineLatest, Observable, of } from 'rxjs';
import { take, map } from 'rxjs/operators';

import { BaseEndpointAuth, urlValidationExpression } from '@stratosui/core';
import {
  ActionDispatcher,
  APIResource,
  AppState,
  EndpointHealthCheck,
  EntityInfo,
  EntitySchema,
  entityFetchedWithoutError,
  GeneralEntityAppState,
  ICFAction,
  IFavoriteMetadata,
  IStratosEntityDefinition,
  JetstreamError,
  JetstreamResponse,
  PaginatedAction,
  PaginationEntityState,
  RequestInfoState,
  selectSessionData,
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
  StratosEndpointExtensionDefinition
} from '@stratosui/store';
import { CfValidateEntitiesStart } from './actions/relations-actions';
import { cfMaxedStateHandlers } from './cf-pagination-maxed-state';
import {
  StApp,
  StAuditEvent,
  StBuildpack,
  StDomain,
  StFeatureFlag,
  StOrg,
  StOrgQuota,
  StRoute,
  StSecurityGroup,
  StServiceBroker,
  StServiceInstance,
  StServicePlan,
  StSpace,
  StSpaceQuota,
  StStack,
} from './services/endpoint-data/stratos-types';
import { refreshCfInfo } from './services/endpoint-data/cf-info-helper';
import { v3EntitiesFromResponse, v3PaginationConfig, v3SingleResourceMapper } from './v3-native';
import {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
  IUserProvidedServiceInstance,
} from './cf-api-svc.types';
import {
  CfEvent,
  IApp,
  IAppSummary,
  IBuildpack,
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
import { CfErrorResponse, getCfError } from './cf-error-helpers';
import { ISpaceFavMetadata } from './cf-metadata-types';
import { CF_ENDPOINT_TYPE } from './cf-types';
import {
  AppEnvVarActionBuilders,
  appEnvVarActionBuilders,
} from './entity-action-builders/application-env-var.action-builders';
import { AppStatsActionBuilders, appStatsActionBuilders } from './entity-action-builders/application-stats.action-builders';
import {
  AppSummaryActionBuilders,
  appSummaryActionBuilders,
} from './entity-action-builders/application-summary.action-builders';
import { applicationActionBuilder, ApplicationActionBuilders } from './entity-action-builders/application.action-builders';
import { BuildpackActionBuilders, buildpackActionBuilders } from './entity-action-builders/buildpack.action-builders';
import { CfEventActionBuilders, cfEventActionBuilders } from './entity-action-builders/cf-event.action-builders';
import { DomainActionBuilders, domainActionBuilders } from './entity-action-builders/domin.action-builder';
import { FeatureFlagActionBuilders, featureFlagActionBuilders } from './entity-action-builders/feature-flag.action-builder';
import {
  OrganizationActionBuilders,
  organizationActionBuilders,
} from './entity-action-builders/organization.action-builders';
import {
  QuotaDefinitionActionBuilder,
  quotaDefinitionActionBuilder,
} from './entity-action-builders/quota-definition.action-builders';
import { SecurityGroupBuilders, securityGroupBuilders } from './entity-action-builders/security-groups.action-builder';
import {
  ServiceBindingActionBuilders,
  serviceBindingActionBuilders,
} from './entity-action-builders/service-binding.action-builders';
import {
  ServiceBrokerActionBuilders,
  serviceBrokerActionBuilders,
} from './entity-action-builders/service-broker.entity-builders';
import {
  ServiceInstanceActionBuilders,
  serviceInstanceActionBuilders,
} from './entity-action-builders/service-instance.action.builders';
import {
  ServicePlanVisibilityActionBuilders,
  servicePlanVisibilityActionBuilders,
} from './entity-action-builders/service-plan-visibility.action-builders';
import { ServicePlanActionBuilders, servicePlanActionBuilders } from './entity-action-builders/service-plan.action-builders';
import { ServiceActionBuilders, serviceActionBuilders } from './entity-action-builders/service.entity-builders';
import {
  SpaceQuotaDefinitionActionBuilders,
  spaceQuotaDefinitionActionBuilders,
} from './entity-action-builders/space-quota.action-builders';
import { SpaceActionBuilders, spaceActionBuilders } from './entity-action-builders/space.action-builders';
import { StackActionBuilders, stackActionBuilders } from './entity-action-builders/stack-action-builders';
import {
  UserProvidedServiceActionBuilder,
  userProvidedServiceActionBuilder,
} from './entity-action-builders/user-provided-service.action-builders';
import { UserActionBuilders, userActionBuilders } from './entity-action-builders/user.action-builders';
import { addCfQParams, addCfRelationParams } from './entity-relations/cf-entity-relations.getters';
import { populatePaginationFromParent } from './entity-relations/entity-relations';
import { isEntityInlineParentAction } from './entity-relations/entity-relations.types';
import { CfEndpointDetailsComponent } from './shared/components/cf-endpoint-details/cf-endpoint-details.component';
import { cfUserReducer, userSpaceOrgReducer } from './store/reducers/cf-users.reducer';
import { currentCfUserRolesReducer } from './store/reducers/current-cf-user-roles-reducer/current-cf-user-roles.reducer';
import { updateOrganizationQuotaReducer } from './store/reducers/organization-quota.reducer';
import { updateOrganizationSpaceReducer } from './store/reducers/organization-space.reducer';
import { serviceInstanceReducer } from './store/reducers/service-instance.reducer';
import { updateSpaceQuotaReducer } from './store/reducers/space-quota.reducer';
import { AppStat } from './store/types/app-metadata.types';
import { CfAPIResource, CFResponse } from './store/types/cf-api.types';
import { CfUser } from './store/types/cf-user.types';
import { cfUserRolesFetch } from './user-permissions/cf-user-roles-fetch';

function safePopulatePaginationFromParent(store: Store<GeneralEntityAppState>, action: PaginatedAction): Observable<Action> {
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
      component: () => import('./features/home/cfhome-card/cfhome-card.component').then(m => m.CFHomeCardComponent),
      shortcuts: cfShortcuts,
      fullView: false,
      columnSpan: 2,
    },
    listDetailsComponent: CfEndpointDetailsComponent,
    renderPriority: 1,
    // W-e: was `cfEntityCatalog.cfInfo.api.get(endpoint.guid)` which dispatched
    // a GetCFInfo ngrx action handled by CloudFoundryEffects.fetchInfo$ — both
    // the action class and the effect are gone. refreshCfInfo() bypasses
    // CfInfoDataService's warm-cache short-circuit so the periodic endpoint
    // health pulse still produces a fresh /pp/v1/cf/info/{guid} fetch.
    healthCheck: new EndpointHealthCheck(CF_ENDPOINT_TYPE, (endpoint) => refreshCfInfo(endpoint.guid)),
    getEndpointIdFromEntity: (entity: CfAPIResource) => entity.entity.cfGuid,
    globalPreRequest: (request, action) => {
      return addCfRelationParams(request, action);
    },
    globalPrePaginationRequest: (request, action, catalogEntity, appState) => {
      const rWithRelations = addCfRelationParams(request, action);
      return addCfQParams(rWithRelations, action, catalogEntity, appState);
    },
    globalSuccessfulRequestDataMapper: (data, endpointGuid, guid) => {
      if (data) {
        if (data.entity) {
          data.entity.cfGuid = endpointGuid;
          data.entity.guid = guid;
        } else {
          data.cfGuid = endpointGuid;
          data.guid = guid;
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
          actionsArray.forEach(actionFromArray => dispatcher(new CfValidateEntitiesStart(
            actionFromArray,
            (state.ids as Record<number, string[]>)[actionFromArray.__forcedPageNumber__ || state.currentPage]
          )));
        }
      };
    },
    entitiesFetchHandler: (store: Store<GeneralEntityAppState>, actions: PaginatedAction[]) => () => {
      combineLatest(actions.map(action => safePopulatePaginationFromParent(store, action))).pipe(
        take(1),
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
      getPaginationParameters: (page: number) => ({ page: page + '' }),
      canIgnoreMaxedState: (store: Store<AppState>) => {
        // Does entity type support? Yes
        // Does BE support ignore?
        return store.select(selectSessionData()).pipe(
          map(sessionData => !!sessionData.config.listAllowLoadMaxed)
        );
      },
      maxedStateStartAt: (store: Store<AppState>, action: PaginatedAction) => {
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
    generateCFPrivateDomainEntity(endpointDefinition),
    generateCFSpaceQuotaEntity(endpointDefinition),
    generateCFAppSummaryEntity(endpointDefinition),
    generateCFAppEnvVarEntity(endpointDefinition),
    generateCFQuotaDefinitionEntity(endpointDefinition),
  ];
}

// Map V3 Stratos-shape (camelCase StOrgQuota / StSpaceQuota) flat fields onto
// the V2 IOrgQuotaDefinition / ISpaceQuotaDefinition snake_case keys read by
// legacy consumers — Summary header, org/space Quota tab, edit-quota form,
// card-cf-org-user-details, card-cf-space-details. The shared mapper spreads
// the original record and adds these alias keys, so the V3-shape CF Quotas
// list (which reads camelCase directly) keeps working.
const quotaV3ToV2Renames: Record<string, string> = {
  paidServicesAllowed: 'non_basic_services_allowed',
  totalMemoryInMB: 'memory_limit',
  totalInstanceMemoryInMB: 'instance_memory_limit',
  totalInstances: 'app_instance_limit',
  totalAppTasks: 'app_task_limit',
  totalServiceInstances: 'total_services',
  totalServiceKeys: 'total_service_keys',
  totalRoutes: 'total_routes',
  totalReservedPorts: 'total_reserved_route_ports',
  totalDomains: 'total_private_domains',
};

function generateCFQuotaDefinitionEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: quotaDefinitionEntityType,
    schema: cfEntityFactory(quotaDefinitionEntityType),
    endpoint: endpointDefinition,
    label: 'Organization Quota',
    labelPlural: 'Organization Quotas',
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      // V3 wire shape is camelCase StOrgQuota; legacy V2 consumers (Summary
      // tile, quota-definition tab, edit-quota form) read snake_case
      // IOrgQuotaDefinition. The mapper spreads the original record and adds
      // the renamed keys, so both shapes coexist without breaking the V3
      // CF-level Quotas list which reads camelCase directly.
      getEntitiesFromResponse: v3EntitiesFromResponse<StOrgQuota>(quotaV3ToV2Renames),
    },
    successfulRequestDataMapper: v3SingleResourceMapper<StOrgQuota>(quotaV3ToV2Renames),
  };
  cfEntityCatalog.quotaDefinition = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IOrgQuotaDefinition>,
    QuotaDefinitionActionBuilder
  >(definition, {
    actionBuilders: quotaDefinitionActionBuilder
  });
  return cfEntityCatalog.quotaDefinition;
}

function generateCFAppEnvVarEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition<any, APIResource, any> = {
    type: appEnvVarsEntityType,
    schema: cfEntityFactory(appEnvVarsEntityType),
    endpoint: endpointDefinition,
    paginationConfig: {
      getEntitiesFromResponse: (response) => response,
      getTotalPages: (responses: JetstreamResponse<CFResponse>) => Object.values(responses).length,
      getTotalEntities: (_responses: JetstreamResponse<CFResponse>) => 1,
      getPaginationParameters: (_page: number) => ({ page: '1' }),
      canIgnoreMaxedState: () => of(false),
      maxedStateStartAt: () => of(null),
    },
    successfulRequestDataMapper: (data, endpointGuid, guid, entityType, endpointType, action) => {
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
  cfEntityCatalog.appSummary = new StratosCatalogEntity<IFavoriteMetadata, IAppSummary, AppSummaryActionBuilders>(definition, {
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
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      getEntitiesFromResponse: v3EntitiesFromResponse<StSpaceQuota>({
        ...quotaV3ToV2Renames,
        organizationGuid: 'organization_guid',
      }),
    },
    successfulRequestDataMapper: v3SingleResourceMapper<StSpaceQuota>({
      ...quotaV3ToV2Renames,
      organizationGuid: 'organization_guid',
    }),
  };
  cfEntityCatalog.spaceQuota = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<ISpaceQuotaDefinition>,
    SpaceQuotaDefinitionActionBuilders>(definition, {
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
  });
  return cfEntityCatalog.privateDomain;
}

function generateCFUserProvidedServiceInstanceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: userProvidedServiceInstanceEntityType,
    schema: cfEntityFactory(userProvidedServiceInstanceEntityType),
    label: 'User Provided Service',
    labelPlural: 'User Provided Services',
    endpoint: endpointDefinition,
  };
  cfEntityCatalog.userProvidedService = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IUserProvidedServiceInstance>,
    UserProvidedServiceActionBuilder
  >(
    definition,
    {
      actionBuilders: userProvidedServiceActionBuilder,
      dataReducers: [
        serviceInstanceReducer,
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
  const definition: IStratosEntityDefinition<any, AppStat> = {
    type: appStatsEntityType,
    schema: cfEntityFactory(appStatsEntityType),
    endpoint: endpointDefinition,
    paginationConfig: {
      getEntitiesFromResponse: (response) => {
        return Object.keys(response).map(key => {
          const stat = response[key];
          stat.guid = key;
          return stat;
        });
      },
      getTotalPages: (responses: JetstreamResponse) => Object.values(responses).length,
      getTotalEntities: (responses: JetstreamResponse) => Object.values(responses).reduce((count, response) => {
        return count + Object.keys(response).length;
      }, 0),
      getPaginationParameters: (page: number) => ({ page: page + '' }),
      canIgnoreMaxedState: () => of(false),
      maxedStateStartAt: () => of(null),
    },
    successfulRequestDataMapper: (data, endpointGuid, guid, entityType, endpointType, action) => {
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
  cfEntityCatalog.appStats = new StratosCatalogEntity<IFavoriteMetadata, AppStat, AppStatsActionBuilders>(definition, {
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
    endpoint: endpointDefinition,
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      // StBuildpack already exposes flat camelCase fields; V2 IBuildpack
      // (name/position/enabled/locked/filename) overlaps directly so no
      // field renames are needed. NOTE: no successfulRequestDataMapper —
      // globalSuccessfulRequestDataMapper on the endpoint stamps cfGuid/guid
      // for getCFCompositeEntityId.
      getEntitiesFromResponse: v3EntitiesFromResponse<StBuildpack>(),
    },
  };
  cfEntityCatalog.buildPack = new StratosCatalogEntity<IFavoriteMetadata, APIResource<IBuildpack>, BuildpackActionBuilders>(definition, {
    actionBuilders: buildpackActionBuilders
  });
  return cfEntityCatalog.buildPack;
}

// V3 StServiceBroker → V2 IServiceBroker key aliases. Templates and *.ts
// consumers read `broker_url`/`auth_username`/`space_guid`. authUsername is
// V3 write-only on read responses (see KS v2-v3 tristate doc) — `_meta`
// flags it; broker_url comes from V3's `url`.
//
// Nested-ref read paths (services-domain slice): space.guid replaces the
// flat spaceGuid. readPath splits on '.' and walks the chain.
const serviceBrokerV3ToV2Renames: Record<string, string> = {
  url: 'broker_url',
  'space.guid': 'space_guid',
  authUsername: 'auth_username',
};

function generateCFServiceBrokerEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: serviceBrokerEntityType,
    schema: cfEntityFactory(serviceBrokerEntityType),
    endpoint: endpointDefinition,
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      getEntitiesFromResponse: v3EntitiesFromResponse<StServiceBroker>(serviceBrokerV3ToV2Renames),
    },
    // NOTE: per-entity successfulRequestDataMapper intentionally omitted —
    // the global mapper (cf-entity.helpers) stamps cfGuid/guid which
    // getCFCompositeEntityId depends on. See A3 retry rationale.
  };
  cfEntityCatalog.serviceBroker = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServiceBroker>,
    ServiceBrokerActionBuilders>(definition, {
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
    ServicePlanVisibilityActionBuilders
  >(definition, {
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
    endpoint: endpointDefinition,
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      // V3 wire shape is camelCase StSecurityGroup; legacy ISecurityGroup
      // consumers (Summary tile, list cells) read snake_case running_default
      // and staging_default. Mapper spreads original record + adds the
      // renamed keys so V3 list and V2 readers coexist.
      // NOTE: no successfulRequestDataMapper — globalSuccessfulRequestDataMapper
      // on the endpoint stamps cfGuid/guid for getCFCompositeEntityId.
      getEntitiesFromResponse: v3EntitiesFromResponse<StSecurityGroup>({
        globallyEnabledRunning: 'running_default',
        globallyEnabledStaging: 'staging_default',
      }),
    },
  };
  cfEntityCatalog.securityGroup = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<ISecurityGroup>,
    SecurityGroupBuilders>(definition, {
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
    ServiceBindingActionBuilders
  >(
    definition,
    {
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
    ServiceActionBuilders
  >(
    definition,
    {
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

// V3 StServicePlan → V2 IServicePlan key aliases. V2 consumers read
// `service_guid` (parent service offering). The nested-ref shape
// (services-domain slice) carries the parent as
// `serviceOffering.guid`; alias as `service_guid` so the legacy filter
// logic in services-helper.ts and services.service.ts keeps matching.
// See A6 for native depth-2 (plan → service) walk.
const servicePlanV3ToV2Renames: Record<string, string> = {
  'serviceOffering.guid': 'service_guid',
};

function generateCFServicePlanEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: servicePlanEntityType,
    schema: cfEntityFactory(servicePlanEntityType),
    label: 'Service Plan',
    labelPlural: 'Service Plans',
    endpoint: endpointDefinition,
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      getEntitiesFromResponse: v3EntitiesFromResponse<StServicePlan>(servicePlanV3ToV2Renames),
    },
    // Global successfulRequestDataMapper handles cfGuid/guid stamping.
  };
  cfEntityCatalog.servicePlan = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServicePlan>,
    ServicePlanActionBuilders
  >(
    definition,
    {
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

// V3 StServiceInstance → V2 IServiceInstance key aliases. V2 consumers
// read `service_plan_guid`, `service_guid`, `space_guid`, `dashboard_url`
// across services-helper.ts, services.service.ts, services-wall cards,
// and add-service-instance flows. The nested-ref shape (services-domain
// slice) surfaces these as servicePlan.guid /
// servicePlan.serviceOffering.guid / space.guid (with dashboardUrl still
// flat). The legacy "service" relation (depth-2: SI → plan → service)
// reads via `service_guid` on the SI row in V2 — alias the deep
// serviceOffering chain straight to `service_guid` so list-filter logic
// keeps working without the depth-2 relation walk. See A6 for native
// depth-2 handling.
const serviceInstanceV3ToV2Renames: Record<string, string> = {
  'servicePlan.guid': 'service_plan_guid',
  'servicePlan.serviceOffering.guid': 'service_guid',
  'space.guid': 'space_guid',
  dashboardUrl: 'dashboard_url',
};

function generateCFServiceInstanceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: serviceInstancesEntityType,
    schema: {
      default: cfEntityFactory(serviceInstancesEntityType),
      [serviceInstancesWithSpaceEntityType]: cfEntityFactory(serviceInstancesWithSpaceEntityType),
      [serviceInstancesWithNoBindingsEntityType]: cfEntityFactory(serviceInstancesWithNoBindingsEntityType),
    },
    label: 'Marketplace Service',
    labelPlural: 'Marketplace Services',
    endpoint: endpointDefinition,
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      getEntitiesFromResponse: v3EntitiesFromResponse<StServiceInstance>(serviceInstanceV3ToV2Renames),
    },
    // Global successfulRequestDataMapper handles cfGuid/guid stamping.
    // Single-resource GET (GetServiceInstance) is left on V2 — no native
    // /pp/v1/cf/service_instances/:cnsi/:guid handler yet (flagged).
  };
  cfEntityCatalog.serviceInstance = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IServiceInstance>,
    ServiceInstanceActionBuilders
  >(
    definition,
    {
      dataReducers: [
        serviceInstanceReducer,
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
  cfEntityCatalog.user = new StratosCatalogEntity<IFavoriteMetadata, APIResource<CfUser>, UserActionBuilders>(
    definition,
    {
      actionBuilders: userActionBuilders,
      dataReducers: [cfUserReducer],
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

// StDomain is the V3 wire shape; legacy V2 IDomain consumers read
// snake_case keys (router_group_guid, owning_organization_guid). The
// mapper spreads the original record and aliases just those two keys.
const domainV3ToV2Renames: Record<string, string> = {
  routerGroupGuid: 'router_group_guid',
  owningOrgGuid: 'owning_organization_guid',
};

function generateCFDomainEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: domainEntityType,
    schema: cfEntityFactory(domainEntityType),
    label: 'Domain',
    labelPlural: 'Domains',
    endpoint: endpointDefinition,
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      // NOTE: no successfulRequestDataMapper —
      // globalSuccessfulRequestDataMapper on the endpoint stamps cfGuid/guid
      // for getCFCompositeEntityId.
      getEntitiesFromResponse: v3EntitiesFromResponse<StDomain>(domainV3ToV2Renames),
    },
  };
  cfEntityCatalog.domain = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IDomain>,
    DomainActionBuilders
  >(
    definition,
    {
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
    endpoint: endpointDefinition,
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      // V3 wire shape is camelCase StAuditEvent; legacy CfEvent (V2 cf-api.types)
      // consumers read snake_case actor/actee fields. The signal-native list
      // already reads camelCase, so the renames are belt-and-braces for any
      // remaining ngrx readers (AppEvent in list-data-source-types.ts).
      // NOTE: no successfulRequestDataMapper — globalSuccessfulRequestDataMapper
      // on the endpoint stamps cfGuid/guid for getCFCompositeEntityId.
      getEntitiesFromResponse: v3EntitiesFromResponse<StAuditEvent>({
        actorGuid: 'actor',
        actorName: 'actor_name',
        actorType: 'actor_type',
        targetGuid: 'actee',
        targetName: 'actee_name',
        targetType: 'actee_type',
        organizationGuid: 'organization_guid',
        spaceGuid: 'space_guid',
        createdAt: 'timestamp',
      }),
    },
  };
  cfEntityCatalog.event = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<CfEvent>,
    CfEventActionBuilders>(
      definition,
      {
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

// V3 StRoute → V2 IRoute key aliases. Templates and *.ts consumers read
// `domain_guid`, `space_guid`, and `domain_url` (the legacy V2 field name
// for the rendered host+domain string). V3 surfaces these as camelCase
// plus `url` for the rendered URL — alias them so existing V2 consumers
// (route table cells, route delete/unmap dialogs, app-route picker)
// continue to work without per-template rewrites.
const routeV3ToV2Renames: Record<string, string> = {
  domainGuid: 'domain_guid',
  spaceGuid: 'space_guid',
  url: 'domain_url',
};

function generateRouteEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: routeEntityType,
    schema: cfEntityFactory(routeEntityType),
    label: 'Application Route',
    labelPlural: 'Application Routes',
    endpoint: endpointDefinition,
    // The native /pp/v1/cf/routes/{cnsi} handler returns the legacy flat
    // StRoutesResponse{resources, totalResults} envelope (no `pagination`
    // sub-block). v3PaginationConfig assumes pagination.totalPages /
    // pagination.totalResults, so override getTotalPages/getTotalEntities
    // to read totalResults off the flat envelope and stamp a single page.
    // The list is server-drained, so a single page is correct.
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: (responses: JetstreamResponse) =>
        Object.values(responses).length > 0 ? 1 : 0,
      getTotalEntities: (responses: JetstreamResponse) =>
        Object.values(responses).reduce((sum: number, r: any) => {
          const resp = Array.isArray(r) ? r[0] : r;
          return sum + (resp?.totalResults ?? resp?.total_results ?? 0);
        }, 0),
      getPaginationParameters: (page: number) => ({ page: page + '' }),
      getEntitiesFromResponse: v3EntitiesFromResponse<StRoute>(routeV3ToV2Renames),
    },
    // Global successfulRequestDataMapper handles cfGuid/guid stamping.
  };
  cfEntityCatalog.route = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IRoute>
  >(
    definition,
    {
      entityBuilder: {
        getMetadata: app => ({
          name: app.entity.domain_url,
        }),
        // V3 routes arrive flat (no metadata wrapper); fall back to entity.guid
        // when the V2 path is absent.
        getGuid: (entity: any) => entity?.metadata?.guid ?? entity?.guid
      }
    }
  );
  return cfEntityCatalog.route;
}

// StStack camelCase → V2 IStack snake_case. IStack itself has only
// name/description (already direct), but app deploy / stack-detail
// surfaces build/run rootfs images by snake_case key in some templates.
const stackV3ToV2Renames: Record<string, string> = {
  buildRootfsImage: 'build_rootfs_image',
  runRootfsImage: 'run_rootfs_image',
};

function generateStackEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: stackEntityType,
    schema: cfEntityFactory(stackEntityType),
    label: 'Stack',
    labelPlural: 'Stacks',
    endpoint: endpointDefinition,
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      // NOTE: no successfulRequestDataMapper —
      // globalSuccessfulRequestDataMapper on the endpoint stamps cfGuid/guid
      // for getCFCompositeEntityId.
      getEntitiesFromResponse: v3EntitiesFromResponse<StStack>(stackV3ToV2Renames),
    },
  };
  cfEntityCatalog.stack = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IStack>,
    StackActionBuilders
  >(
    definition,
    {
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
  // Feature flags have no GUID on the V3 wire — `name` is the identity.
  // Synthesize `${cnsi}-${name}` so the catalog key is unique across CNSIs
  // and `getCFCompositeEntityId` keeps working. customErrorMessage → V2
  // IFeatureFlag's `error_message` so legacy templates still read it.
  // NOTE: no successfulRequestDataMapper — globalSuccessfulRequestDataMapper
  // on the endpoint stamps cfGuid/guid for getCFCompositeEntityId after
  // the synthesis below sets `guid`.
  const featureFlagDefinition: IStratosEntityDefinition = {
    type: featureFlagEntityType,
    schema: cfEntityFactory(featureFlagEntityType),
    label: 'Feature Flag',
    labelPlural: 'Feature Flags',
    endpoint: endpointDefinition,
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      // Custom entity extractor: synthesise `guid` on each StFeatureFlag
      // before delegating to the standard v3 → APIResource mapper. The
      // synthesized guid uses cnsiGuid (stamped server-side) + name.
      getEntitiesFromResponse: (resp) => {
        const r = resp as { resources?: StFeatureFlag[] };
        if (!r || !Array.isArray(r.resources)) {
          return [];
        }
        const synthesised = r.resources.map(ff => ({
          ...ff,
          guid: `${ff.cnsiGuid}-${ff.name}`,
        }));
        return v3EntitiesFromResponse<StFeatureFlag & { guid: string }>({
          customErrorMessage: 'error_message',
        })({ resources: synthesised });
      },
    }
  };
  cfEntityCatalog.featureFlag = new StratosCatalogEntity<
    IFavoriteMetadata,
    IFeatureFlag,
    FeatureFlagActionBuilders>(
      featureFlagDefinition,
      {
        actionBuilders: featureFlagActionBuilders,
        entityBuilder: {
          getMetadata: ff => ({
            name: ff.name,
          }),
          getGuid: entity => entity.guid,
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
        ['Name', (entity) => entity.entity.name],
        ['Created', (entity) => entity.metadata.created_at]
      ]
    },
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      // V3 wire shape is camelCase StApp; legacy V2 consumers read snake_case
      // (space_guid, organization_guid, disk_quota). The wrap spreads the
      // original record AND emits the aliased keys so both shapes coexist.
      // FLAG: StApp is missing health_check_*, buildpack, detected_buildpack,
      // docker_image, environment_json, package_state, staging_failed_reason,
      // enable_ssh — backend backfill needed before App Detail tabs migrate.
      getEntitiesFromResponse: v3EntitiesFromResponse<StApp>({
        spaceGuid: 'space_guid',
        orgGuid: 'organization_guid',
        diskQuota: 'disk_quota',
      }),
    },
    // NOTE: NO successfulRequestDataMapper — endpoint-level
    // globalSuccessfulRequestDataMapper handles cfGuid/guid stamping;
    // per-entity mapper would replace it and break getCFCompositeEntityId
    // lookups (see reverted commit d03e5b9e48).
  };

  cfEntityCatalog.application = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IApp>,
    ApplicationActionBuilders
  >(
    applicationDefinition,
    {
      entityBuilder: {
        getMetadata: app => ({
          name: app.entity.name,
        }),
        getLink: favorite => `/applications/${favorite.endpointId}/${favorite.entityId}/summary`,
        getGuid: entity => entity.metadata.guid,
        getIsValid: (fav) => cfEntityCatalog.application.api.get(fav.entityId, fav.endpointId, {}).pipe(entityFetchedWithoutError())
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
    iconFont: 'stratos-icons',
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      getEntitiesFromResponse: v3EntitiesFromResponse<StSpace>({
        orgGuid: 'organization_guid',
      }),
    },
    // NOTE: NO successfulRequestDataMapper — endpoint-level
    // globalSuccessfulRequestDataMapper handles cfGuid/guid stamping;
    // per-entity mapper would replace it and break getCFCompositeEntityId
    // lookups (see reverted commit d03e5b9e48).
  };
  cfEntityCatalog.space = new StratosCatalogEntity<ISpaceFavMetadata, APIResource<ISpace>, SpaceActionBuilders>(
    spaceDefinition,
    {
      actionBuilders: spaceActionBuilders,
      dataReducers: [
        updateSpaceQuotaReducer,
        userSpaceOrgReducer(true)
      ],
      entityBuilder: {
        getMetadata: space => ({
          orgGuid: space.entity.organization_guid ? space.entity.organization_guid : space.entity.organization.metadata.guid,
          name: space.entity.name,
        }),
        getLink: favorite => `/cloud-foundry/${favorite.endpointId}/organizations/${favorite.metadata.orgGuid}/spaces/${favorite.entityId}/summary`,
        getGuid: entity => entity.metadata.guid,
        getIsValid: (fav) => cfEntityCatalog.space.api.get(fav.entityId, fav.endpointId).pipe(entityFetchedWithoutError())
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
    iconFont: 'stratos-icons',
    paginationConfig: {
      ...cfMaxedStateHandlers,
      getTotalPages: v3PaginationConfig.getTotalPages,
      getTotalEntities: v3PaginationConfig.getTotalEntities,
      getPaginationParameters: v3PaginationConfig.getPaginationParameters,
      getEntitiesFromResponse: v3EntitiesFromResponse<StOrg>({
        quotaGuid: 'quota_definition_guid',
      }),
    },
    successfulRequestDataMapper: v3SingleResourceMapper<StOrg>({
      quotaGuid: 'quota_definition_guid',
    }),
  };
  cfEntityCatalog.org = new StratosCatalogEntity<
    IFavoriteMetadata,
    APIResource<IOrganization>,
    OrganizationActionBuilders
  >(
    orgDefinition,
    {
      actionBuilders: organizationActionBuilders,
      dataReducers: [
        updateOrganizationQuotaReducer,
        updateOrganizationSpaceReducer(),
        userSpaceOrgReducer(false)
      ],
      entityBuilder: {
        getMetadata: org => ({
          name: org.entity.name,
        }),
        getLink: favorite => `/cloud-foundry/${favorite.endpointId}/organizations/${favorite.entityId}`,
        getGuid: entity => entity.metadata.guid,
        getIsValid: (favorite) => cfEntityCatalog.org.api.get(favorite.entityId, favorite.endpointId, {}).pipe(entityFetchedWithoutError())
      }
    }
  );
  return cfEntityCatalog.org;
}


import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IUserProvidedServiceInstance,
} from '../../core/src/core/cf-api-svc.types';
import {
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
} from '../../core/src/core/cf-api.types';
import { urlValidationExpression } from '../../core/src/core/utils.service';
import { BaseEndpointAuth } from '../../core/src/features/endpoints/endpoint-auth';
import { AppState } from '../../store/src/app-state';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '../../store/src/entity-catalog/entity-catalog-entity';
import { entityCatalog } from '../../store/src/entity-catalog/entity-catalog.service';
import {
  IStratosEntityDefinition,
  StratosEndpointExtensionDefinition,
} from '../../store/src/entity-catalog/entity-catalog.types';
import {
  JetstreamError,
} from '../../store/src/entity-request-pipeline/entity-request-base-handlers/handle-multi-endpoints.pipe';
import { JetstreamResponse } from '../../store/src/entity-request-pipeline/entity-request-pipeline.types';
import { EntitySchema } from '../../store/src/helpers/entity-schema';
import { selectSessionData } from '../../store/src/reducers/auth.reducer';
import { endpointDisconnectRemoveEntitiesReducer } from '../../store/src/reducers/endpoint-disconnect-application.reducer';
import { APIResource } from '../../store/src/types/api.types';
import { PaginatedAction } from '../../store/src/types/pagination.types';
import { IFavoriteMetadata } from '../../store/src/types/user-favorites.types';
import { cfEntityFactory } from './cf-entity-factory';
import { addCfQParams, addCfRelationParams } from './cf-entity-relations.getters';
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
  gitBranchesEntityType,
  gitCommitEntityType,
  gitRepoEntityType,
  metricEntityType,
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
import { IAppFavMetadata, IBasicCFMetaData, IOrgFavMetadata, ISpaceFavMetadata } from './cf-metadata-types';
import { CF_ENDPOINT_TYPE } from './cf-types';
import { appEnvVarActionBuilders } from './entity-action-builders/application-env-var.action-builders';
import { appStatsActionBuilders } from './entity-action-builders/application-stats.action-builders';
import { appSummaryActionBuilders } from './entity-action-builders/application-summary.action-builders';
import { applicationActionBuilder } from './entity-action-builders/application.action-builders';
import { buildpackActionBuilders } from './entity-action-builders/buildpack.action-builders';
import { cfEventActionBuilders } from './entity-action-builders/cf-event.action-builders';
import {
  CfInfoDefinitionActionBuilders,
  cfInfoDefinitionActionBuilders,
} from './entity-action-builders/cf-info.action-builders';
import { domainActionBuilders } from './entity-action-builders/domin.action-builder';
import { featureFlagActionBuilders } from './entity-action-builders/feature-flag.action-builder';
import {
  GitBranchActionBuilders,
  gitBranchActionBuilders,
  GitCommitActionBuilders,
  gitCommitActionBuilders,
  GitCommitActionBuildersConfig,
  gitRepoActionBuilders,
} from './entity-action-builders/git-action-builder';
import { organizationActionBuilders } from './entity-action-builders/organization.action-builders';
import { quotaDefinitionActionBuilder } from './entity-action-builders/quota-definition.action-builders';
import { routesActionBuilders } from './entity-action-builders/routes.action-builder';
import { securityGroupBuilders } from './entity-action-builders/security-groups.action-builder';
import { serviceBindingActionBuilders } from './entity-action-builders/service-binding.action-builders';
import { serviceBrokerActionBuilders } from './entity-action-builders/service-broker.entity-builders';
import { serviceInstanceActionBuilders } from './entity-action-builders/service-instance.action.builders';
import { servicePlanVisibilityActionBuilders } from './entity-action-builders/service-plan-visibility.action-builders';
import { servicePlanActionBuilders } from './entity-action-builders/service-plan.action-builders';
import { serviceActionBuilders } from './entity-action-builders/service.entity-builders';
import { spaceQuotaDefinitionActionBuilders } from './entity-action-builders/space-quota.action-builders';
import { spaceActionBuilders } from './entity-action-builders/space.action-builders';
import { stackActionBuilders } from './entity-action-builders/stack-action-builders';
import { userProvidedServiceActionBuilder } from './entity-action-builders/user-provided-service.action-builders';
import { userActionBuilders } from './entity-action-builders/user.action-builders';
import { CfEndpointDetailsComponent } from './shared/components/cf-endpoint-details/cf-endpoint-details.component';
import { updateApplicationRoutesReducer } from './store/reducers/application-route.reducer';
import { updateOrganizationQuotaReducer } from './store/reducers/organization-quota.reducer';
import { updateOrganizationSpaceReducer } from './store/reducers/organization-space.reducer';
import { routeReducer, updateAppSummaryRoutesReducer } from './store/reducers/routes.reducer';
import { serviceInstanceReducer } from './store/reducers/service-instance.reducer';
import { updateSpaceQuotaReducer } from './store/reducers/space-quota.reducer';
import { endpointDisconnectUserReducer, userReducer, userSpaceOrgReducer } from './store/reducers/users.reducer';
import { AppStat } from './store/types/app-metadata.types';
import { CFResponse } from './store/types/cf-api.types';
import { GitBranch, GitCommit, GitRepo } from './store/types/git.types';
import { CfUser } from './store/types/user.types';

export interface CFBasePipelineRequestActionMeta {
  includeRelations?: string[];
  populateMissing?: boolean;
  flatten?: boolean;
}

export function registerCFEntities() {
  generateCFEntities().forEach(entity => entityCatalog.register(entity));
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
    listDetailsComponent: CfEndpointDetailsComponent,
    renderPriority: 1,
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
    paginationConfig: {
      getEntitiesFromResponse: (response: CFResponse) => response.resources,
      getTotalPages: (responseWithPages: JetstreamResponse<CFResponse | CFResponse[]>) =>
        // Input is keyed per endpoint. Value per endpoint can either be a response or a number of responses (one per page)
        Object.values(responseWithPages).reduce((max, response: CFResponse | CFResponse[]) => {
          const resp = (response[0] || response);
          return max > resp.total_pages ? max : resp.total_pages;
        }, 0),
      getTotalEntities: (responseWithPages: JetstreamResponse<CFResponse | CFResponse[]>) =>
        Object.values(responseWithPages).reduce((all, response: CFResponse | CFResponse[]) => {
          return all + (response[0] || response).total_results;
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
    }
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
    generateGitBranchEntity(endpointDefinition),
    generateGitRepoEntity(endpointDefinition),
    generateGitCommitEntity(endpointDefinition),
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
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<IOrgQuotaDefinition>>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: quotaDefinitionActionBuilder
  });
}

function generateCFAppEnvVarEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition<any, APIResource, any> = {
    type: appEnvVarsEntityType,
    schema: cfEntityFactory(appEnvVarsEntityType),
    endpoint: endpointDefinition,
    paginationConfig: {
      getEntitiesFromResponse: (response) => response,
      getTotalPages: (responses: JetstreamResponse<CFResponse>) => Object.values(responses).length,
      getTotalEntities: (responses: JetstreamResponse<CFResponse>) => 1,
      getPaginationParameters: (page: number) => ({ page: '1' }),
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
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: appEnvVarActionBuilders,
    entityBuilder: {
      getMetadata: ent => ({
        name: `Application environment variables (${ent.metadata.guid}).`,
        guid: ent.metadata.guid
      }),
      getGuid: metadata => metadata.guid,
    }
  });
}

function generateCFAppSummaryEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: appSummaryEntityType,
    schema: cfEntityFactory(appSummaryEntityType),
    endpoint: endpointDefinition,
  };
  return new StratosCatalogEntity<IFavoriteMetadata, IAppSummary>(definition, {
    dataReducers: [
      updateAppSummaryRoutesReducer,
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: appSummaryActionBuilders,
    entityBuilder: {
      getMetadata: ent => ({
        name: ent.name,
        guid: ent.guid
      }),
      getGuid: metadata => metadata.guid,
    }
  });
}

function generateCFSpaceQuotaEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: spaceQuotaEntityType,
    schema: cfEntityFactory(spaceQuotaEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<ISpaceQuotaDefinition>>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: spaceQuotaDefinitionActionBuilders
  });
}

function generateCFPrivateDomainEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: privateDomainsEntityType,
    schema: cfEntityFactory(privateDomainsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<IPrivateDomain>>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
  });
}

function generateCFInfoEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const cfInfoDefinition: IStratosEntityDefinition = {
    type: cfInfoEntityType,
    schema: cfEntityFactory(cfInfoEntityType),
    label: 'Cloud Foundry Info',
    labelPlural: 'Cloud Foundry Infos',
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<ICfV2Info>, CfInfoDefinitionActionBuilders>(
    cfInfoDefinition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: cfInfoDefinitionActionBuilders,
      entityBuilder: {
        getMetadata: info => ({
          guid: info.entity.name,
          name: info.entity.name,
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateCFUserProvidedServiceInstanceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: userProvidedServiceInstanceEntityType,
    schema: cfEntityFactory(userProvidedServiceInstanceEntityType),
    label: 'User Provided Service Instance',
    labelPlural: 'User Provided Service Instances',
    endpoint: endpointDefinition,
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<IUserProvidedServiceInstance>>(
    definition,
    {
      actionBuilders: userProvidedServiceActionBuilder,
      dataReducers: [
        serviceInstanceReducer,
        endpointDisconnectRemoveEntitiesReducer()
      ],
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.name
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
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
  return new StratosCatalogEntity<IFavoriteMetadata, AppStat>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: appStatsActionBuilders,
    entityBuilder: {
      getMetadata: ent => ({
        name: ent.guid
      }),
      getGuid: metadata => metadata.name,
    }
  });
}

function generateCFBuildPackEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: buildpackEntityType,
    schema: cfEntityFactory(buildpackEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<IBuildpack>>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: buildpackActionBuilders
  });
}

function generateCFServiceBrokerEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: serviceBrokerEntityType,
    schema: cfEntityFactory(serviceBrokerEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<IServiceBroker>>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: serviceBrokerActionBuilders
  });
}

function generateCFServicePlanVisibilityEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: servicePlanVisibilityEntityType,
    schema: cfEntityFactory(servicePlanVisibilityEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<ISecurityGroup>>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: servicePlanVisibilityActionBuilders
  });
}

function generateCFSecurityGroupEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: securityGroupEntityType,
    schema: cfEntityFactory(securityGroupEntityType),
    label: 'Security Group',
    labelPlural: 'Security Groups',
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<ISecurityGroup>>(definition, {
    dataReducers: [
      endpointDisconnectRemoveEntitiesReducer()
    ],
    actionBuilders: securityGroupBuilders
  });
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
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<IServiceBinding>>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: serviceBindingActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.metadata.guid
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateCFServiceEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: serviceEntityType,
    schema: cfEntityFactory(serviceEntityType),
    label: 'Service',
    labelPlural: 'Services',
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<IService>>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: serviceActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.label
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateCFServicePlanEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: servicePlanEntityType,
    schema: cfEntityFactory(servicePlanEntityType),
    label: 'Service Plan',
    labelPlural: 'Service Plans',
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<IServicePlan>>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: servicePlanActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.name
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
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
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<IServiceInstance>>(
    definition,
    {
      dataReducers: [
        serviceInstanceReducer,
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: serviceInstanceActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.name
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateCFUserEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: cfUserEntityType,
    schema: cfEntityFactory(cfUserEntityType),
    label: 'User',
    labelPlural: 'Users',
    endpoint: endpointDefinition,
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<CfUser>>(
    definition,
    {
      actionBuilders: userActionBuilders,
      dataReducers: [userReducer, endpointDisconnectUserReducer],
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.username || ent.entity.guid || ent.metadata.guid
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateCFDomainEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: domainEntityType,
    schema: cfEntityFactory(domainEntityType),
    label: 'Domain',
    labelPlural: 'Domains',
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<IDomain>>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: domainActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.name
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateGitCommitEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: gitCommitEntityType,
    schema: cfEntityFactory(gitCommitEntityType),
    label: 'Git Commit',
    labelPlural: 'Git Commits',
    endpoint: endpointDefinition,
    nonJetstreamRequest: true,
    successfulRequestDataMapper: (data, endpointGuid, guid, entityType, endpointType, action) => {
      return {
        ...data,
        guid: action.guid
      };
    },
  };
  return new StratosCatalogEntity<IFavoriteMetadata, GitCommit, GitCommitActionBuildersConfig, GitCommitActionBuilders>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: gitCommitActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.commit ? ent.commit.message || ent.sha : ent.sha,
          guid: ent.guid
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateGitRepoEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: gitRepoEntityType,
    schema: cfEntityFactory(gitRepoEntityType),
    label: 'Git Repository',
    labelPlural: 'Git Repositories',
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, APIResource<GitRepo>>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: gitRepoActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.entity.full_name
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateGitBranchEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: gitBranchesEntityType,
    schema: cfEntityFactory(gitBranchesEntityType),
    label: 'Git Branch',
    labelPlural: 'Git Branches',
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IBasicCFMetaData, APIResource<GitBranch>, GitBranchActionBuilders>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: gitBranchActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          guid: ent.metadata.guid,
          name: ent.metadata.guid,
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateEventEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: cfEventEntityType,
    schema: cfEntityFactory(cfEventEntityType),
    label: 'Event',
    labelPlural: 'Events',
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IBasicCFMetaData, APIResource>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: cfEventActionBuilders,
      entityBuilder: {
        getMetadata: event => {
          return {
            guid: event.metadata.guid,
            name: event.metadata.guid,
          };
        },
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateRouteEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: routeEntityType,
    schema: cfEntityFactory(routeEntityType),
    label: 'Application Route',
    labelPlural: 'Application Routes',
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IBasicCFMetaData, APIResource<IRoute>>(
    definition,
    {
      actionBuilders: routesActionBuilders,
      dataReducers: [
        routeReducer,
        endpointDisconnectRemoveEntitiesReducer()
      ],
      entityBuilder: {
        getMetadata: app => ({
          guid: app.metadata.guid,
          name: app.entity.domain_url,
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateStackEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: stackEntityType,
    schema: cfEntityFactory(stackEntityType),
    label: 'Stack',
    labelPlural: 'Stacks',
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IBasicCFMetaData, APIResource<IStack>>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: stackActionBuilders,
      entityBuilder: {
        getMetadata: app => ({
          guid: app.metadata.guid,
          name: app.entity.name,
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
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
      return {
        ...response,
        guid: `${endpointGuid}-${response.name}`
      };
    },
    paginationConfig: {
      getEntitiesFromResponse: (response) => {
        return response;
      },
      getTotalPages: (responses: JetstreamResponse) => 1,
      getTotalEntities: (responses: JetstreamResponse) => responses.length,
      getPaginationParameters: (page: number) => ({ page: page + '' }),
      canIgnoreMaxedState: () => of(false),
      maxedStateStartAt: () => of(null),
    }
  };
  return new StratosCatalogEntity<IBasicCFMetaData, IFeatureFlag>(
    featureFlagDefinition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer()
      ],
      actionBuilders: featureFlagActionBuilders,
      entityBuilder: {
        getMetadata: ff => ({
          guid: ff.guid,
          name: ff.name,
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
}

function generateCfEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  return new StratosCatalogEndpointEntity(
    endpointDefinition,
    metadata => `/cloud-foundry/${metadata.guid}`
  );
}

function generateCfApplicationEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const applicationDefinition: IStratosEntityDefinition<EntitySchema, APIResource<IApp>> = {
    type: applicationEntityType,
    schema: cfEntityFactory(applicationEntityType),
    label: 'Application',
    labelPlural: 'Applications',
    endpoint: endpointDefinition,
    tableConfig: {
      rowBuilders: [
        ['Name', (entity) => entity.entity.name],
        ['Creation Date', (entity) => entity.metadata.created_at]
      ]
    }
  };

  return new StratosCatalogEntity<IAppFavMetadata, APIResource<IApp>>(
    applicationDefinition,
    {
      dataReducers: [
        updateApplicationRoutesReducer(),
        endpointDisconnectRemoveEntitiesReducer()
      ],
      entityBuilder: {
        getMetadata: app => ({
          guid: app.metadata.guid,
          cfGuid: app.entity.cfGuid,
          createdAt: moment(app.metadata.created_at).format('LLL'),
          name: app.entity.name,
        }),
        getLink: metadata => `/applications/${metadata.cfGuid}/${metadata.guid}/summary`,
        getGuid: metadata => metadata.guid,
        getLines: () => ([
          ['Creation Date', (meta) => meta.createdAt]
        ])
      },
      actionBuilders: applicationActionBuilder
    },
  );
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
  };
  return new StratosCatalogEntity<ISpaceFavMetadata, APIResource<ISpace>>(
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
          guid: space.metadata.guid,
          orgGuid: space.entity.organization_guid ? space.entity.organization_guid : space.entity.organization.metadata.guid,
          name: space.entity.name,
          cfGuid: space.entity.cfGuid,
          createdAt: moment(space.metadata.created_at).format('LLL'),
        }),
        getLines: () => ([
          ['Creation Date', (meta) => meta.createdAt]
        ]),
        getLink: metadata => `/cloud-foundry/${metadata.cfGuid}/organizations/${metadata.orgGuid}/spaces/${metadata.guid}/summary`,
        getGuid: metadata => metadata.guid
      }
    }
  );
}

function generateCfOrgEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const orgDefinition: IStratosEntityDefinition = {
    type: organizationEntityType,
    schema: cfEntityFactory(organizationEntityType),
    label: 'Organization',
    labelPlural: 'Organizations',
    endpoint: endpointDefinition,
  };
  return new StratosCatalogEntity<IOrgFavMetadata, APIResource<IOrganization>>(
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
        getMetadata: org => ({
          guid: org.metadata.guid,
          status: getOrgStatus(org),
          name: org.entity.name,
          cfGuid: org.entity.cfGuid,
          createdAt: moment(org.metadata.created_at).format('LLL'),
        }),
        getLink: metadata => `/cloud-foundry/${metadata.cfGuid}/organizations/${metadata.guid}`,
        getLines: () => ([
          ['Creation Date', (meta) => meta.createdAt]
        ]),
        getGuid: metadata => metadata.guid
      }
    }
  );
}

function getOrgStatus(org: APIResource<IOrganization>) {
  if (!org || !org.entity || !org.entity.status) {
    return 'Unknown';
  }
  return org.entity.status.charAt(0).toUpperCase() + org.entity.status.slice(1);
}

function generateCFMetrics(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: metricEntityType,
    schema: cfEntityFactory(metricEntityType),
    label: 'CF Metric',
    labelPlural: 'CF Metrics',
    endpoint: endpointDefinition,
  };
  return new StratosCatalogEntity<IOrgFavMetadata, APIResource<IOrganization>>(
    definition,
    {
      dataReducers: [
        endpointDisconnectRemoveEntitiesReducer(),
      ],
    }
  );
}

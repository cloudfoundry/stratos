import {
  OrchestratedActionBuilderConfig,
  StratosOrchestratedActionBuilders,
  OrchestratedActionBuilder,
  EntityRequestActionConfig,
  PaginationRequestActionConfig,
  KnownEntityActionBuilder,
  BaseEntityRequestAction,
  GetMultipleActionBuilder,
  BasePaginationRequestAction,
  BaseEntityRequestConfig
} from './action-orchestrator/action-orchestrator';

import { IStratosEntityDefinition, EntityCatalogueSchemas } from './entity-catalogue.types';

import { STRATOS_ENDPOINT_TYPE } from '../../base-entity-schemas';
import { StratosBaseCatalogueEntity } from './entity-catalogue-entity';

export class ActionBuilderConfigMapper {

  static actionKeyHttpMethodMapper = {
    get: 'GET',
    getMultiple: 'GET',
    create: 'POST',
    remove: 'DELETE',
    update: 'PUT'
  };

  static getActionBuilders(
    builders: OrchestratedActionBuilderConfig,
    catalogueEntity: StratosBaseCatalogueEntity
  ): StratosOrchestratedActionBuilders {
    return Object.keys(builders).reduce((actionBuilders, key) => {
      return {
        ...actionBuilders,
        [key]: ActionBuilderConfigMapper.getActionBuilder(builders[key], key, catalogueEntity)
      };
    }, {} as StratosOrchestratedActionBuilders);
  }

  static getActionBuilder(
    configOrBuilder: OrchestratedActionBuilder |
      EntityRequestActionConfig<OrchestratedActionBuilder> |
      PaginationRequestActionConfig<OrchestratedActionBuilder>,
    actionKey: string,
    catalogueEntity: StratosBaseCatalogueEntity
  ): OrchestratedActionBuilder {
    const definition = catalogueEntity.definition as IStratosEntityDefinition<EntityCatalogueSchemas>;
    if (configOrBuilder instanceof EntityRequestActionConfig) {
      // TODO We need to pass schemaKey
      return (...args: Parameters<KnownEntityActionBuilder>) => new BaseEntityRequestAction(
        catalogueEntity.getSchema(),
        args[0],
        args[1],
        definition.type,
        definition.endpoint ? definition.endpoint.type : STRATOS_ENDPOINT_TYPE,
        configOrBuilder.getUrl(...args),
        ActionBuilderConfigMapper.addHttpMethodFromActionKey(actionKey, configOrBuilder.requestConfig)
      );
    }
    if (configOrBuilder instanceof PaginationRequestActionConfig) {
      // TODO We need to pass schemaKey
      return (...args: Parameters<GetMultipleActionBuilder>) => new BasePaginationRequestAction(
        catalogueEntity.getSchema(),
        configOrBuilder.paginationKey || args[1],
        args[0],
        definition.type,
        definition.endpoint ? definition.endpoint.type : STRATOS_ENDPOINT_TYPE,
        configOrBuilder.getUrl(...args),
        configOrBuilder.requestConfig
      );
    }
    return configOrBuilder;
  }

  static addHttpMethodFromActionKey(key: string, config: BaseEntityRequestConfig): BaseEntityRequestConfig {
    return {
      ...config,
      // The passed httpMethod takes precedence when we're mapping the update action.
      // This is because some apis might use POST for updates.
      httpMethod: key === 'update' ? config.httpMethod || ActionBuilderConfigMapper.actionKeyHttpMethodMapper[key] :
        ActionBuilderConfigMapper.actionKeyHttpMethodMapper[key] || config.httpMethod,
    };
  }
}

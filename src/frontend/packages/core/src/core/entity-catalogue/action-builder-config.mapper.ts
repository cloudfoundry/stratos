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

import { EntitySchema } from '../../../../store/src/helpers/entity-schema';

export class ActionBuilderConfigMapper {

  static actionKeyHttpMethodMapper = {
    get: 'GET',
    getMultiple: 'GET',
    create: 'POST',
    remove: 'DELETE',
    update: 'PUT'
  };

  static getActionBuilders(
    builders: StratosOrchestratedActionBuilders | OrchestratedActionBuilderConfig,
    endpointType: string,
    entityType: string,
    schemaGetter: (schemaKey: string) => EntitySchema
  ): StratosOrchestratedActionBuilders {
    return Object.keys(builders).reduce((actionBuilders, key) => {
      return {
        ...actionBuilders,
        [key]: ActionBuilderConfigMapper.getActionBuilder(builders[key], key, endpointType, entityType, schemaGetter)
      };
    }, {} as StratosOrchestratedActionBuilders);
  }

  static getActionBuilder(
    configOrBuilder: OrchestratedActionBuilder |
      EntityRequestActionConfig<OrchestratedActionBuilder> |
      PaginationRequestActionConfig<OrchestratedActionBuilder>,
    actionKey: string,
    endpointType: string,
    entityType: string,
    schemaGetter: (schemaKey: string) => EntitySchema
  ): OrchestratedActionBuilder {
    if (configOrBuilder instanceof EntityRequestActionConfig) {
      // TODO We need to pass schemaKey
      return (...args: Parameters<KnownEntityActionBuilder>) => {
        const [guid, endpointGuid, ...meta] = args;
        return new BaseEntityRequestAction(
          schemaGetter(configOrBuilder.schemaKey),
          guid,
          endpointGuid,
          entityType,
          endpointType,
          configOrBuilder.getUrl(...args),
          ActionBuilderConfigMapper.addHttpMethodFromActionKey(actionKey, configOrBuilder.requestConfig),
          meta,
          !configOrBuilder.externalRequest
        );
      };
    }
    if (configOrBuilder instanceof PaginationRequestActionConfig) {
      // TODO We need to pass schemaKey
      return (...args: Parameters<GetMultipleActionBuilder>) => {
        const [endpointGuid, ...meta] = args;
        return new BasePaginationRequestAction(
          schemaGetter(configOrBuilder.schemaKey),
          configOrBuilder.paginationKey || args[1],
          endpointGuid,
          entityType,
          endpointType,
          configOrBuilder.getUrl(...args),
          configOrBuilder.requestConfig,
          meta,
          !configOrBuilder.externalRequest
        );
      };
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

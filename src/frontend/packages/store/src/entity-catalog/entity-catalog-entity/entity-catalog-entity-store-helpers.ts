import type { Observable } from 'rxjs';

import type { EntityService } from '../../entity-service';
import type { EntitySchema } from '../../helpers/entity-schema';
import { EntityMonitor } from '../../monitors/entity-monitor';
import type { PaginationMonitor } from '../../monitors/pagination-monitor';
import type { ActionState, ListActionState, RequestInfoState } from '../../reducers/api-request-reducer/types';
import type { PaginationObservables } from '../../reducers/pagination-reducer/pagination-reducer.types';
import { isPaginatedAction, type PaginatedAction } from '../../types/pagination.types';
import type { EntityRequestAction, RequestAction } from '../../types/request.types';
import type {
  ActionOrchestrator,
  OrchestratedActionBuilder,
  OrchestratedActionBuilders,
} from '../action-orchestrator/action-orchestrator';
import { EntityCatalogHelpers } from '../entity-catalog.helper';
import type { KnownActionBuilders } from './entity-catalog-entity';
import type {
  CoreEntityCatalogEntityStore,
  CustomEntityCatalogEntityStore,
  EntityCatalogEntityStore,
} from './entity-catalog-entity.types';

type ActionDispatcherReturnTypes = RequestInfoState | ActionState | ListActionState;

type ActionDispatcher<K extends keyof ABC, ABC extends OrchestratedActionBuilders> =
  <T extends ActionDispatcherReturnTypes>(
    ...args: Parameters<ABC[K]>
  ) => Observable<T>;

export type ActionDispatchers<ABC extends OrchestratedActionBuilders> = {
  [K in keyof ABC]: ActionDispatcher<K, ABC>
};

export class EntityCatalogEntityStoreHelpers {

  // Lazy getter for EntityCatalogHelper to avoid circular dependency
  private static get helper() {
    const helper = EntityCatalogHelpers.GetEntityCatalogHelper();
    if (!helper) {
      throw new Error('EntityCatalogHelper not initialized. Make sure EntityCatalogProvidersModule is imported and EntityCatalogHelpers.SetEntityCatalogHelper() was called.');
    }
    return helper;
  }

  private static createEntityService<Y>(
    actionBuilderKey: string,
    action: EntityRequestAction,
  ): EntityService<Y> {
    if (isPaginatedAction(action)) {
      throw new Error(`\`${actionBuilderKey}\` action for entity \`${action.entityType}\` is of type pagination`);
    }
    if (!action.guid) {
      throw new Error(
        `\`${actionBuilderKey}\` action for entity \`${action.entityType}\` has no guid. ` +
        `Ensure the entity ID is provided when calling getEntityService(). ` +
        `Action: ${JSON.stringify({ entityType: action.entityType, guid: action.guid, endpointGuid: action.endpointGuid })}`
      );
    }
    const helper = EntityCatalogEntityStoreHelpers.helper;
    if (!helper.esf) {
      throw new Error(`EntityServiceFactory (esf) not available in EntityCatalogHelper for action \`${actionBuilderKey}\` on entity \`${action.entityType}\``);
    }
    return helper.esf.create<Y>(
      action.guid,
      action
    );
  }

  private static createPaginationMonitor<Y>(
    actionBuilderKey: string,
    action: EntityRequestAction,
  ): PaginationMonitor<Y> {
    if (!isPaginatedAction(action)) {
      throw new Error(`\`${actionBuilderKey}\` action for entity \`${action.entityType}\` is not of type pagination`);
    }
    const pAction = action as PaginatedAction;
    const helper = EntityCatalogEntityStoreHelpers.helper;
    if (!helper.pmf) {
      throw new Error(`PaginationMonitorFactory (pmf) not available in EntityCatalogHelper for action \`${actionBuilderKey}\` on entity \`${action.entityType}\``);
    }
    return helper.pmf.create<Y>(pAction.paginationKey, pAction, pAction.flattenPagination);
  }

  private static createPaginationService<Y>(
    actionBuilderKey: string,
    action: EntityRequestAction,
  ): PaginationObservables<Y> {
    if (!isPaginatedAction(action)) {
      throw new Error(`\`${actionBuilderKey}\` action for entity \`${action.entityType}\` is not of type pagination`);
    }
    const pAction = action as PaginatedAction;
    const helper = EntityCatalogEntityStoreHelpers.helper;
    if (!helper.pmf) {
      throw new Error(`PaginationMonitorFactory (pmf) not available in EntityCatalogHelper for action \`${actionBuilderKey}\` on entity \`${action.entityType}\``);
    }
    if (!helper.store) {
      throw new Error(`Store not available in EntityCatalogHelper for action \`${actionBuilderKey}\` on entity \`${action.entityType}\``);
    }
    return helper.getPaginationObservables<Y>({
      store: helper.store,
      action: pAction,
      paginationMonitor: helper.pmf.create<Y>(
        pAction.paginationKey,
        pAction,
        pAction.flattenPagination
      )
    }, pAction.flattenPagination);
  }

  static getActionDispatchers<Y, ABC extends OrchestratedActionBuilders>(
    es: EntityCatalogEntityStore<Y, ABC>,
    builders: ABC,
  ): ActionDispatchers<ABC> {
    if (!builders) {
      return {} as ActionDispatchers<ABC>;
    }
    return Object.keys(builders).reduce((actionDispatchers, key) => ({
      ...actionDispatchers,
      [key]: EntityCatalogEntityStoreHelpers.getActionDispatcher(
        es,
        builders[key],
        key
      )
    }), {} as ActionDispatchers<ABC>);
  }

  private static getActionDispatcher<Y, ABC extends OrchestratedActionBuilders, K extends keyof ABC>(
    es: CoreEntityCatalogEntityStore<Y, ABC>,
    builder: OrchestratedActionBuilder,
    actionKey: string,
  ): ActionDispatcher<K, ABC> {
    return <T extends ActionDispatcherReturnTypes>(...args: Parameters<ABC[K]>): Observable<T> => {
      const action = builder(...args as Parameters<OrchestratedActionBuilder>);
      EntityCatalogEntityStoreHelpers.helper.store.dispatch(action);
      if (isPaginatedAction(action)) {
        return (es as unknown as Record<string, CoreEntityCatalogEntityStore<unknown, ABC>>)[actionKey].getPaginationMonitor(
          ...args as Parameters<ABC['getMultiple']>
        ).currentPageState$ as Observable<T>;
      }
      const rAction = action as RequestAction;
      const schema = rAction.entity ? (Array.isArray(rAction.entity) ? rAction.entity[0] : rAction.entity) : null;
      const schemaKey = schema ? (schema as EntitySchema).schemaKey : null;

      if (!rAction.guid) {
        throw new Error(`\`${actionKey}\` action for entity \`${rAction.entityType}\` has no guid`);
      }

      const entityMonitor = es.getEntityMonitor(
        rAction.guid,
        {
          schemaKey,
          startWithNull: false
        }
      );
      return rAction.updatingKey ?
        entityMonitor.getUpdatingSection(rAction.updatingKey) as Observable<T> :
        entityMonitor.entityRequest$ as Observable<T>;
    };
  }

  static createCoreStore<Y, ABC extends OrchestratedActionBuilders>(
    actionOrchestrator: ActionOrchestrator<ABC>,
    entityKey: string,
    getSchema: (schema: string) => EntitySchema
  ): CoreEntityCatalogEntityStore<Y, ABC> {
    return {
      getEntityMonitor: (
        entityId: string,
        params = {
          schemaKey: '',
          startWithNull: false
        }
      ): EntityMonitor<Y> => new EntityMonitor<Y>(
        EntityCatalogEntityStoreHelpers.helper.store, entityId, entityKey, getSchema(params.schemaKey), params.startWithNull
      ),
      getEntityService: (
        ...args: Parameters<ABC['get']>
      ): EntityService<Y> => {
        const actionBuilder = actionOrchestrator.getActionBuilder('get');
        if (!actionBuilder) {
          throw new Error(`\`get\` action builder not implemented for ${entityKey}`);
        }
        return EntityCatalogEntityStoreHelpers.createEntityService('get', actionBuilder(...args));
      },
      getPaginationMonitor: (
        ...args: Parameters<ABC['getMultiple']>
      ) => {
        const actionBuilder = actionOrchestrator.getActionBuilder('getMultiple');
        if (!actionBuilder) {
          throw new Error(`\`get\` action builder not implemented for ${entityKey}`);
        }
        return EntityCatalogEntityStoreHelpers.createPaginationMonitor('getMultiple', actionBuilder(...args));
      },
      getPaginationService: (
        ...args: Parameters<ABC['getMultiple']>
      ) => {
        const actionBuilder = actionOrchestrator.getActionBuilder('getMultiple');
        if (!actionBuilder) {
          throw new Error(`\`get\` action builder not implemented for ${entityKey}`);
        }
        return EntityCatalogEntityStoreHelpers.createPaginationService('getMultiple', actionBuilder(...args));
      },
    };
  }

  static getPaginationStore<Y, ABC extends OrchestratedActionBuilders = OrchestratedActionBuilders>(
    builders: KnownActionBuilders<ABC>,
    entityKey: string,
    getSchema: (schema: string) => EntitySchema
  ): CustomEntityCatalogEntityStore<Y, ABC> {
    if (!builders) {
      return {} as CustomEntityCatalogEntityStore<Y, ABC>;
    }
    return Object.keys(builders).reduce((entityInstances, key) => {
      // This isn't smart like the PaginationBuilders type. Here key will be all properties from an action builder (get, getMultiple, etc)
      // which will be available from the dev console. Attempting to use in code pre-transpile will result in error
      return {
        ...entityInstances,
        [key]: {
          getEntityMonitor: (
            startWithNull: boolean,
            ...args: unknown[]
          ): EntityMonitor<Y> => {
            const action = (builders as Record<string, OrchestratedActionBuilder>)[key](...args) as EntityRequestAction;
            if (isPaginatedAction(action)) {
              throw new Error(`\`${key}\` action is of type pagination`);
            }
            return new EntityMonitor<Y>(
              EntityCatalogEntityStoreHelpers.helper.store,
              action.guid,
              entityKey,
              getSchema(action.schemaKey),
              startWithNull
            );
          },
          getEntityService: (
            ...args: unknown[]
          ): EntityService<Y> => EntityCatalogEntityStoreHelpers.createEntityService(key, (builders as Record<string, OrchestratedActionBuilder>)[key](...args) as EntityRequestAction),
          getPaginationMonitor: (
            ...args: unknown[]
          ): PaginationMonitor<Y> => EntityCatalogEntityStoreHelpers.createPaginationMonitor(key, (builders as Record<string, OrchestratedActionBuilder>)[key](...args) as EntityRequestAction),
          getPaginationService: (
            ...args: unknown[]
          ): PaginationObservables<Y> => EntityCatalogEntityStoreHelpers.createPaginationService(key, (builders as Record<string, OrchestratedActionBuilder>)[key](...args) as EntityRequestAction)
        }
      };
    }, {} as CustomEntityCatalogEntityStore<Y, ABC>);
  }
}

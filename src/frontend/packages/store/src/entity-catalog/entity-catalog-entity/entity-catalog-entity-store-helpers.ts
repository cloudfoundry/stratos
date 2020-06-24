import { Observable } from 'rxjs';

import { EntityService } from '../../entity-service';
import { EntitySchema } from '../../helpers/entity-schema';
import { EntityMonitor } from '../../monitors/entity-monitor';
import { PaginationMonitor } from '../../monitors/pagination-monitor';
import { ActionState, ListActionState, RequestInfoState } from '../../reducers/api-request-reducer/types';
import { PaginationObservables } from '../../reducers/pagination-reducer/pagination-reducer.types';
import { isPaginatedAction, PaginatedAction } from '../../types/pagination.types';
import { EntityRequestAction, RequestAction } from '../../types/request.types';
import {
  ActionOrchestrator,
  OrchestratedActionBuilder,
  OrchestratedActionBuilders,
} from '../action-orchestrator/action-orchestrator';
import { EntityCatalogHelpers } from '../entity-catalog.helper';
import { KnownActionBuilders } from './entity-catalog-entity';
import {
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

  private static createEntityService<Y>(
    actionBuilderKey: string,
    action: any,
  ): EntityService<Y> {
    const helper = EntityCatalogHelpers.GetEntityCatalogHelper();
    if (isPaginatedAction(action)) {
      throw new Error(`\`${actionBuilderKey}\` action for entity \`${action.entityType}\` is of type pagination`);
    }
    if (!action.guid) {
      throw new Error(`\`${actionBuilderKey}\` action for entity \`${action.entityType}\` has no guid`);
    }
    return helper.esf.create<Y>(
      action.guid,
      action
    )
  }

  private static createPaginationMonitor<Y>(
    actionBuilderKey: string,
    action: any,
  ): PaginationMonitor<Y> {
    const helper = EntityCatalogHelpers.GetEntityCatalogHelper();
    if (!isPaginatedAction(action)) {
      throw new Error(`\`${actionBuilderKey}\` action for entity \`${action.entityType}\` is not of type pagination`);
    }
    const pAction = action as PaginatedAction;
    return helper.pmf.create<Y>(pAction.paginationKey, pAction, pAction.flattenPagination);
  }

  private static createPaginationService<Y>(
    actionBuilderKey: string,
    action: any,
  ): PaginationObservables<Y> {
    const helper = EntityCatalogHelpers.GetEntityCatalogHelper();
    if (!isPaginatedAction(action)) {
      throw new Error(`\`${actionBuilderKey}\` action for entity \`${action.entityType}\` is not of type pagination`);
    }
    const pAction = action as PaginatedAction;
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
      const helper = EntityCatalogHelpers.GetEntityCatalogHelper();

      const action = builder(...args);
      helper.store.dispatch(action);
      if (isPaginatedAction(action)) {
        return es[actionKey].getPaginationMonitor(
          ...args
        ).currentPageState$;
      }
      const rAction = action as RequestAction;
      const schema = rAction.entity ? rAction.entity[0] || rAction.entity : null;
      const schemaKey = schema ? schema.schemaKey : null;

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
        EntityCatalogHelpers.GetEntityCatalogHelper().store, entityId, entityKey, getSchema(params.schemaKey), params.startWithNull
      ),
      getEntityService: (
        ...args: Parameters<ABC['get']>
      ): EntityService<Y> => {
        const actionBuilder = actionOrchestrator.getActionBuilder('get');
        if (!actionBuilder) {
          throw new Error(`\`get\` action builder not implemented for ${entityKey}`);
        }
        return EntityCatalogEntityStoreHelpers.createEntityService('get', actionBuilder(...args))
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
            ...args: any
          ): EntityMonitor<Y> => {
            const action: EntityRequestAction = builders[key](...args);
            if (isPaginatedAction(action)) {
              throw new Error(`\`${key}\` action is of type pagination`);
            }
            return new EntityMonitor<Y>(
              EntityCatalogHelpers.GetEntityCatalogHelper().store,
              action.guid,
              entityKey,
              getSchema(action.schemaKey),
              startWithNull
            )
          },
          getEntityService: (
            ...args: any
          ): EntityService<Y> => EntityCatalogEntityStoreHelpers.createEntityService(key, builders[key](...args)),
          getPaginationMonitor: (
            ...args: any
          ): PaginationMonitor<Y> => EntityCatalogEntityStoreHelpers.createPaginationMonitor(key, builders[key](...args)),
          getPaginationService: (
            ...args: any
          ): PaginationObservables<Y> => EntityCatalogEntityStoreHelpers.createPaginationService(key, builders[key](...args))
        }
      };
    }, {} as CustomEntityCatalogEntityStore<Y, ABC>);
  }
}
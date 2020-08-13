import { Action, Store } from '@ngrx/store';
import { of } from 'rxjs';

import { AppState } from '../../app-state';
import { EntityServiceFactory } from '../../entity-service-factory.service';
import { PaginationMonitorFactory } from '../../monitors/pagination-monitor.factory';
import { ActionOrchestrator, OrchestratedActionBuilders } from '../action-orchestrator/action-orchestrator';
import { ActionBuilderConfigMapper } from '../entity-catalog-entity/action-builder-config.mapper';
import { EntityCatalogEntityStoreHelpers } from '../entity-catalog-entity/entity-catalog-entity-store-helpers';
import { EntityCatalogHelper } from '../entity-catalog-entity/entity-catalog.service';
import { EntityCatalogHelpers } from '../entity-catalog.helper';

describe('ActionDispatcher', () => {
  it('should not dispatch unknown action', () => {
    const actionBuilders = ActionBuilderConfigMapper.getActionBuilders({}, null, null, null)
    const actionOrchestrator = new ActionOrchestrator('Empty', actionBuilders);

    const store = {
      ...EntityCatalogEntityStoreHelpers.createCoreStore(
        actionOrchestrator,
        entityType,
        null
      ),
      ...EntityCatalogEntityStoreHelpers.getPaginationStore(
        actionBuilders,
        entityType,
        null
      )
    };
    const entityActionDispatcher = EntityCatalogEntityStoreHelpers.getActionDispatchers(
      store,
      actionBuilders
    )
    expect(entityActionDispatcher.get).toBeUndefined();
  });

  const entityType = 'entityType';
  const endpointType = 'endpointType';

  it('should dispatch actions', () => {
    const endpointGuid = 'endpoint Guid';
    const guid = 'guid';
    const paginationKey = 'asd';

    const getAction = { type: 'get action', entityType, endpointType, guid, endpointGuid };
    const getMultipleAction = { type: 'getMultiple action', entityType, endpointType, endpointGuid, paginationKey };
    const customGetAction = { type: 'custom Action', entityType, endpointType, guid }
    const customGetMultipleAction = { type: 'custom MultipleAction', entityType, endpointType, paginationKey }

    const builders: OrchestratedActionBuilders = {
      get: (guid: string, endpointGuid: string, extraArgs?: any) => ({
        ...getAction,
        guid,
        endpointGuid
      }),
      getMultiple: (endpointGuid: string, paginationKey: string) => ({
        ...getMultipleAction,
        endpointGuid,
        paginationKey
      }),
      custom: (guid: string) => ({
        ...customGetAction,
        guid
      }),
      customMultipleAction: (paginationKey: string) => ({
        ...customGetMultipleAction,
        paginationKey
      }),
    }
    const actionBuilders = ActionBuilderConfigMapper.getActionBuilders(builders, null, null, null)
    const actionOrchestrator = new ActionOrchestrator(entityType, actionBuilders);

    const entityStore = {
      ...EntityCatalogEntityStoreHelpers.createCoreStore(
        actionOrchestrator,
        entityType,
        (schema: string) => null
      ),
      ...EntityCatalogEntityStoreHelpers.getPaginationStore(
        actionBuilders,
        entityType,
        (schema: string) => null
      )
    };
    const entityActionDispatcher = EntityCatalogEntityStoreHelpers.getActionDispatchers(
      entityStore,
      actionBuilders
    )

    const store = {
      dispatch: (action: Action) => { console.log(action) },
      select: (...args: any[]) => of(null)
    } as Store<AppState<any>>

    EntityCatalogHelpers.SetEntityCatalogHelper({
      store,
      esf: {
        create: (guid, action) => of(null)
      } as unknown as EntityServiceFactory,
      pmf: {
        create: (pk, ec, isLocal) => ({
          currentPageState$: {}
        })
      } as unknown as PaginationMonitorFactory
    } as EntityCatalogHelper)
    const storeDispatchSpy = spyOn(store, 'dispatch');

    expect(entityActionDispatcher.get).toBeDefined();
    expect(entityActionDispatcher.get(guid, endpointGuid)).toBeDefined();
    expect(storeDispatchSpy).toHaveBeenCalledWith(getAction)
    storeDispatchSpy.calls.reset();

    expect(entityActionDispatcher.custom).toBeDefined();
    expect(entityActionDispatcher.custom(guid)).toBeDefined();
    expect(storeDispatchSpy).toHaveBeenCalledWith(customGetAction)
    storeDispatchSpy.calls.reset();

    expect(entityActionDispatcher.getMultiple).toBeDefined();
    expect(entityActionDispatcher.getMultiple(endpointGuid, paginationKey)).toBeDefined();
    expect(storeDispatchSpy).toHaveBeenCalledWith(getMultipleAction)
    storeDispatchSpy.calls.reset();

    expect(entityActionDispatcher.customMultipleAction).toBeDefined();
    expect(entityActionDispatcher.customMultipleAction(paginationKey)).toBeDefined();
    expect(storeDispatchSpy).toHaveBeenCalledWith(customGetMultipleAction)
    storeDispatchSpy.calls.reset();

  });

});

import { EntityActionDispatcherManager } from './action-dispatcher';
import { Action } from '@ngrx/store';
import { ActionOrchestrator, OrchestratedActionBuilders, OrchestratedActionBuilder } from '../action-orchestrator/action-orchestrator';
import { getRequestAction, getPaginationAction } from '../action-orchestrator/action-orchestrator.spec.helpers';
import { IRequestAction } from '../../../../../store/src/types/request.types';

function actionDispatcher(action: Action) {
  // noop
}

describe('ActionDispatcher', () => {
  it('should not dispatch unknown action', () => {
    const actionOrchestrator = new ActionOrchestrator('Empty');
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.getActionDispatcher('get').dispatch('1', '2')).toBe(false);
  });
  it('should dispatch custom action', () => {
    interface CustomOrchestratedActionBuilders extends OrchestratedActionBuilders {
      custom: OrchestratedActionBuilder<[string], IRequestAction>;
    }
    const actionBuilders = {
      custom: guid => getRequestAction(),
      customAarb: guid => getRequestAction(),
      get: guid => getRequestAction()
    } as CustomOrchestratedActionBuilders;
    const data = 'adsd';
    const data2 = 'adsd2';
    const spy = spyOn(actionBuilders, 'custom');
    const actionOrchestrator = new ActionOrchestrator('Custom', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    // By getting action dispatcher
    const dipatcher = entityActionDispatcher.getActionDispatcher('custom');
    const dipatcher2 = entityActionDispatcher.getActionDispatcher('customAarb');
    expect(entityActionDispatcher.getActionDispatcher('custom').dispatch(data)).toBe(true);
    expect(spy).toHaveBeenCalledWith(data);
    // By dispatching action directly
    expect(entityActionDispatcher.dispatchAction('custom', data)).toBe(true);
    expect(spy).toHaveBeenCalledWith(data);
  });

  it('should dispatch get action', () => {
    function getActionBuilder(guid: string) {
      return getRequestAction();
    }
    const guid = 'guid';
    const endpointGuid = 'guid';
    const actionBuilders = {
      get: getActionBuilder
    } as OrchestratedActionBuilders;
    const spy = spyOn(actionBuilders, 'get');
    const actionOrchestrator = new ActionOrchestrator('get', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.dispatchGet(guid, endpointGuid)).toBe(true);
    expect(spy).toHaveBeenCalledWith(guid, endpointGuid);
  });

  it('should dispatch delete action', () => {
    function getActionBuilder(guid: string) {
      return getRequestAction();
    }
    const guid = 'guid';
    const endpointGuid = 'guid';
    const actionBuilders = {
      remove: getActionBuilder
    } as OrchestratedActionBuilders;
    const spy = spyOn(actionBuilders, 'delete');
    const actionOrchestrator = new ActionOrchestrator('delete', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.dispatchDelete(guid, endpointGuid)).toBe(true);
    expect(spy).toHaveBeenCalledWith(guid, endpointGuid);
  });

  it('should dispatch update action', () => {
    function getActionBuilder(guid: string) {
      return getRequestAction();
    }
    const guid = 'guid';
    const endpointGuid = 'guid';
    const arbData = 'arb';
    const actionBuilders = {
      update: getActionBuilder
    } as OrchestratedActionBuilders;
    const spy = spyOn(actionBuilders, 'update');
    const actionOrchestrator = new ActionOrchestrator('update', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.dispatchUpdate(guid, endpointGuid, arbData)).toBe(true);
    expect(spy).toHaveBeenCalledWith(guid, endpointGuid, arbData);
  });

  it('should dispatch create action', () => {
    function getActionBuilder() {
      return getRequestAction();
    }
    const endpointGuid = 'guid';
    const aString = 'stringy';
    const actionBuilders = {
      create: getActionBuilder
    } as OrchestratedActionBuilders;
    const spy = spyOn(actionBuilders, 'create');
    const actionOrchestrator = new ActionOrchestrator('create', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.dispatchCreate(endpointGuid, aString)).toBe(true);
    expect(spy).toHaveBeenCalledWith(endpointGuid, aString);
  });

  it('should dispatch getAll action', () => {
    function getActionBuilder() {
      return getPaginationAction();
    }

    const actionBuilders = {
      getAll: getActionBuilder
    } as OrchestratedActionBuilders;
    const endpointGuid = 'guid';
    const paginationKey = 'pagKey';
    const spy = spyOn(actionBuilders, 'getAll');
    const actionOrchestrator = new ActionOrchestrator('getAll', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.dispatchGetAll(endpointGuid, paginationKey)).toBe(true);
    expect(spy).toHaveBeenCalledWith(endpointGuid, paginationKey);
  });
});

import { EntityActionDispatcherManager } from './action-dispatcher';
import { Action } from '@ngrx/store';
import { ActionOrchestrator, OrchestratedActionBuilders } from '../action-orchestrator/action-orchestrator';
import { getRequestAction } from '../action-orchestrator/action-orchestrator.spec.helpers';

function actionDispatcher(action: Action) {
  // noop
}

fdescribe('ActionDispatcher', () => {
  it('should not dispatch unknown action', () => {
    const actionOrchestrator = new ActionOrchestrator('Empty');
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.getActionDispatcher('get').dispatch()).toBe(false);
  });
  it('should dispatch custom action', () => {
    const actionBuilders = {
      custom: guid => getRequestAction(),
      get: guid => getRequestAction()
    } as OrchestratedActionBuilders;
    const data = 'adsd';
    const data2 = 'adsd2';
    const spy = spyOn(actionBuilders, 'custom');
    const actionOrchestrator = new ActionOrchestrator('Custom', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    // By getting action dispatcher
    expect(entityActionDispatcher.getActionDispatcher('custom').dispatch(data)).toBe(true);
    expect(spy).toHaveBeenCalledWith(data);
    // By dispatching action directly
    expect(entityActionDispatcher.dispatchAction('custom', data, data2)).toBe(true);
    expect(spy).toHaveBeenCalledWith(data, data2);
  });

  it('should dispatch get action', () => {
    function getActionBuilder(guid: string) {
      return getRequestAction();
    }
    const guid = 'guid';
    const actionBuilders = {
      get: getActionBuilder
    } as OrchestratedActionBuilders;
    const spy = spyOn(actionBuilders, 'get');
    const actionOrchestrator = new ActionOrchestrator('get', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.dispatchGet(guid)).toBe(true);
    expect(spy).toHaveBeenCalledWith(guid);
  });

  it('should dispatch delete action', () => {
    function getActionBuilder(guid: string) {
      return getRequestAction();
    }
    const guid = 'guid';
    const actionBuilders = {
      delete: getActionBuilder
    } as OrchestratedActionBuilders;
    const spy = spyOn(actionBuilders, 'delete');
    const actionOrchestrator = new ActionOrchestrator('delete', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.dispatchDelete(guid)).toBe(true);
    expect(spy).toHaveBeenCalledWith(guid);
  });

  it('should dispatch update action', () => {
    function getActionBuilder(guid: string) {
      return getRequestAction();
    }
    const guid = 'guid';
    const actionBuilders = {
      update: getActionBuilder
    } as OrchestratedActionBuilders;
    const spy = spyOn(actionBuilders, 'update');
    const actionOrchestrator = new ActionOrchestrator('update', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.dispatchUpdate(guid)).toBe(true);
    expect(spy).toHaveBeenCalledWith(guid);
  });

  it('should dispatch create action', () => {
    function getActionBuilder() {
      return getRequestAction();
    }
    const someData = {
      name: 'asadasd'
    };
    const aString = 'stringy';
    const actionBuilders = {
      create: getActionBuilder
    } as OrchestratedActionBuilders;
    const spy = spyOn(actionBuilders, 'create');
    const actionOrchestrator = new ActionOrchestrator('create', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.dispatchCreate(someData, aString)).toBe(true);
    expect(spy).toHaveBeenCalledWith(someData, aString);
  });

  it('should dispatch getAll action', () => {
    function getActionBuilder() {
      return getRequestAction();
    }
    const actionBuilders = {
      getAll: getActionBuilder
    } as OrchestratedActionBuilders;
    const spy = spyOn(actionBuilders, 'getAll');
    const actionOrchestrator = new ActionOrchestrator('getAll', actionBuilders);
    const entityActionDispatcher = new EntityActionDispatcherManager(actionDispatcher, actionOrchestrator);
    expect(entityActionDispatcher.dispatchGetAll()).toBe(true);
    expect(spy).toHaveBeenCalledWith();
  });
});

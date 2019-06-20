import { ActionOrchestrator, OrchestratedActionBuilders } from './action-orchestrator';
import { hasActions, getRequestAction, getPaginationAction } from './action-orchestrator.spec.helpers';
import { EntityActionDispatcherManager } from '../action-dispatcher/action-dispatcher';

describe('ActionOrchestrator', () => {
  it('should not have action builders', () => {
    const actionOrchestrator = new ActionOrchestrator('Empty');
    hasActions(actionOrchestrator);
  });

  it('should have base action builders', () => {
    const actionBuilders = {
      get: guid => getRequestAction(),
      delete: guid => getRequestAction(),
      update: guid => getRequestAction(),
      create: () => getRequestAction(),
      getAll: () => getPaginationAction()
    } as OrchestratedActionBuilders;
    const actionOrchestrator = new ActionOrchestrator('Base', actionBuilders);
    hasActions(actionOrchestrator, ['get', 'delete', 'update', 'create', 'getAll']);
  });

  it('should have custom actions builders', () => {
    const actionBuilders = {
      customAction101: () => getPaginationAction(),
      customAction202: guid => getRequestAction()
    } as OrchestratedActionBuilders;
    const actionOrchestrator = new ActionOrchestrator('Custom', actionBuilders);
    hasActions(actionOrchestrator, ['customAction101', 'customAction202']);
  });

  it('should have custom and base actions builders', () => {
    const actionBuilders = {
      get: guid => getRequestAction(),
      delete: guid => getRequestAction(),
      update: guid => getRequestAction(),
      create: () => getRequestAction(),
      getAll: () => getPaginationAction(),
      customAction101: () => getPaginationAction(),
      customAction202: guid => getRequestAction()
    } as OrchestratedActionBuilders;
    const actionOrchestrator = new ActionOrchestrator('BasePlusCustom', actionBuilders);
    hasActions(actionOrchestrator, ['get', 'delete', 'update', 'create', 'getAll', 'customAction101', 'customAction202']);
  });

  it('should get entity action dispatcher', () => {
    const actionBuilders = {
      get: guid => getRequestAction(),
      delete: guid => getRequestAction(),
      update: guid => getRequestAction(),
      create: () => getRequestAction(),
      getAll: () => getPaginationAction(),
      customAction101: () => getPaginationAction(),
      customAction202: guid => getRequestAction()
    } as OrchestratedActionBuilders;
    const actionOrchestrator = new ActionOrchestrator('BasePlusCustom', actionBuilders);
    const dispatcher = actionOrchestrator.getEntityActionDispatcher(() => { });
    expect(dispatcher instanceof EntityActionDispatcherManager).toBe(true);
  });
});

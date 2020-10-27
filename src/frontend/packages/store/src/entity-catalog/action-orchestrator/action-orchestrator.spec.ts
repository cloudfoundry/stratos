import { PaginatedAction } from '../../types/pagination.types';
import { EntityRequestAction } from '../../types/request.types';
import { ActionOrchestrator, OrchestratedActionBuilders } from './action-orchestrator';
import { getPaginationAction, getRequestAction, hasActions } from './action-orchestrator.spec.helpers';


describe('ActionOrchestrator', () => {
  it('should not have action builders', () => {
    const actionOrchestrator = new ActionOrchestrator('Empty');
    hasActions(actionOrchestrator);
  });

  it('should have base action builders', () => {
    const actionBuilders: OrchestratedActionBuilders = {
      get: guid => getRequestAction(),
      remove: guid => getRequestAction(),
      update: guid => getRequestAction(),
      create: () => getRequestAction(),
      getMultiple: () => getPaginationAction()
    };
    const actionOrchestrator = new ActionOrchestrator('Base', actionBuilders);
    hasActions(actionOrchestrator, ['get', 'remove', 'update', 'create', 'getMultiple']);
  });

  it('should have custom actions builders', () => {
    interface Test1OrchestratedActionBuilders extends OrchestratedActionBuilders {
      customAction202: (guid: string) => EntityRequestAction;
      customAction101: (guid: string) => PaginatedAction;
    }
    const actionBuilders: Test1OrchestratedActionBuilders = {
      customAction101: () => getPaginationAction(),
      customAction202: guid => getRequestAction()
    };
    const actionOrchestrator = new ActionOrchestrator('Custom', actionBuilders);
    hasActions(actionOrchestrator, ['customAction101', 'customAction202']);
  });

  it('should have custom and base actions builders', () => {
    const actionBuilders: OrchestratedActionBuilders = {
      get: guid => getRequestAction(),
      remove: guid => getRequestAction(),
      update: guid => getRequestAction(),
      create: () => getRequestAction(),
      getMultiple: () => getPaginationAction(),
      customAction101: () => getPaginationAction(),
      customAction202: guid => getRequestAction()
    };
    const actionOrchestrator = new ActionOrchestrator('BasePlusCustom', actionBuilders);
    hasActions(actionOrchestrator, ['get', 'remove', 'update', 'create', 'getMultiple', 'customAction101', 'customAction202']);
  });

});

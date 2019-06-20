import { ActionOrchestrator, OrchestratedActionBuilder } from '../action-orchestrator/action-orchestrator';
import { Action } from '@ngrx/store';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import { IRequestAction } from '../../../../../store/src/types/request.types';
type ActionDispatcher = (action: Action) => void;
export class EntityActionDispatcher {
  constructor(
    private actionDispatcher: ActionDispatcher,
    private actionBuilder?: OrchestratedActionBuilder<any[], IRequestAction | PaginatedAction>
  ) { }
  public dispatch(...args: any[]) {
    if (this.actionBuilder) {
      const action = this.actionBuilder(...args);
      this.actionDispatcher(action);
      return true;
    }
    return false;
  }
}
export class EntityActionDispatcherManager {
  constructor(private actionDispatcher: (action: Action) => void, private actionOrchestrator: ActionOrchestrator) { }

  public getActionDispatcher(actionType: string) {
    const actionBuilder = this.actionOrchestrator.getActionBuilder(actionType);
    return new EntityActionDispatcher(
      this.actionDispatcher,
      actionBuilder
    );
  }

  public dispatchGet(guid: string) {
    return this.getActionDispatcher('get').dispatch(guid);
  }

  public dispatchDelete(guid: string) {
    return this.getActionDispatcher('delete').dispatch(guid);
  }

  public dispatchUpdate(guid: string) {
    return this.getActionDispatcher('update').dispatch(guid);
  }

  public dispatchCreate(...args: any[]) {
    return this.getActionDispatcher('create').dispatch(...args);
  }

  public dispatchGetAll() {
    return this.getActionDispatcher('getAll').dispatch();
  }

  public dispatchAction(actionType: string, ...args: any[]) {
    return this.getActionDispatcher(actionType).dispatch(...args);
  }
}

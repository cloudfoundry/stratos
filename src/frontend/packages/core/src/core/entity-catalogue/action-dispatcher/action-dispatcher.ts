import { ActionOrchestrator, OrchestratedActionBuilder, OrchestratedActionBuilders } from '../action-orchestrator/action-orchestrator';
import { Action } from '@ngrx/store';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import { IRequestAction } from '../../../../../store/src/types/request.types';
type ActionDispatcher = (action: Action) => void;
export class EntityActionDispatcher<
  T extends OrchestratedActionBuilder<Y, A> = OrchestratedActionBuilder<any[], any>,
  Y extends any[] = any[],
  A extends IRequestAction | PaginatedAction = IRequestAction | PaginatedAction
  > {
  constructor(
    private actionDispatcher: ActionDispatcher,
    private actionBuilder?: T
  ) { }
  public dispatch(...args: Y) {
    if (this.actionBuilder) {
      const action = this.actionBuilder(...args);
      this.actionDispatcher(action);
      return true;
    }
    return false;
  }
}
export class EntityActionDispatcherManager<T extends OrchestratedActionBuilders = OrchestratedActionBuilders> {
  constructor(private actionDispatcher: (action: Action) => void, private actionOrchestrator: ActionOrchestrator<T>) { }

  public getActionDispatcher(actionType: keyof T) {
    const actionBuilder = this.actionOrchestrator.getActionBuilder('get');
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

  public dispatchAction(actionType: keyof T, ...args: any[]) {
    return this.getActionDispatcher(actionType).dispatch(...args);
  }
}

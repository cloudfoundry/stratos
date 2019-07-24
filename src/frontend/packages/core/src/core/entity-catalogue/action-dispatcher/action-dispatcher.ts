import { Action, Store } from '@ngrx/store';

import { AppState } from '../../../../../store/src/app-state';
import {
  ActionOrchestrator,
  OrchestratedActionBuilder,
  OrchestratedActionBuilders,
} from '../action-orchestrator/action-orchestrator';

type ActionDispatcher = (action: Action) => void;
type a = [string, string, number];
// const list = ['a', 'b', 'c'] as const; // TS3.4 syntax
// type NeededUnionType = typeof list[0 | 2];
export class EntityActionDispatcher<
  T extends OrchestratedActionBuilder<any[], Action> =
  OrchestratedActionBuilder<any[], Action>,
  > {

  private static STORE: Store<AppState>;
  static initialize(store: Store<AppState>) {
    EntityActionDispatcher.STORE = store;
  }

  constructor(
    private actionDispatcher?: ActionDispatcher,
    private actionBuilder?: T
  ) { }
  public dispatch(...args: Parameters<T>) {
    if (this.actionBuilder) {
      const action = this.actionBuilder(...args);
      if (this.actionDispatcher) {
        this.actionDispatcher(action);
      } else if (EntityActionDispatcher.STORE && EntityActionDispatcher.STORE.dispatch) {
        EntityActionDispatcher.STORE.dispatch(action);
      } else {
        console.error('Failed to find dispatcher: ', this.actionBuilder);
        return false;
      }
      return true;
    }
    return false;
  }
}
export class EntityActionDispatcherManager<T extends OrchestratedActionBuilders = OrchestratedActionBuilders> {
  constructor(private actionDispatcher: (action: Action) => void, private actionOrchestrator: ActionOrchestrator<T>) { }

  public getActionDispatcher<Y extends keyof T>(actionType: Y) {
    const actionBuilder = this.getActionBuilder(actionType);
    return new EntityActionDispatcher<T[Y]>(
      this.actionDispatcher,
      actionBuilder
    );
  }

  public getActionBuilder<Y extends keyof T>(actionType: Y) {
    return this.actionOrchestrator.getActionBuilder(actionType) as T[Y];
  }

  public dispatchGet(...args: Parameters<T['get']>) {
    return this.getActionDispatcher('get').dispatch(...args);
  }

  public dispatchDelete(...args: Parameters<T['delete']>) {
    return this.getActionDispatcher('delete').dispatch(...args);
  }

  public dispatchUpdate(...args: Parameters<T['update']>) {
    return this.getActionDispatcher('update').dispatch(...args);
  }

  public dispatchCreate(...args: Parameters<T['create']>) {
    return this.getActionDispatcher('create').dispatch(...args);
  }

  public dispatchGetAll(...args: Parameters<T['getAll']>) {
    return this.getActionDispatcher('getAll').dispatch(...args);
  }

  public dispatchAction<K extends keyof T>(actionType: K, ...args: Parameters<T[K]>) {
    return this.getActionDispatcher(actionType).dispatch(...args);
  }
}

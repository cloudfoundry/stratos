import { IRequestAction } from '../../../../../store/src/types/request.types';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import { EntityActionDispatcherManager } from '../action-dispatcher/action-dispatcher';
import { Action } from '@ngrx/store';


// A function that returns a ICFAction
export type OrchestratedActionBuilder<
  T extends any[] = any[],
  Y extends Action = Action
  > = (...args: T) => Y;


type KnownEntityActionBuilder<T extends any[] = any[]> = (guid: string, endpointGuid: string, ...args: T) => IRequestAction;
type CreateActionBuilder<T extends any[] = any[]> = (endpointGuid: string, ...args: T) => IRequestAction;
// paginationKey could be optional, we could give it a default value.
type GetAllActionBuilder<T extends any[] = any[]> = (endpointGuid: string, paginationKey: string, ...args: T) => PaginatedAction;

// A list of functions that can be used get interface with the entity
export interface OrchestratedActionBuilders {
  get?: KnownEntityActionBuilder;
  remove?: KnownEntityActionBuilder;
  update?: KnownEntityActionBuilder;
  create?: CreateActionBuilder;
  getAll?: GetAllActionBuilder;
  [actionType: string]: OrchestratedActionBuilder;
}

export class OrchestratedActionBuildersClass implements OrchestratedActionBuilders {
  [actionType: string]: OrchestratedActionBuilder<any[], IRequestAction>;
}

export class ActionOrchestrator<T extends OrchestratedActionBuilders = OrchestratedActionBuilders> {
  public getEntityActionDispatcher(actionDispatcher: (action: Action) => void) {
    return new EntityActionDispatcherManager<T>(actionDispatcher, this);
  }

  public getActionBuilder<Y extends keyof T>(actionType: Y): T[Y] {
    return this.actionBuilders[actionType];
  }

  public hasActionBuilder(actionType: keyof T) {
    return !!this.actionBuilders[actionType];
  }

  constructor(public entityKey: string, private actionBuilders: T = {} as T) { }
}

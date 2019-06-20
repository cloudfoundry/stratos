import { IRequestAction } from '../../../../../store/src/types/request.types';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';
import { EntityActionDispatcherManager } from '../action-dispatcher/action-dispatcher';
import { Action } from '@ngrx/store';

export type BaseOrchestratedActionBuilderTypes = 'get' | 'delete' | 'update' | 'create' | 'getAll' | string;

// A function that returns a ICFAction
// export type OrchestratedActionBuilder<T extends any[], Y extends IRequestAction | PaginatedAction> = (...args: T) => Y;
export type OrchestratedActionBuilder<
  T extends Record<keyof T, any>,
  Y extends IRequestAction | PaginatedAction
  > = (...args: T[keyof T]) => Y;

// A list of functions that can be used get interface with the entity
export interface OrchestratedActionBuilders {
  get?: (guid: string, endpointGuid: string, data?: unknown) => IRequestAction;
  delete?: (guid: string, endpointGuid: string, data?: unknown) => IRequestAction;
  update?: (guid: string, endpointGuid: string, data?: unknown) => IRequestAction;
  create?: (data?: unknown) => IRequestAction;
  getAll?: () => PaginatedAction;
  [actionType: string]: OrchestratedActionBuilder<any, IRequestAction | PaginatedAction>;
}

export class ActionOrchestrator {
  public getEntityActionDispatcher(actionDispatcher: (action: Action) => void) {
    return new EntityActionDispatcherManager(actionDispatcher, this);
  }

  public getActionBuilder(actionType: BaseOrchestratedActionBuilderTypes) {
    return this.actionBuilders[actionType];
  }

  public hasActionBuilder(actionType: BaseOrchestratedActionBuilderTypes) {
    return !!this.actionBuilders[actionType];
  }

  constructor(public entityKey: string, private actionBuilders: OrchestratedActionBuilders = {}) { }
}

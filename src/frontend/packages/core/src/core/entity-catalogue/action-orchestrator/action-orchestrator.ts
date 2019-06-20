import { ICFAction } from '../../../../../store/src/types/request.types';
import { EntityCatalogueConfig } from '../entity-catalogue-entity';
import { PaginatedAction } from '../../../../../store/src/types/pagination.types';

export type BaseOrchestratedActionBuilderTypes = 'get' | 'delete' | 'update' | 'create' | 'getAll' | string;

// A function that returns a ICFAction
export type OrchestratedActionBuilder<T extends any[], Y extends ICFAction | PaginatedAction> = (...args: T) => Y;

// A list of functions that can be used get interface with the entity
export interface OrchestratedActionBuilders {
  get?: OrchestratedActionBuilder<[string, any], ICFAction>;
  delete?: OrchestratedActionBuilder<[string, any], ICFAction>;
  update?: OrchestratedActionBuilder<[string, any], ICFAction>;
  create?: OrchestratedActionBuilder<[any], ICFAction>;
  getAll?: OrchestratedActionBuilder<[], PaginatedAction>;
  [actionType: string]: OrchestratedActionBuilder<any[], ICFAction | PaginatedAction>;
}

export class ActionOrchestrator {
  public getActionBuilder(actionType: BaseOrchestratedActionBuilderTypes) {
    return this.actionBuilders[actionType];
  }

  public hasActionBuilder(actionType: BaseOrchestratedActionBuilderTypes) {
    return !!this.actionBuilders[actionType];
  }

  constructor(public entityKey: string, private actionBuilders: OrchestratedActionBuilders = {}) { }
}

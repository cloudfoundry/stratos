import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { map, mergeMap, withLatestFrom } from 'rxjs/operators';

import { DELETE_SUCCESS, DeleteApplication } from '../../../cloud-foundry/src/actions/application.actions';
import { ClearPaginationOfType } from '../actions/pagination.actions';
import { GeneralEntityAppState, GeneralRequestDataState } from '../app-state';
import { EntitySchema } from '../helpers/entity-schema';
import { EntitySchemaTreeBuilder, IFlatTree } from '../helpers/schema-tree-traverse';
import { getAPIRequestDataState } from '../selectors/api.selectors';
import { APISuccessOrFailedAction, ICFAction } from '../types/request.types';


export const RECURSIVE_ENTITY_DELETE = '[Entity] Recursive entity delete';
export const RECURSIVE_ENTITY_DELETE_COMPLETE = '[Entity] Recursive entity delete complete';
export const RECURSIVE_ENTITY_DELETE_FAILED = '[Entity] Recursive entity delete failed';

export const RECURSIVE_ENTITY_RESET = '[Entity] Recursive entity reset';
export const RECURSIVE_ENTITY_SET_DELETING = '[Entity] Recursive entity set deleting';
export const RECURSIVE_ENTITY_SET_DELETED = '[Entity] Recursive entity set deleted';

export interface IRecursiveDelete {
  guid: string;
  schema: EntitySchema;
}

export class RecursiveDelete implements Action, IRecursiveDelete {
  public type = RECURSIVE_ENTITY_DELETE;
  constructor(public guid: string, public schema: EntitySchema) { }
}

export class RecursiveDeleteComplete implements Action, IRecursiveDelete {
  public type = RECURSIVE_ENTITY_DELETE_COMPLETE;
  constructor(public guid: string, public endpointGuid: string, public schema: EntitySchema) { }
}

export class RecursiveDeleteFailed implements Action, IRecursiveDelete {
  public type = RECURSIVE_ENTITY_DELETE_FAILED;
  constructor(public guid: string, public endpointGuid: string, public schema: EntitySchema) { }
}

export class SetTreeDeleting implements Action {
  public type = RECURSIVE_ENTITY_SET_DELETING;
  constructor(public parentGuid: string, public tree: IFlatTree) { }
}

export class SetTreeDeleted implements Action {
  public type = RECURSIVE_ENTITY_SET_DELETED;
  constructor(public parentGuid: string, public tree: IFlatTree) { }
}

export class ResetTreeDelete implements Action {
  public type = RECURSIVE_ENTITY_RESET;
  constructor(public parentGuid: string, public tree: IFlatTree) { }
}

@Injectable()
export class RecursiveDeleteEffect {
  private entityTreeCache: { [guid: string]: IFlatTree } = {};
  constructor(
    private actions$: Actions,
    private store: Store<GeneralEntityAppState>
  ) { }

  private deleteSuccessApiActionGenerators = {
    application: (guid: string, endpointGuid: string) => {
      return new APISuccessOrFailedAction(DELETE_SUCCESS, new DeleteApplication(guid, endpointGuid) as ICFAction);
    }
  };

  @Effect()
  delete$ = this.actions$.pipe(
    ofType<RecursiveDelete>(RECURSIVE_ENTITY_DELETE),
    withLatestFrom(this.store.select(getAPIRequestDataState)),
    map(([action, state]) => {
      const tree = this.getTree(action, state);
      return new SetTreeDeleting(action.guid, tree);
    })
  );

  @Effect()
  deleteComplete$ = this.actions$.pipe(
    ofType<RecursiveDeleteComplete>(RECURSIVE_ENTITY_DELETE_COMPLETE),
    withLatestFrom(this.store.select(getAPIRequestDataState)),
    mergeMap(([action, state]) => {
      const tree = this.getTree(action, state);
      const actions = new Array<Action>().concat(...Object.keys(tree).map<Action[]>(key => {
        const keyActions = [];
        if (this.deleteSuccessApiActionGenerators[key]) {
          keyActions.push(this.deleteSuccessApiActionGenerators[key](action.guid, action.endpointGuid));
        }
        keyActions.push(new ClearPaginationOfType(action.schema));
        return keyActions;
      }));
      actions.unshift(new SetTreeDeleted(action.guid, tree));
      return actions;
    })
  );

  @Effect()
  deleteFailed$ = this.actions$.pipe(
    ofType<RecursiveDeleteFailed>(RECURSIVE_ENTITY_DELETE_FAILED),
    withLatestFrom(this.store.select(getAPIRequestDataState)),
    map(([action, state]) => {
      const tree = this.getTree(action, state);
      return new ResetTreeDelete(action.guid, tree);
    })
  );

  private getTree(action: IRecursiveDelete, state: GeneralRequestDataState) {
    const tree = this.entityTreeCache[action.guid] ?
      this.entityTreeCache[action.guid] :
      new EntitySchemaTreeBuilder().getFlatTree(action, state);
    return this.entityTreeCache[action.guid] = tree;
  }

}

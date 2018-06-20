import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { map, withLatestFrom } from 'rxjs/operators';

import { AppState } from '../app-state';
import { EntitySchema } from '../helpers/entity-factory';
import { EntitySchemaTreeBuilder, IFlatTree } from '../helpers/schema-tree-traverse';
import { getAPIRequestDataState } from '../selectors/api.selectors';
import { IRequestDataState } from '../types/entity.types';


export const RECURSIVE_ENTITY_DELETE = '[Entity] Recursive entity delete';
export const RECURSIVE_ENTITY_DELETE_COMPLETE = '[Entity] Recursive entity delete complete';
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
  constructor(public guid: string, public schema: EntitySchema) { }
}

export class SetTreeDeleting implements Action {
  public type = RECURSIVE_ENTITY_SET_DELETING;
  constructor(public parentGuid: string, public tree: IFlatTree) { }
}

export class SetTreeDeleted implements Action {
  public type = RECURSIVE_ENTITY_SET_DELETED;
  constructor(public parentGuid: string, public tree: IFlatTree) { }
}

@Injectable()
export class RecursiveDeleteEffect {
  private entityTreeCache: { [guid: string]: IFlatTree } = {};
  constructor(
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect()
  delete$ = this.actions$.ofType<RecursiveDelete>(RECURSIVE_ENTITY_DELETE).pipe(
    withLatestFrom(this.store.select(getAPIRequestDataState)),
    map(([action, state]) => {
      const tree = this.getTree(action, state);
      console.log(tree);
      return new SetTreeDeleting(action.guid, tree);
    })
  );

  deleteComplete$ = this.actions$.ofType<RecursiveDeleteComplete>(RECURSIVE_ENTITY_DELETE_COMPLETE).pipe(
    withLatestFrom(this.store.select(getAPIRequestDataState)),
    map(([action, state]) => {
      const tree = this.getTree(action, state);
      return new SetTreeDeleted(action.guid, tree);
    })
  );

  private getTree(action: IRecursiveDelete, state: IRequestDataState) {
    const tree = this.entityTreeCache[action.guid] ?
      this.entityTreeCache[action.guid] :
      new EntitySchemaTreeBuilder().getFlatTree(action, state);
    return this.entityTreeCache[action.guid] = tree;
  }
}

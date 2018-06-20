import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { tap, withLatestFrom, map } from 'rxjs/operators';

import { AppState } from '../app-state';
import { EntitySchema } from '../helpers/entity-factory';
import { EntitySchemaTreeBuilder, IFlatTree } from '../helpers/schema-tree-traverse';
import { getAPIRequestDataState } from '../selectors/api.selectors';


export const RECURSIVE_ENTITY_DELETE = '[Entity] Recursive entity delete';
export const RECURSIVE_ENTITY_SET_DELETING = '[Entity] Recursive entity set deleting';

export class RecursiveDelete implements Action {
  public type = RECURSIVE_ENTITY_DELETE;
  constructor(public guid: string, public schema: EntitySchema) { }
}

export class SetTreeDeleting implements Action {
  public type = RECURSIVE_ENTITY_SET_DELETING;
  constructor(public parentGuid: string, public tree: IFlatTree) { }
}

@Injectable()
export class RecursiveDeleteEffect {
  private entityKeyMapCache: { [key: string]: string[] } = {};
  constructor(
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect()
  delete$ = this.actions$.ofType<RecursiveDelete>(RECURSIVE_ENTITY_DELETE).pipe(
    withLatestFrom(this.store.select(getAPIRequestDataState)),
    map(([action, state]) => {
      const builder = new EntitySchemaTreeBuilder();
      const tree = builder.getFlatTree(action, state);
      console.log(tree);
      return new SetTreeDeleting(action.guid, tree);
    })
  );
}


import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { schema } from 'normalizr';
import { EntitySchema } from '../helpers/entity-factory';
import { AppState } from '../app-state';
import { combineLatest, withLatestFrom, tap } from 'rxjs/operators';
import { getAPIRequestDataState } from '../selectors/api.selectors';
import { EntitySchemaTreeBuilder } from '../helpers/schema-tree-traverse';


const RECURSIVE_ENTITY_DELETE = '[Entity] RECURSIVE_ENTITY_DELETE';

export class RecursiveDelete implements Action {
  public type = RECURSIVE_ENTITY_DELETE;
  constructor(public guid: string, public schema: EntitySchema) { }
}

@Injectable()
export class RecursiveDeleteEffect {
  private entityKeyMapCache: { [key: string]: string[] } = {};
  constructor(
    private actions$: Actions,
    private store: Store<AppState>
  ) { }

  @Effect({ dispatch: false })
  delete$ = this.actions$.ofType<RecursiveDelete>(RECURSIVE_ENTITY_DELETE).pipe(
    withLatestFrom(this.store.select(getAPIRequestDataState)),
    tap(([action, state]) => {
      const builder = new EntitySchemaTreeBuilder();
      const tree = builder.getFlatTree(action, state);
      console.log(tree);
    })
  );
}

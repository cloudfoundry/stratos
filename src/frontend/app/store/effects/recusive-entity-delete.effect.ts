
import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { schema } from 'normalizr';
import { EntitySchema } from '../helpers/entity-factory';


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
  ) { }

  @Effect({ dispatch: false })
  delete$ = this.actions$.ofType<RecursiveDelete>(RECURSIVE_ENTITY_DELETE).pipe();
}

import { Action } from '@ngrx/store';

export const REGISTER_ENTITY_ACTION = 'REGISTER_ENTITY';
export class RegisterEntitiesAction implements Action {
  public type = REGISTER_ENTITY_ACTION;
  constructor(public entityKeys: string[]) { }
}
// TODO: Remove

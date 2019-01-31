import { IRecentlyVisitedEntity } from '../types/recently-visited.types';
import { Action } from '@ngrx/store';

export class AddRecentlyVisitedEntityAction implements Action {
  static ACTION_TYPE = '[Recently visited] Set';
  public type = AddRecentlyVisitedEntityAction.ACTION_TYPE;
  constructor(public recentlyVisited: IRecentlyVisitedEntity) { }
}

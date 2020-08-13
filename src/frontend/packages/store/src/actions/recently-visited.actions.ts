import { Action } from '@ngrx/store';

import { IRecentlyVisitedEntity } from '../types/recently-visited.types';

export class AddRecentlyVisitedEntityAction implements Action {
  static ACTION_TYPE = '[Recently visited] Add';
  public type = AddRecentlyVisitedEntityAction.ACTION_TYPE;
  constructor(public recentlyVisited: IRecentlyVisitedEntity) {}
}

export class SetRecentlyVisitedEntityAction implements Action {
  static ACTION_TYPE = '[Recently visited] Set';
  public type = SetRecentlyVisitedEntityAction.ACTION_TYPE;
  constructor(public recentlyVisited: IRecentlyVisitedEntity) { }
}


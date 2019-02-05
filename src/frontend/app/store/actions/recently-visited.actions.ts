import { IRecentlyVisitedEntity, IRecentlyVisitedEntityDated } from '../types/recently-visited.types';
import { Action } from '@ngrx/store';
import * as moment from 'moment';

export class AddRecentlyVisitedEntityAction implements Action {
  static ACTION_TYPE = '[Recently visited] Add';
  public type = AddRecentlyVisitedEntityAction.ACTION_TYPE;
  public date: number;
  public recentlyVisited: IRecentlyVisitedEntityDated;
  constructor(recentlyVisited: IRecentlyVisitedEntity) {
    this.recentlyVisited = {
      ...recentlyVisited,
      date: moment().valueOf()
    };
  }
}

export class SetRecentlyVisitedEntityAction implements Action {
  static ACTION_TYPE = '[Recently visited] Set';
  public type = SetRecentlyVisitedEntityAction.ACTION_TYPE;
  constructor(public recentlyVisited: IRecentlyVisitedEntity) { }
}


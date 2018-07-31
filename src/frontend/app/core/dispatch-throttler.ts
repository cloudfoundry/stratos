import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Observable, of as observableOf, interval } from 'rxjs';
import { filter, map, switchMap, tap, throttleTime, delayWhen } from 'rxjs/operators';

import { AppState } from '../store/app-state';
import { chunkArray } from './utils.service';

export interface DispatchThrottlerAction {
  id: string;
  action: Action;
}

@Injectable()
export class DispatchThrottler {

  private chunking = 10;
  private ignoreWithinX: number;
  private dispatchRecord: {
    [id: string]: {
      time: number,
      queued: boolean
    }
  } = {};

  constructor(private store: Store<AppState>) { }

  setDispatchChunkSize(chunkSize: number) {
    this.chunking = chunkSize;
  }

  setDispatchDebounceTime(time: number) {
    this.ignoreWithinX = time;
  }

  throttle(actions: DispatchThrottlerAction[]): Observable<any> {
    // const filteredActions = ;
    return observableOf({ actions }).pipe(
      filter(({ actions }) => !!actions.length),
      map(({ actions }) => {
        if (this.ignoreWithinX) {
          const now = new Date().getTime();
          return actions.filter(action => {
            const record = this.dispatchRecord[action.id] || { time: 0, queued: false };
            return !record.queued && now - record.time > this.ignoreWithinX;
          });
        }
        return actions;
      }),
      tap(filteredActions => {
        filteredActions.forEach(action => {
          if (!this.dispatchRecord[action.id]) {
            this.dispatchRecord[action.id] = { time: 0, queued: false };
          }
          const record = this.dispatchRecord[action.id];
          record.queued = true;
        });
      }),
      switchMap(filteredActions => observableOf([], ...chunkArray(filteredActions, this.chunking))), // TODO: dispatch first straight away?
      delayWhen(() => interval(Math.random() * 10000)),
      tap((filteredActions: DispatchThrottlerAction[]) =>
        filteredActions.forEach(action => {
          this.dispatchRecord[action.id].time = new Date().getTime();
          this.dispatchRecord[action.id].queued = false;
          this.store.dispatch(action.action);
        })
      )
    );
  }

}

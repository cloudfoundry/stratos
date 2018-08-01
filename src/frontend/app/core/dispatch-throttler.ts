import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { interval, Observable, of as observableOf, Subject } from 'rxjs';
import { delayWhen, filter, map, tap, concatMap, delay, throttleTime } from 'rxjs/operators';

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
  private dispatched = new Subject();

  constructor(private store: Store<AppState>) {
    this.dispatched.next(true);
  }

  setDispatchChunkSize(chunkSize: number) {
    this.chunking = chunkSize;
    // this.dispatched.next(true);
    // this.dispatched.subscribe();
  }

  setDispatchDebounceTime(time: number) {
    this.ignoreWithinX = time;
  }

  private dispatch(filteredActions: DispatchThrottlerAction[]) {
    this.dispatched.next(true);
    filteredActions.forEach(action => {
      this.dispatchRecord[action.id].time = new Date().getTime();
      this.dispatchRecord[action.id].queued = false;
      this.store.dispatch(action.action);
    });
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
      // concatMap(filteredActions => {
      //   const chunks = chunkArray(filteredActions, this.chunking);
      //   this.dispatch(chunks[0]);
      //   return observableOf([], ...chunks.splice(1, chunks.length));
      // }), // TODO: dispatch first straight away?
      concatMap(filteredActions => {
        return observableOf([], ...chunkArray(filteredActions, this.chunking));
      }),
      tap(a => console.log('a', a)),
      // delayWhen(() => interval(Math.random() * 10000)),
      delayWhen(() => this.dispatched.pipe(throttleTime(10000))),
      // (Math.random() * 10000)),
      // delay(10000),
      // interval(Math.random() * 5000)
      tap(this.dispatch.bind(this)),
      tap(a => console.log('b', a)),

    );
  }

}

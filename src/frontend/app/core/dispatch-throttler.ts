import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { concatMap, delay, filter, map, tap } from 'rxjs/operators';

import { AppState } from '../store/app-state';
import { chunkArray } from './utils.service';

export interface DispatchThrottlerAction {
  id: string;
  action: Action;
}

export class DispatchThrottler {

  private dispatchRecord: {
    [id: string]: {
      time: number,
      queued: boolean
    }
  } = {};

  constructor(private store: Store<AppState>, private chunkSize = 1, private debounceInMs = 5000) { }

  private filterAndQueue(actions: DispatchThrottlerAction[]): DispatchThrottlerAction[] {
    if (this.debounceInMs) {
      const now = new Date().getTime();
      actions = actions.filter(action => {
        const record = this.dispatchRecord[action.id] || { time: 0, queued: false };
        return !record.queued && now - record.time > this.debounceInMs;
      });
    }
    actions.forEach(action => {
      if (!this.dispatchRecord[action.id]) {
        this.dispatchRecord[action.id] = { time: 0, queued: false };
      }
      const record = this.dispatchRecord[action.id];
      record.queued = true;
    });
    return actions;
  }

  private dispatch(actions: DispatchThrottlerAction[]) {
    actions.forEach(action => {
      this.dispatchRecord[action.id].time = new Date().getTime();
      this.dispatchRecord[action.id].queued = false;
      this.store.dispatch(action.action);
    });
  }

  public throttle(obs: Observable<DispatchThrottlerAction[]>) {
    return obs.pipe(
      filter(actions => !!actions.length),
      map(actions => this.filterAndQueue(actions)),
      filter(actions => !!actions.length),
      concatMap(filteredActions => {
        const chunks = chunkArray(filteredActions, this.chunkSize);
        this.dispatch(chunks.shift());
        return observableOf(...chunks);
      }),
      concatMap(actions => observableOf(actions).pipe(delay(4000))), // TODO:  RC delay until last batch finished
      tap(this.dispatch.bind(this)),
    );
  }
}

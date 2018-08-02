import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { concatMap, delay, filter, map, tap } from 'rxjs/operators';

import { AppState } from '../store/app-state';
import { chunkArray } from './utils.service';

export interface DispatchSequencerAction {
  id: string;
  action: Action;
}

export class DispatchSequencer {

  private dispatchRecord: {
    [id: string]: {
      time: number,
      queued: boolean
    }
  } = {};

  /**
   * @param {Store<AppState>} store
   * @param {number} [batchSize=5]
   * Multiple requests will be split up into batches of this size
   * @param {number} [batchDelay=5000]
   * Delay to apply between each batch
   * @param {number} [debounceInMs=5000]
   * Ignore repeat request made within this time period
   * @memberof DispatchSequencer
   */
  constructor(private store: Store<AppState>, private batchSize = 5, private batchDelay = 5000, private debounceInMs = 5000) { }

  private filterAndQueue(actions: DispatchSequencerAction[]): DispatchSequencerAction[] {
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

  private dispatch(actions: DispatchSequencerAction[]) {
    actions.forEach(action => {
      this.dispatchRecord[action.id].time = new Date().getTime();
      this.dispatchRecord[action.id].queued = false;
      this.store.dispatch(action.action);
    });
  }

  public sequence(obs: Observable<DispatchSequencerAction[]>) {
    return obs.pipe(
      filter(actions => !!actions.length),
      map(actions => this.filterAndQueue(actions)),
      filter(actions => !!actions.length),
      concatMap(filteredActions => {
        const chunks = chunkArray(filteredActions, this.batchSize);
        this.dispatch(chunks.shift());
        return observableOf(...chunks);
      }),
      // Could be improved by waiting on finish of previous batch
      concatMap(actions => observableOf(actions).pipe(delay(4000))),
      tap(this.dispatch.bind(this)),
    );
  }
}

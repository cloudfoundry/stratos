import { Action, Store } from '@ngrx/store';
import { Observable, of as observableOf } from 'rxjs';
import { concatMap, delay, filter, map, switchMap, tap } from 'rxjs/operators';

import { AppState } from '../store/app-state';
import { chunkArray } from './utils.service';

export interface DispatchSequencerAction {
  id: string;
  action: Action;
}

export class DispatchSequencer {

  private dispatchRecord: {
    [id: string]: number,
  } = {};

  /**
   * @param {Store<AppState>} store
   * @param {number} [batchSize=5]
   * Multiple requests will be split up into batches of this size
   * @param {number} [batchDelayInMs=5000]
   * Delay to apply between each batch
   * @param {number} [debounceInMs=5000]
   * Ignore repeat request made within this time period
   * @memberof DispatchSequencer
   */
  constructor(private store: Store<AppState>, private batchSize = 5, private batchDelayInMs = 5000, private debounceInMs = 5000) { }

  /**
  * Filter out recently dispatched actions
  */
  private filter(actions: DispatchSequencerAction[]): DispatchSequencerAction[] {
    if (this.debounceInMs) {
      const now = new Date().getTime();
      return actions.filter(action => {
        const lastDispatch = this.dispatchRecord[action.id] || 0;
        return now - lastDispatch > this.debounceInMs;
      });
    }
    return actions;
  }

  private dispatch(actions: DispatchSequencerAction[]) {
    actions.forEach(action => {
      this.dispatchRecord[action.id] = new Date().getTime();
      this.store.dispatch(action.action);
    });
  }

  /**
  * Dispatch actions in groups of `batchSize` such that there are no duplicate actions dispatched within `debounceInMs`. Each batch dispatch
  * will be separated by `batchDelayInMs`.
  */
  public sequence(obs: Observable<DispatchSequencerAction[]>): Observable<any> {
    return obs.pipe(switchMap(actions => this.innerSequence(actions)));
  }

  private innerSequence(allActions: DispatchSequencerAction[]): Observable<any> {
    return observableOf(allActions).pipe(
      filter(actions => !!actions.length),
      map(actions => this.filter(actions)),
      filter(actions => !!actions.length),
      concatMap(filteredActions => {
        const chunks = chunkArray(filteredActions, this.batchSize);
        // Always dispatch the first chunk immediately rather than after batchDelay. It would be nice to change this flow to processing
        // individual actions and use something like filter + `bufferTime(500, null, this.batchSize)`, however this delays the first batch
        this.dispatch(chunks.shift());
        return observableOf(...chunks);
      }),
      // Could be improved by waiting on finish of previous batch
      concatMap(actions => observableOf(actions).pipe(delay(this.batchDelayInMs))),
      tap(this.dispatch.bind(this)),
    );
  }
}

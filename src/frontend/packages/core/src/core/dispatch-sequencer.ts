import { Action, Store } from '@ngrx/store';
import { from, Observable, of as observableOf } from 'rxjs';
import { bufferTime, concatMap, delay, filter, map, mergeMap, switchMap, tap } from 'rxjs/operators';

import { GeneralEntityAppState } from '../../../store/src/app-state';


export interface DispatchSequencerAction {
  id: string;
  action: Action;
}

export class DispatchSequencer {

  private dispatchRecord: {
    [id: string]: number,
  } = {};

  /**
   * @param [batchSize=5]
   * Multiple requests will be split up into batches of this size
   * @param [batchDelayInMs=5000]
   * Delay to apply between each batch
   * @param [debounceInMs=5000]
   * Ignore repeat request made within this time period
   */
  constructor(
    private store: Store<GeneralEntityAppState>,
    private batchSize = 5,
    private batchDelayInMs = 5000,
    private debounceInMs = 5000
  ) { }

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

  private dispatch = (actions: DispatchSequencerAction[]) => {
    actions.forEach(action => {
      this.dispatchRecord[action.id] = new Date().getTime();
      this.store.dispatch(action.action);
    });
  }

  /**
   * Dispatch actions in groups of `batchSize` such that there are no duplicate actions dispatched within `debounceInMs`. Each batch
   * dispatch will be separated by `batchDelayInMs`.
   */
  public sequence(obs: Observable<DispatchSequencerAction[]>): Observable<any> {
    return obs.pipe(switchMap(actions => this.innerSequence(actions)));
  }

  private innerSequence(allActions: DispatchSequencerAction[]): Observable<any> {
    return observableOf(allActions).pipe(
      filter(actions => !!actions.length),
      map(actions => this.filter(actions)),
      filter(actions => !!actions.length),
      mergeMap(filteredActions => {
        return from(filteredActions)
          .pipe(
            bufferTime(100, null, this.batchSize),
            concatMap((actions, i) => observableOf(actions)
              .pipe(
                delay(i > 0 ? this.batchDelayInMs : 0)
              )
            ),
            tap(this.dispatch)
          );

      })
    );
  }
}

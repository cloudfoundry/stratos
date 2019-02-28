import { ReplaySubject } from 'rxjs';

import { RowsState, RowState } from '../../data-sources-controllers/list-data-source-types';

/**
 * A manager that helps manage list table row state.
 */
export class TableRowStateManager {
  private stateSubject: ReplaySubject<RowsState>;

  get rowState(): RowState {
    return this.rs;
  }

  /**
   * Update the state of a row and triggers the observable to emit the state.
   * This method will merge the passed values with the previously set values.
   */
  updateRowState(id: string, state: RowState) {
    this.mergeRowState(id, state);
    this.syncObservableState();
  }

  private mergeRowState(id: string, state) {
    const mergeIdState = {
      ...(this.rs[id] || {}),
      ...state
    };
    this.rs[id] = mergeIdState;
  }
  /**
   * Set the state of a row and triggers the observable to emit the state.
   * This method will replace the row state with the provided values.
   */
  setRowState(id: string, state: RowState) {
    this.rs[id] = state;
    this.syncObservableState();
  }

  /**
   * Set the state of all rows and triggers the observable to emit the state.
   * This method will replace the whole state with provided values.
   */
  setState(state: RowsState) {
    this.rs = state;
    this.syncObservableState();
  }

  /**
   * Update the state of all rows and triggers the observable to emit the state.
   *  This method will merge the passed values with the previously set values.
   */
  updateState(state: RowsState) {
    Object.keys(state).forEach(key => {
      this.mergeRowState(key, state[key]);
    });
    this.syncObservableState();
  }

  private syncObservableState() {
    this.stateSubject.next(this.rs);
  }
  /**
   * The observable that will emit the state.
   */
  get observable() {
    return this.stateSubject.asObservable();
  }

  /**
   * @param rs: Initial state.
   */
  constructor(private rs: RowsState = {}) {
    this.stateSubject = new ReplaySubject<RowsState>(1);
    this.syncObservableState();
  }
}

import { Subject } from 'rxjs/Subject';
import { RowState, RowsState } from '../../data-sources-controllers/list-data-source-types';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { debounceTime } from 'rxjs/operators';
/**
 * A manager that helps manage list table row state.
 */
export class TableRowStateManager {
  private stateSubject: ReplaySubject<RowsState>;

  get rowState(): RowState {
    return this._rowState;
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
      ...(this._rowState[id] || {}),
      ...state
    };
    this._rowState[id] = mergeIdState;
  }
  /**
   * Set the state of a row and triggers the observable to emit the state.
   * This method will replace the row state with the provided values.
   */
  setRowState(id: string, state: RowState) {
    this._rowState[id] = state;
    this.syncObservableState();
  }

  /**
   * Set the state of all rows and triggers the observable to emit the state.
   * This method will replace the whole state with provided values.
   */
  setState(state: RowsState) {
    this._rowState = state;
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
    this.stateSubject.next(this._rowState);
  }
  /**
   * The observable that will emit the state.
   */
  get observable() {
    return this.stateSubject.asObservable();
  }

  /**
   * @param _rowState: Initial state.
   */
  constructor(private _rowState: RowsState = {}) {
    this.stateSubject = new ReplaySubject<RowsState>(1);
    this.syncObservableState();
  }
}

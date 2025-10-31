import { ChangeDetectionStrategy, Component, computed, Injector, Input, OnInit, Signal, signal, WritableSignal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '@stratosui/store';
import { combineLatest, Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { RowState } from '../../data-sources-controllers/list-data-source-types';
import { IListAction, ListConfig } from '../../list.component.types';
import { TableCellCustom } from '../../list.types';

// Signal wrapper to provide BehaviorSubject-like API for dynamic creation
function createSignalWrapper<T>(initialValue: T, injector: Injector) {
  const _signal = signal<T>(initialValue);

  return Object.assign(
    () => _signal(),
    {
      set: (value: T) => _signal.set(value),
      update: (fn: (v: T) => T) => _signal.update(fn),
      next: (value: T) => _signal.set(value),
      getValue: () => _signal(),
      asObservable: () => toObservable(_signal, { injector }),
    }
  );
}

@Component({
  selector: 'app-table-cell-actions',
  templateUrl: './table-cell-actions.component.html',
  styleUrls: ['./table-cell-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class TableCellActionsComponent<T> extends TableCellCustom<T> implements OnInit {

  @Input()
  declare rowState: Observable<RowState>;

  @Input('row')
  get row() { return super.row; }
  set row(row: T) {
    super.row = row;
    if (row) {
      this.initialise(row);
    }
  }

  // Convert observables to signals
  private rowStateSignal: Signal<RowState | undefined>;
  public busy: Signal<boolean | undefined>;
  public show$: Observable<boolean>;
  public menuOpen = false;

  actions: IListAction<T>[];
  obs: {
    visible: { [action: string]: Observable<boolean>; },
    enabled: { [action: string]: Observable<boolean>; };
  };

  private subjects: Array<ReturnType<typeof createSignalWrapper<T>>> = [];

  constructor(
    private store: Store<AppState>,
    public listConfig: ListConfig<T>,
    private injector: Injector
  ) {
    super();
    this.actions = listConfig.getSingleActions();
  }

  ngOnInit() {
    this.rowStateSignal = toSignal(this.rowState);
    this.busy = computed(() => this.rowStateSignal()?.busy);
  }

  initialise(row: any) {
    if (this.obs) {
      return this.updateActionButtons(row);
    }
    this.obs = {
      visible: {},
      enabled: {}
    };
    const subject = createSignalWrapper(row, this.injector);
    this.subjects.push(subject);

    // Convert signal wrapper to Observable for action creators
    const row$ = subject.asObservable();

    this.actions.forEach(action => {
      this.obs.visible[action.label] = action.createVisible ? action.createVisible(row$) : observableOf(true);
      this.obs.enabled[action.label] = action.createEnabled ? action.createEnabled(row$) : observableOf(true);
    });

    this.show$ = combineLatest(Object.values(this.obs.visible)).pipe(
      map(visibles => visibles.some(visible => visible))
    );
  }

  private updateActionButtons(row: T) {
    if (this.subjects.length > 0) {
      this.subjects.forEach(subject => {
        subject.next(row);
      });
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}

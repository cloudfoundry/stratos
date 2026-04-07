import { ChangeDetectionStrategy, Component, computed, ElementRef, Injector, Input, OnDestroy, Renderer2, Signal, signal, ViewChild, inject } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { AppState } from '@stratosui/store';
import { combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
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
export class TableCellActionsComponent<T> extends TableCellCustom<T> implements OnDestroy {
  private store = inject<Store<AppState>>(Store);
  listConfig = inject<ListConfig<T>>(ListConfig);
  private injector = inject(Injector);
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);


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
  // Use a writable signal to avoid toSignal() in reactive context
  private rowStateSignal = signal<RowState | undefined>(undefined);

  public busy = computed(() => this.rowStateSignal()?.busy);
  public show$!: Observable<boolean>;
  public menuOpen = false;

  @ViewChild('menuElement', { read: ElementRef }) menuElement?: ElementRef;

  actions: IListAction<T>[];
  obs!: {
    visible: { [action: string]: Observable<boolean>; },
    enabled: { [action: string]: Observable<boolean>; };
  };

  private subjects: Array<ReturnType<typeof createSignalWrapper<T>>> = [];
  private documentClickListener?: () => void;
  private rowStateSubscription?: Subscription;

  constructor() {
    super();
    const listConfig = this.listConfig;

    this.actions = listConfig.getSingleActions();
  }

  initialise(row: any) {
    if (this.obs) {
      return this.updateActionButtons(row);
    }

    // Subscribe to rowState observable and update signal
    if (this.rowState && !this.rowStateSubscription) {
      this.rowStateSubscription = this.rowState.subscribe(state => {
        this.rowStateSignal.set(state);
      });
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

    if (this.menuOpen) {
      // Position the menu using fixed positioning
      setTimeout(() => this.positionMenu(), 0);

      // Add click listener to close menu when clicking outside
      this.documentClickListener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
        if (!this.elementRef.nativeElement.contains(event.target)) {
          this.menuOpen = false;
          this.cleanupListener();
        }
      });
    } else {
      this.cleanupListener();
    }
  }

  private positionMenu() {
    const containerElement = this.elementRef.nativeElement.querySelector('.table-cell-actions-container');
    const menuElement = this.elementRef.nativeElement.querySelector('.table-cell-actions-menu');

    if (!containerElement || !menuElement) {
      return;
    }

    const rect = containerElement.getBoundingClientRect();
    const menuHeight = menuElement.offsetHeight;
    const viewportHeight = window.innerHeight;

    // Position below the button by default
    let top = rect.bottom + 4;
    let left = rect.right - menuElement.offsetWidth;

    // If menu would go off bottom of screen, position above instead
    if (top + menuHeight > viewportHeight) {
      top = rect.top - menuHeight - 4;
    }

    // Ensure menu doesn't go off left edge
    if (left < 0) {
      left = 4;
    }

    this.renderer.setStyle(menuElement, 'top', `${top}px`);
    this.renderer.setStyle(menuElement, 'left', `${left}px`);
  }

  private cleanupListener() {
    if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = undefined;
    }
  }

  ngOnDestroy() {
    this.cleanupListener();
    if (this.rowStateSubscription) {
      this.rowStateSubscription.unsubscribe();
    }
  }
}

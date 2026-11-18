import { Injectable, Injector, Directive, inject, input, model, output, runInInjectionContext } from '@angular/core';

export type TailwindSortDirection = 'asc' | 'desc' | '';

export interface TailwindSort {
  active: string;
  direction: TailwindSortDirection;
}

export interface TailwindSortable {
  id: string;
  start: TailwindSortDirection;
  disableClear: boolean;
}

@Directive({
  selector: '[tailwindSort]',
  exportAs: 'tailwindSort',
  standalone: true
})
export class TailwindSortDirective {
  // The alias is the directive's selector, which the lint rule allows.
  readonly sortables = input<{ [key: string]: TailwindSortable }>({}, { alias: 'tailwindSort' });
  // Models, not inputs: sort() writes both.
  readonly active = model('');
  readonly direction = model<TailwindSortDirection>('');
  readonly disabled = input(false);

  readonly sortChange = output<TailwindSort>();

  sort(sortable: TailwindSortable): void {
    if (this.disabled()) {
      return;
    }

    let direction: TailwindSortDirection = sortable.start || 'asc';

    if (this.active() === sortable.id) {
      const current = this.direction();
      direction = current === 'asc' ? 'desc' : (current === 'desc' ? '' : 'asc');
    }

    if (direction === '' && sortable.disableClear) {
      direction = 'asc';
    }

    this.active.set(direction ? sortable.id : '');
    this.direction.set(direction);

    this.sortChange.emit({
      active: this.active(),
      direction: this.direction()
    });
  }

  getArrowDirection(id: string): TailwindSortDirection {
    return this.active() === id ? this.direction() : '';
  }
}

@Directive({
  selector: '[tailwindSortHeader]',
  exportAs: 'tailwindSortHeader',
  standalone: true
})
export class TailwindSortHeaderDirective {
  // The alias is the directive's selector, which the lint rule allows.
  readonly id = input.required<string>({ alias: 'tailwindSortHeader' });
  readonly arrowPosition = input<'before' | 'after'>('after');
  readonly start = input<TailwindSortDirection>('asc');
  readonly disabled = input(false);
  readonly disableClear = input(false);

  private _sort = inject(TailwindSortDirective);

  _handleClick(): void {
    if (this.disabled()) {
      return;
    }

    this._sort.sort({
      id: this.id(),
      start: this.start(),
      disableClear: this.disableClear()
    });
  }

  _getArrowDirectionState(): TailwindSortDirection {
    return this._sort.getArrowDirection(this.id());
  }

  _isSorted(): boolean {
    return this._sort.active() === this.id();
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindSortService {

  private injector = inject(Injector);

  // Signal inputs can only be created in an injection context.
  createSort(): TailwindSortDirective {
    return runInInjectionContext(this.injector, () => new TailwindSortDirective());
  }
}
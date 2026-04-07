import { Injectable, EventEmitter, Directive, Input, Output, inject } from '@angular/core';

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
  @Input('tailwindSort') sortables: { [key: string]: TailwindSortable } = {};
  @Input() active = '';
  @Input() direction: TailwindSortDirection = '';
  @Input() disabled = false;

  @Output() sortChange = new EventEmitter<TailwindSort>();

  sort(sortable: TailwindSortable): void {
    if (this.disabled) {
      return;
    }

    let direction: TailwindSortDirection = sortable.start || 'asc';

    if (this.active === sortable.id) {
      direction = this.direction === 'asc' ? 'desc' : (this.direction === 'desc' ? '' : 'asc');
    }

    if (direction === '' && sortable.disableClear) {
      direction = 'asc';
    }

    this.active = direction ? sortable.id : '';
    this.direction = direction;

    this.sortChange.emit({
      active: this.active,
      direction: this.direction
    });
  }

  getArrowDirection(id: string): TailwindSortDirection {
    return this.active === id ? this.direction : '';
  }
}

@Directive({
  selector: '[tailwindSortHeader]',
  exportAs: 'tailwindSortHeader',
  standalone: true
})
export class TailwindSortHeaderDirective {
  @Input('tailwindSortHeader') id!: string;
  @Input() arrowPosition: 'before' | 'after' = 'after';
  @Input() start: TailwindSortDirection = 'asc';
  @Input() disabled = false;
  @Input() disableClear = false;

  private _sort = inject(TailwindSortDirective);

  _handleClick(): void {
    if (this.disabled) {
      return;
    }

    this._sort.sort({
      id: this.id,
      start: this.start,
      disableClear: this.disableClear
    });
  }

  _getArrowDirectionState(): TailwindSortDirection {
    return this._sort.getArrowDirection(this.id);
  }

  _isSorted(): boolean {
    return this._sort.active === this.id;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindSortService {

  createSort(): TailwindSortDirective {
    return new TailwindSortDirective();
  }

  // Note: TailwindSortHeaderDirective should be used declaratively in templates,
  // not instantiated programmatically, as it uses inject() for dependencies
  createSortHeader(id: string): TailwindSortHeaderDirective {
    const header = new TailwindSortHeaderDirective();
    header.id = id;
    return header;
  }
}
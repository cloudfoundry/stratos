import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TailwindPageEvent } from '../../services/tailwind-paginator.service';
import { isPageSizeSentinel, resolvePageSize, getPageSizeLabel as getSizeLabel } from '../list/list.component.types';

@Component({
  selector: 'app-paginator',
  templateUrl: './app-paginator.component.html',
  styleUrls: ['./app-paginator.component.scss'],
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppPaginatorComponent {
  @Input() length = 0;
  @Input() pageSizeOptions: number[] = [6, 12, 24, 48, 96, -1];
  @Input() pageIndex = 0;
  @Input() showFirstLastButtons = true;

  private _pageSize = 50;
  /** The sentinel value when the user explicitly selected a sentinel, or null. */
  private _activeSentinel: number | null = null;

  @Input()
  set pageSize(value: number) {
    if (isPageSizeSentinel(value)) {
      this._pageSize = resolvePageSize(value, this.length);
      this._activeSentinel = value;
    } else {
      this._pageSize = value;
      this._activeSentinel = null;
    }
  }
  get pageSize(): number {
    return this._pageSize;
  }

  /** The raw value for the select — returns the sentinel value when active. */
  get selectValue(): number {
    // Explicit sentinel selection takes priority
    if (this._activeSentinel !== null) return this._activeSentinel;
    // If the current size matches a known option, show it
    if (this.pageSizeOptions.includes(this._pageSize)) return this._pageSize;
    // Size not in options — find a sentinel whose resolved value matches
    const sentinel = this.pageSizeOptions.find(opt =>
      isPageSizeSentinel(opt) && resolvePageSize(opt, this.length) === this._pageSize
    );
    if (sentinel !== undefined) return sentinel;
    return this._pageSize;
  }

  /** Resolve a sentinel to an effective page size, or return as-is. */
  getEffectivePageSize(size: number): number {
    return resolvePageSize(size, this.length);
  }

  /** Display label for a page size option. */
  getPageSizeLabel(size: number): string {
    return getSizeLabel(size);
  }

  @Output() page = new EventEmitter<TailwindPageEvent>();

  get hasNextPage(): boolean {
    const maxPageIndex = this.getNumberOfPages() - 1;
    return this.pageIndex < maxPageIndex && this.pageSize !== 0;
  }

  get hasPreviousPage(): boolean {
    return this.pageIndex >= 1 && this.pageSize !== 0;
  }

  getNumberOfPages(): number {
    if (!this.pageSize) {
      return 0;
    }
    return Math.ceil(this.length / this.pageSize);
  }

  getStartIndex(): number {
    return this.pageIndex * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min((this.pageIndex + 1) * this.pageSize, this.length);
  }

  firstPage(): void {
    if (!this.hasPreviousPage) {
      return;
    }
    this.changePage(0);
  }

  previousPage(): void {
    if (!this.hasPreviousPage) {
      return;
    }
    this.changePage(this.pageIndex - 1);
  }

  nextPage(): void {
    if (!this.hasNextPage) {
      return;
    }
    this.changePage(this.pageIndex + 1);
  }

  lastPage(): void {
    if (!this.hasNextPage) {
      return;
    }
    this.changePage(this.getNumberOfPages() - 1);
  }

  changePageSize(newPageSize: number): void {
    this._activeSentinel = isPageSizeSentinel(newPageSize) ? newPageSize : null;
    const effective = this.getEffectivePageSize(newPageSize);
    const startIndex = this.pageIndex * this.pageSize;
    const previousPageIndex = this.pageIndex;

    this.pageSize = effective;
    this.pageIndex = effective > 0 ? Math.floor(startIndex / effective) || 0 : 0;

    this.emitPageEvent(previousPageIndex);
  }

  private changePage(newPageIndex: number): void {
    const previousPageIndex = this.pageIndex;
    this.pageIndex = newPageIndex;
    this.emitPageEvent(previousPageIndex);
  }

  private emitPageEvent(previousPageIndex: number): void {
    this.page.emit({
      previousPageIndex,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.length
    });
  }
}

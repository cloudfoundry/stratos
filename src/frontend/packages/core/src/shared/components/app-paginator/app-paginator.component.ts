import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TailwindPaginator, TailwindPageEvent } from '../../services/tailwind-paginator.service';
import { PAGE_SIZE_ALL } from '../list/list.component.types';

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
  @Input() pageSize = 50;
  @Input() pageSizeOptions: number[] = [6, 12, 24, 48, 96, PAGE_SIZE_ALL];
  @Input() pageIndex = 0;
  @Input() showFirstLastButtons = true;

  /** Resolve "All" (-1) to the actual length */
  getEffectivePageSize(size: number): number {
    return size === PAGE_SIZE_ALL ? this.length : size;
  }

  /** Display label for a page size option */
  getPageSizeLabel(size: number): string {
    if (size !== PAGE_SIZE_ALL) {
      return String(size);
    }
    return this.length > 0 ? `All (${this.length})` : 'All';
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

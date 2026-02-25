import { Injectable, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';

export class TailwindPageEvent {
  pageIndex: number = 0;
  pageSize: number = 50;
  length: number = 0;
  previousPageIndex?: number;

  constructor(data?: Partial<TailwindPageEvent>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}

export class TailwindPaginator {
  private _pageIndex = 0;
  private _length = 0;
  private _pageSize = 50;
  private _pageSizeOptions: number[] = [25, 50, 100];

  readonly page = new EventEmitter<TailwindPageEvent>();

  get pageIndex(): number {
    return this._pageIndex;
  }

  set pageIndex(value: number) {
    this._pageIndex = Math.max(0, Math.min(value, this.getNumberOfPages() - 1));
  }

  get length(): number {
    return this._length;
  }

  set length(value: number) {
    this._length = value;
    this._updateDisplayedPageSizeOptions();
  }

  get pageSize(): number {
    return this._pageSize;
  }

  set pageSize(value: number) {
    this._pageSize = value;
    this._updateDisplayedPageSizeOptions();
  }

  get pageSizeOptions(): number[] {
    return this._pageSizeOptions;
  }

  set pageSizeOptions(value: number[]) {
    this._pageSizeOptions = (value || []).map(p => Math.max(0, p));
    this._updateDisplayedPageSizeOptions();
  }

  hasPreviousPage(): boolean {
    return this.pageIndex >= 1 && this.pageSize !== 0;
  }

  hasNextPage(): boolean {
    const maxPageIndex = this.getNumberOfPages() - 1;
    return this.pageIndex < maxPageIndex && this.pageSize !== 0;
  }

  getNumberOfPages(): number {
    if (!this.pageSize) {
      return 0;
    }
    return Math.ceil(this.length / this.pageSize);
  }

  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }
    const previousPageIndex = this.pageIndex;
    this.pageIndex++;
    this._emitPageEvent(previousPageIndex);
  }

  previousPage(): void {
    if (!this.hasPreviousPage()) {
      return;
    }
    const previousPageIndex = this.pageIndex;
    this.pageIndex--;
    this._emitPageEvent(previousPageIndex);
  }

  firstPage(): void {
    if (!this.hasPreviousPage()) {
      return;
    }
    const previousPageIndex = this.pageIndex;
    this.pageIndex = 0;
    this._emitPageEvent(previousPageIndex);
  }

  lastPage(): void {
    if (!this.hasNextPage()) {
      return;
    }
    const previousPageIndex = this.pageIndex;
    this.pageIndex = this.getNumberOfPages() - 1;
    this._emitPageEvent(previousPageIndex);
  }

  changePageSize(pageSize: number): void {
    const startIndex = this.pageIndex * this.pageSize;
    const previousPageIndex = this.pageIndex;

    this.pageIndex = Math.floor(startIndex / pageSize) || 0;
    this.pageSize = pageSize;
    this._emitPageEvent(previousPageIndex);
  }

  private _emitPageEvent(previousPageIndex: number): void {
    this.page.emit({
      previousPageIndex,
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.length
    });
  }

  private _updateDisplayedPageSizeOptions(): void {
    if (!this._pageSizeOptions.includes(this._pageSize) && this._pageSize > 0) {
      this._pageSizeOptions.push(this._pageSize);
      this._pageSizeOptions.sort((a, b) => a - b);
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindPaginatorService {

  createPaginator(): TailwindPaginator {
    return new TailwindPaginator();
  }
}
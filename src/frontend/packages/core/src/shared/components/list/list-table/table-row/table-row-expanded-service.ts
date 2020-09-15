import { Injectable } from '@angular/core';

@Injectable()
export class TableRowExpandedService {

  static allExpanderState = 'all-state';

  public expanded: {
    [rowId: string]: boolean
  } = {};

  public expandAll() {
    Object.keys(this.expanded).forEach(id => this.expanded[id] = true);
  }

  public collapseAll() {
    Object.keys(this.expanded).forEach(id => this.expanded[id] = false);
  }

  public expand(id: string) {
    this.expanded[id] = true;
  }

  public collapse(id: string) {
    this.expanded[id] = false;
  }

  public toggleHeader(): boolean {
    const expanded = this.toggle(TableRowExpandedService.allExpanderState);
    if (expanded) {
      this.expandAll();
    } else {
      this.collapseAll();
    }
    return expanded;
  }

  public toggle(id: string): boolean {
    this.expanded[id] = !this.expanded[id];
    return this.expanded[id];
  }
}

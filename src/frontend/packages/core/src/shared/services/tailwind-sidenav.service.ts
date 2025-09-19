import { Injectable, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

export interface TailwindSidenavConfig {
  mode?: 'over' | 'push' | 'side';
  position?: 'start' | 'end';
  disableClose?: boolean;
  autoFocus?: boolean;
}

export class TailwindSidenav {
  private _opened = false;
  private _openedChange = new EventEmitter<boolean>();

  mode: 'over' | 'push' | 'side' = 'over';
  position: 'start' | 'end' = 'start';
  disableClose = false;
  autoFocus = true;

  get opened(): boolean {
    return this._opened;
  }

  set opened(value: boolean) {
    if (this._opened !== value) {
      this._opened = value;
      this._openedChange.emit(value);
    }
  }

  get openedChange(): Observable<boolean> {
    return this._openedChange.asObservable();
  }

  open(): Promise<void> {
    this.opened = true;
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.opened = false;
    return Promise.resolve();
  }

  toggle(): Promise<void> {
    return this.opened ? this.close() : this.open();
  }
}

@Injectable({
  providedIn: 'root'
})
export class TailwindSidenavService {

  createSidenav(config?: TailwindSidenavConfig): TailwindSidenav {
    const sidenav = new TailwindSidenav();

    if (config) {
      if (config.mode) sidenav.mode = config.mode;
      if (config.position) sidenav.position = config.position;
      if (config.disableClose !== undefined) sidenav.disableClose = config.disableClose;
      if (config.autoFocus !== undefined) sidenav.autoFocus = config.autoFocus;
    }

    return sidenav;
  }
}
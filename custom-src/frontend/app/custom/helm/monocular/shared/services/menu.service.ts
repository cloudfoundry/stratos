import { Injectable } from '@angular/core';
import { of as observableOf, Subject } from 'rxjs';


@Injectable()
export class MenuService {
  // Emitter
  private menuOpenSource = new Subject<boolean>();
  private open: boolean = false;
  // Observable boolean streams
  public menuOpen$ = this.menuOpenSource.asObservable();

  showMenu() {
    this.open = true;
    this.menuOpenSource.next(this.open);
  }

  hideMenu() {
    this.open = false;
    this.menuOpenSource.next(this.open);
  }

  // Service message commands
  toggleMenu() {
    this.open = !this.open;
    this.menuOpenSource.next(this.open);
  }
}

import { startWith } from 'rxjs/operators/startWith';
import { AfterViewInit, Component, Input, ViewChild, ElementRef } from '@angular/core';
import { MatTabNav } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { debounceTime, map, distinctUntilChanged, timeInterval, tap, switchMap } from 'rxjs/operators';

import { ISubHeaderTabs } from './page-subheader.types';
import { interval } from 'rxjs/observable/interval';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-page-subheader',
  templateUrl: './page-subheader.component.html',
  styleUrls: ['./page-subheader.component.scss']
})
export class PageSubheaderComponent {
  cssClass: string;

  @ViewChild('nav')
  nav: MatTabNav;

  @ViewChild('navOuter')
  navOuter: ElementRef;

  @ViewChild('navScroller')
  navScroller: ElementRef;

  @Input('tabs')
  tabs: ISubHeaderTabs[];

  @Input('nested')
  nested: boolean;

  public navOverflowing$: Observable<boolean>;

  className: string;

  scrollSub: Subscription;

  private scrollSpeed = 10;

  constructor() {
    this.className = this.nested ? 'nested-tab' : 'page-subheader';
    if (!!this.tabs) {
      this.cssClass = this.nested ? 'nested-tab__tabs' : 'page-subheader__tabs';
    }
    this.navOverflowing$ = fromEvent(window, 'resize').pipe(
      debounceTime(100),
      map(this.navIsOverflowing),
      startWith(this.navIsOverflowing()),
      distinctUntilChanged()
    );
  }

  private navIsOverflowing = () => {
    if (this.navOuter) {
      const { offsetWidth } = this.navOuter.nativeElement;
      const navWith = this.nav._elementRef.nativeElement.offsetWidth;
      console.log(navWith, offsetWidth);
      return navWith > offsetWidth;
    }
    return false;
  }

  public scrollNav(direction: 'left' | 'right', event: Event) {
    event.preventDefault();
    const initialScrollTime = 81;
    let scrollTime = 80;
    this._scrollNav(direction);
    this.scrollSub = interval(initialScrollTime)
      .pipe(
        switchMap(() => {
          return interval(scrollTime).pipe(
            tap(() => {
              this._scrollNav(direction);
              if (scrollTime >= 20) {
                scrollTime -= 5;
              }
            })
          );
        })
      ).subscribe();
  }

  public scrollNavClick(direction: 'left' | 'right', event: Event) {
    event.preventDefault();
    this._scrollNav(direction);
  }

  private _scrollNav(direction: 'left' | 'right') {
    if (direction === 'left') {
      this.navScroller.nativeElement.scrollLeft -= this.scrollSpeed;
    } else {
      this.navScroller.nativeElement.scrollLeft += this.scrollSpeed;
    }
  }

  endScrollNav() {
    if (this.scrollSub) {
      this.scrollSub.unsubscribe();
    }
  }
}

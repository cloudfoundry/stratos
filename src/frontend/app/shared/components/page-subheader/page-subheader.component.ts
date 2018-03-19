import { startWith } from 'rxjs/operators/startWith';
import { AfterViewInit, Component, Input, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { MatTabNav } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { debounceTime, map, distinctUntilChanged, timeInterval, tap, switchMap, delay } from 'rxjs/operators';

import { ISubHeaderTabs } from './page-subheader.types';
import { interval } from 'rxjs/observable/interval';
import { Subscription } from 'rxjs/Subscription';
import { empty } from 'rxjs/observable/empty';

@Component({
  selector: 'app-page-subheader',
  templateUrl: './page-subheader.component.html',
  styleUrls: ['./page-subheader.component.scss']
})
export class PageSubheaderComponent implements AfterViewInit, OnDestroy {
  resizeSub: Subscription;
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

  public isOverflowing = false;

  className: string;

  scrollSub: Subscription;

  private scrollSpeed = 5;

  constructor() {
    this.className = this.nested ? 'nested-tab' : 'page-subheader';
    if (!!this.tabs) {
      this.cssClass = this.nested ? 'nested-tab__tabs' : 'page-subheader__tabs';
    }
  }

  ngAfterViewInit() {
    this.resizeSub = fromEvent(window, 'resize').pipe(
      debounceTime(100),
      tap(this.setNavOverflow),
    ).subscribe();
    // Had to do this to ensure the check got the correct size.
    // We should try to fix this at some point
    setTimeout(() => {
      this.setNavOverflow();
    });
  }

  private setNavOverflow = () => {
    this.isOverflowing = this.navIsOverflowing();
  }

  private navIsOverflowing() {
    if (this.navOuter) {
      const { offsetWidth } = this.navOuter.nativeElement;
      const navWith = this.nav._elementRef.nativeElement.offsetWidth;
      return navWith > offsetWidth;
    }
    return false;
  }

  public scrollNav(direction: 'left' | 'right', event: Event) {
    event.preventDefault();
    const initialScrollTime = 51;
    let scrollTime = 50;
    this._scrollNav(direction);
    this.scrollSub = interval(initialScrollTime)
      .pipe(
        switchMap(() => {
          return interval(scrollTime).pipe(
            tap(() => {
              this._scrollNav(direction);
              if (scrollTime >= 8) {
                scrollTime -= 2;
              }
            })
          );
        })
      ).subscribe();
  }

  private _scrollNav(direction: 'left' | 'right') {
    if (direction === 'left') {
      this.navScroller.nativeElement.scrollLeft -= this.scrollSpeed;
    } else {
      this.navScroller.nativeElement.scrollLeft += this.scrollSpeed;
    }
  }

  endScrollNav() {
    this.stopScroll();
  }

  private stopScroll() {
    if (this.scrollSub) {
      this.scrollSub.unsubscribe();
    }
  }

  ngOnDestroy() {
    this.resizeSub.unsubscribe();
    this.stopScroll();
  }
}

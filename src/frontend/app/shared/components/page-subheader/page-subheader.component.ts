import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild, AfterContentInit } from '@angular/core';
import { MatTabNav, MatButton } from '@angular/material';
import { fromEvent, interval, Subscription } from 'rxjs';
import { debounceTime, filter, tap, distinctUntilChanged, delay } from 'rxjs/operators';

import { ISubHeaderTabs } from './page-subheader.types';

import { getScrollBarWidth } from '../../../core/helper-classes/dom-helpers';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { selectSideNavState } from '../../../store/selectors/dashboard.selectors';

@Component({
  selector: 'app-page-subheader',
  templateUrl: './page-subheader.component.html',
  styleUrls: ['./page-subheader.component.scss']
})
export class PageSubheaderComponent implements AfterViewInit, OnDestroy {
  cssClass: string;

  @ViewChild('nav')
  nav: MatTabNav;

  @ViewChild('navOuter')
  navOuter: ElementRef;

  @ViewChild('navScroller')
  navScroller: ElementRef;

  @ViewChild('leftButton')
  leftButton: MatButton;

  @ViewChild('rightButton')
  rightButton: MatButton;

  @Input()
  tabs: ISubHeaderTabs[];

  @Input()
  nested: boolean;

  className: string;

  // Nav scroll related properties.

  public scrollBarWidth: number;

  public isOverflowing = false;

  public disableLeft = false;

  public disableRight = false;

  readonly maxScrollSpeed = 40;

  readonly minScrollSpeed = 1;

  private scrollSub: Subscription;

  private boundCheckSub: Subscription;

  private resizeSub: Subscription;

  private sidebarStateChangeSub: Subscription;

  // ***

  constructor(private store: Store<AppState>) {
    // We use this to hide the navbar.
    this.scrollBarWidth = getScrollBarWidth();
    this.className = this.nested ? 'nested-tab' : 'page-subheader';
    if (!!this.tabs) {
      this.cssClass = this.nested ? 'nested-tab__tabs' : 'page-subheader__tabs';
    }
  }

  public ngAfterViewInit() {
    // TODO: Doing this timeout to fix https://github.com/angular/angular/issues/21788
    // Remove this when we're happy with the fix - NJ
    setTimeout(() => {
      this.checkNavOverflow(false);
    });
    this.resizeSub = fromEvent(window, 'resize').pipe(
      debounceTime(100),
      tap(() => this.checkNavOverflow())
    ).subscribe();

    // We do an overflow check when the navbar state changes as this
    // can effect the whole page layout.
    this.sidebarStateChangeSub = this.store.select(selectSideNavState).pipe(
      delay(250),
      tap(this.checkNavOverflow)
    ).subscribe();

    if (this.navScroller) {
      this.boundCheckSub = fromEvent(this.navScroller.nativeElement, 'scroll').pipe(
        tap(this.checkScrollBounds),
      ).subscribe();
    }
  }

  public ngOnDestroy() {
    this.resizeSub.unsubscribe();
    this.sidebarStateChangeSub.unsubscribe();
    if (this.boundCheckSub) {
      this.boundCheckSub.unsubscribe();
    }
    this.stopScroll();
  }

  public startScroll(direction: 'left' | 'right', event: Event) {
    event.preventDefault();
    this.stopScroll();
    this.scrollNav(direction);
    let speedModifier = 0.1;
    this.scrollSub = interval(50)
      .pipe(
        tap(() => {
          const easing = this.easeInQuad(speedModifier);
          const speed = this.normalizeSpeed(easing);
          this.scrollNav(direction, speed);
        }),
        filter(() => speedModifier < 1),
        tap(() => speedModifier = Math.min(speedModifier + 0.1, 1))
      ).subscribe();
  }

  public stopScroll() {
    if (this.scrollSub) {
      this.scrollSub.unsubscribe();
    }
  }

  private checkNavOverflow = (checkBounds = true) => {
    this.isOverflowing = this.navIsOverflowing();
    if (checkBounds === true) {
      this.checkScrollBounds();
    }
  }

  private navIsOverflowing() {
    if (this.navOuter) {
      const avaliableWidth = this.navOuter.nativeElement.offsetWidth;
      const navFullWidth = this.nav._elementRef.nativeElement.offsetWidth;
      return avaliableWidth < navFullWidth;
    }
    return false;
  }


  private scrollNav(direction: 'left' | 'right', speed: number = 1) {
    if (direction === 'left') {
      this.navScroller.nativeElement.scrollLeft -= speed;
    } else {
      this.navScroller.nativeElement.scrollLeft += speed;
    }
    this.checkScrollBounds();
  }

  /**
   * Checks if we should disable any of the scroll arrows.
   */
  private checkScrollBounds = () => {
    const { scrollLeft } = this.navScroller.nativeElement;
    if (this.navScrolledFarLeft()) {
      this.disableRight = false;
      this.disableLeft = true;
      this.stopScroll();
    } else if (this.navScrolledFarRight()) {
      this.disableLeft = false;
      this.disableRight = true;
      this.stopScroll();
    } else {
      this.disableLeft = false;
      this.disableRight = false;
    }
  }

  private navScrolledFarRight() {
    const { scrollLeft } = this.navScroller.nativeElement;
    return this.nav._elementRef.nativeElement.offsetWidth === (this.navScroller.nativeElement.offsetWidth + scrollLeft);
  }

  private navScrolledFarLeft() {
    const { scrollLeft } = this.navScroller.nativeElement;
    return scrollLeft === 0;
  }

  private easeInQuad = (t) => t * t;

  private normalizeSpeed = speed => (speed * (this.maxScrollSpeed - this.minScrollSpeed)) + this.minScrollSpeed;
}

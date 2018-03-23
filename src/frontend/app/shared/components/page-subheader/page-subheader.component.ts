import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';
import { MatTabNav } from '@angular/material';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { interval } from 'rxjs/observable/interval';
import { debounceTime, filter, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { ISubHeaderTabs } from './page-subheader.types';

import { getScrollBarWidth } from '../../../core/helper-classes/dom-helpers';

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

  @Input('tabs')
  tabs: ISubHeaderTabs[];

  @Input('nested')
  nested: boolean;

  className: string;

  // Nav scroll related properties.

  public isOverflowing = false;

  public disableLeft = false;

  public disableRight = false;

  readonly maxScrollSpeed = 45;

  readonly minScrollSpeed = 1;

  private scrollSub: Subscription;

  private boundCheckSub: Subscription;

  private resizeSub: Subscription;

  public scrollBarWidth: number;

  // ***

  constructor() {
    // We use this to hide the navbar.
    this.scrollBarWidth = getScrollBarWidth();
    this.className = this.nested ? 'nested-tab' : 'page-subheader';
    if (!!this.tabs) {
      this.cssClass = this.nested ? 'nested-tab__tabs' : 'page-subheader__tabs';
    }
  }

  ngAfterViewInit() {
    this.resizeSub = fromEvent(window, 'resize').pipe(
      debounceTime(100),
      tap(this.checkNavOverflow),
    ).subscribe();

    this.boundCheckSub = fromEvent(this.navScroller.nativeElement, 'scroll').pipe(
      tap(this.checkScrollBounds),
    ).subscribe();
    // Had to do this to ensure the check got the correct size.
    // We should try to fix this at some point
    setTimeout(() => {
      this.checkNavOverflow();
    });
  }

  private checkNavOverflow = () => {
    this.isOverflowing = this.navIsOverflowing();
    this.checkScrollBounds();
  }

  private navIsOverflowing() {
    if (this.navOuter) {
      const { offsetWidth } = this.navOuter.nativeElement;
      const navWith = this.nav._elementRef.nativeElement.offsetWidth;
      return navWith > offsetWidth;
    }
    return false;
  }

  public startScroll(direction: 'left' | 'right', event: Event) {
    event.preventDefault();
    this.stopScroll();
    this.scrollNav(direction);
    let speedModifier = 0.1;
    this.scrollSub = interval(50)
      .pipe(
        tap(() => {
          const easing = this.easeInCubic(speedModifier);
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

  private easeInCubic = (t) => t * t * t;

  private normalizeSpeed = speed => (speed * (this.maxScrollSpeed - this.minScrollSpeed)) + this.minScrollSpeed;

  ngOnDestroy() {
    this.resizeSub.unsubscribe();
    this.boundCheckSub.unsubscribe();
    this.stopScroll();
  }
}

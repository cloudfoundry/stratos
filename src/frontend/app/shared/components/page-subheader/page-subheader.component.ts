import { startWith } from 'rxjs/operators/startWith';
import { AfterViewInit, Component, Input, ViewChild, ElementRef } from '@angular/core';
import { MatTabNav } from '@angular/material';
import { Observable } from 'rxjs/Observable';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';

import { ISubHeaderTabs } from './page-subheader.types';

@Component({
  selector: 'app-page-subheader',
  templateUrl: './page-subheader.component.html',
  styleUrls: ['./page-subheader.component.scss']
})
export class PageSubheaderComponent implements AfterViewInit {
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

  private scrollSpeed = 10;

  constructor() {
    this.className = this.nested ? 'nested-tab' : 'page-subheader';
    if (!!this.tabs) {
      this.cssClass = this.nested ? 'nested-tab__tabs' : 'page-subheader__tabs';
    }
  }
  ngAfterViewInit() {
    this.navOverflowing$ = fromEvent(window, 'resize').pipe(
      debounceTime(100),
      map(this.navIsOverflowing),
      startWith(this.navIsOverflowing()),
      distinctUntilChanged()
    );
  }
  private navIsOverflowing = () => {
    const { offsetWidth } = this.navOuter.nativeElement;
    const navWith = this.nav._elementRef.nativeElement.offsetWidth;
    console.log(navWith, offsetWidth);
    return navWith > offsetWidth;
  }

  public scrollNav(direction: 'left' | 'right') {
    if (direction === 'left') {
      this.navScroller.nativeElement.scrollLeft -= this.scrollSpeed;
    } else {
      this.navScroller.nativeElement.scrollLeft += this.scrollSpeed;
    }
  }
}

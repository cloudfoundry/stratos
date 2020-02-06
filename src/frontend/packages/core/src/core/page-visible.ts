import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';

class HiddenKeyConstant {
  static DEFAULT = 'hidden';
  static MS = 'msHidden';
  static WEB_KIT = 'webkitHidden';
}

class VisibilityStatusConstant {
  static VISIBLE = 'visible';
  static HIDDEN = 'hidden';
  static PRERENDER = 'prerender';
  static UNLOADED = 'unloaded';
}

export class PageVisible {
  private hidden: string;
  private visibilityState: string;
  // private visibilityChanged: string;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.defineBrowserSupport();
  }

  isPageVisible(): boolean {
    return VisibilityStatusConstant.VISIBLE === this.getVisibilityState() || !this.isHidden();
  }

  isPageHidden(): boolean {
    return VisibilityStatusConstant.HIDDEN === this.getVisibilityState() || this.isHidden();
  }

  // nowVisible(): Observable<any> {
  //   return this.getVisibility().pipe(
  //     startWith(false),
  //     pairwise(),
  //     filter(([oldV, newV]) => oldV === false && newV === true)
  //   );
  // }

  // getVisibility(): Observable<boolean> {
  //   return fromEvent(document, this.visibilityChanged).pipe(
  //     map(() => this.isPageVisible())
  //   );
  // }

  private isHidden(): boolean {
    return document[this.hidden];
  }

  private getVisibilityState(): string {
    return document[this.visibilityState];
  }

  private defineBrowserSupport() {
    if (typeof document[HiddenKeyConstant.DEFAULT] !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
      this.hidden = HiddenKeyConstant.DEFAULT;
      this.visibilityState = 'visibilityState';
      // this.visibilityChanged = 'visibilitychange';
    } else if (typeof document[HiddenKeyConstant.MS] !== 'undefined') {
      this.hidden = HiddenKeyConstant.MS;
      this.visibilityState = 'msVisibilityState';
      // this.visibilityChanged = 'msvisibilitychange';
    } else if (typeof document[HiddenKeyConstant.WEB_KIT] !== 'undefined') {
      this.hidden = HiddenKeyConstant.WEB_KIT;
      this.visibilityState = 'webkitVisibilityState';
      // this.visibilityChanged = 'webkitvisibilitychange';
    }
  }
}

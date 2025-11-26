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

// Extended document interface for vendor-prefixed visibility API properties
interface ExtendedDocument {
  readonly hidden?: boolean;
  readonly msHidden?: boolean;
  readonly webkitHidden?: boolean;
  readonly visibilityState?: string;
  readonly msVisibilityState?: string;
  readonly webkitVisibilityState?: string;
}

export class PageVisible {
  private hidden!: string;
  private visibilityState!: string;
  // private visibilityChanged: string;

  constructor(@Inject(DOCUMENT) _document: Document) {
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
    return (document as ExtendedDocument)[this.hidden as keyof ExtendedDocument] as boolean;
  }

  private getVisibilityState(): string {
    return (document as ExtendedDocument)[this.visibilityState as keyof ExtendedDocument] as string;
  }

  private defineBrowserSupport() {
    const doc = document as ExtendedDocument;
    if (typeof doc[HiddenKeyConstant.DEFAULT as keyof ExtendedDocument] !== 'undefined') { // Opera 12.10 and Firefox 18 and later support
      this.hidden = HiddenKeyConstant.DEFAULT;
      this.visibilityState = 'visibilityState';
      // this.visibilityChanged = 'visibilitychange';
    } else if (typeof doc[HiddenKeyConstant.MS as keyof ExtendedDocument] !== 'undefined') {
      this.hidden = HiddenKeyConstant.MS;
      this.visibilityState = 'msVisibilityState';
      // this.visibilityChanged = 'msvisibilitychange';
    } else if (typeof doc[HiddenKeyConstant.WEB_KIT as keyof ExtendedDocument] !== 'undefined') {
      this.hidden = HiddenKeyConstant.WEB_KIT;
      this.visibilityState = 'webkitVisibilityState';
      // this.visibilityChanged = 'webkitvisibilitychange';
    }
  }
}

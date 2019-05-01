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

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.defineBrowserSupport();
  }

  isPageVisible(): boolean {
    return VisibilityStatusConstant.VISIBLE === this.getVisibilityState() || !this.isHidden();
  }

  isPageHidden(): boolean {
    return VisibilityStatusConstant.HIDDEN === this.getVisibilityState() || this.isHidden();
  }

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
    } else if (typeof document[HiddenKeyConstant.MS] !== 'undefined') {
      this.hidden = HiddenKeyConstant.MS;
      this.visibilityState = 'msVisibilityState';
    } else if (typeof document[HiddenKeyConstant.WEB_KIT] !== 'undefined') {
      this.hidden = HiddenKeyConstant.WEB_KIT;
      this.visibilityState = 'webkitVisibilityState';
    }
  }
}

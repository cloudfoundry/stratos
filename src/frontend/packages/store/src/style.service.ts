import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StyleService {

  private rules: string[] = [];
  constructor() {
    this.rules = this.getAllSelectors();
  }

  hasSelector = (selector) => {
    return !!this.rules.find(ruleSelector => ruleSelector === selector);
  }

  private getAllSelectors = (): string[] => {
    const ret = [];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < document.styleSheets.length; i++) {
      const styleSheet = document.styleSheets[i];
      if (!(styleSheet instanceof CSSStyleSheet)) {
        continue;
      }
      const rules = styleSheet.rules || styleSheet.cssRules;
      // tslint:disable-next-line:prefer-for-of
      for (let y = 0; y < rules.length; y++) {
        const rule = rules[y];
        if (!(rule instanceof CSSStyleRule)) {
          continue;
        }
        if (typeof rule.selectorText === 'string') { ret.push(rule.selectorText); }
      }
    }
    return ret;
  }

}
